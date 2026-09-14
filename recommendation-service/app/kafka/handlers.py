import uuid
import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.interaction_repository import InteractionRepository
from app.repositories.relationship_repository import RelationshipRepository
from app.schemas.event import ProductCandidateUpsert
from app.schemas.interaction import InteractionCreate
from app.models.interaction import InteractionType
from app.models.product_relationship import RelationshipType
from app.ml.model_manager import model_manager
from app.cache.redis_cache import cache

logger = logging.getLogger("recommendation_service.kafka")


class EventHandler:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.candidate_repo = CandidateRepository(db)
        self.interaction_repo = InteractionRepository(db)
        self.rel_repo = RelationshipRepository(db)

    async def handle_catalog_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Handles product created, updated, or deleted events from Catalog Service.
        """
        try:
            prod_id = uuid.UUID(payload.get("product_id") or payload.get("id"))
            if event_type in ("ProductCreated", "ProductUpdated", "PRODUCT_CREATED", "PRODUCT_UPDATED"):
                cat_id_raw = payload.get("category_id")
                cat_id = uuid.UUID(cat_id_raw) if cat_id_raw else None

                data = ProductCandidateUpsert(
                    product_id=prod_id,
                    name=payload.get("name", ""),
                    description=payload.get("description"),
                    category_id=cat_id,
                    category_name=payload.get("category_name"),
                    price=float(payload.get("price", 0.0)),
                    brand=payload.get("brand"),
                    tags=payload.get("tags", []),
                    attributes=payload.get("attributes", {}),
                    is_active=payload.get("is_active", True),
                    is_in_stock=payload.get("is_in_stock", True),
                )
                await self.candidate_repo.upsert_candidate(data)
                # Invalidate product-level similarity cache
                await cache.delete_keys(f"rec:prod:{prod_id}:*")
                logger.info(f"Successfully synced product candidate {prod_id} from catalog event.")
            elif event_type in ("ProductDeleted", "PRODUCT_DELETED"):
                candidate = await self.candidate_repo.get_by_id(prod_id)
                if candidate:
                    candidate.is_active = False
                    await self.db.flush()
                await cache.delete_keys(f"rec:prod:{prod_id}:*")
        except Exception as e:
            logger.error(f"Error processing catalog event {event_type}: {e}", exc_info=True)

    async def handle_inventory_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Handles stock status changes.
        """
        try:
            prod_id = uuid.UUID(payload.get("product_id"))
            is_in_stock = payload.get("is_in_stock", True)
            if "quantity" in payload:
                is_in_stock = payload.get("quantity", 0) > 0
            await self.candidate_repo.update_stock(prod_id, is_in_stock)
        except Exception as e:
            logger.error(f"Error processing inventory event: {e}")

    async def handle_order_placed_event(self, payload: Dict[str, Any]) -> None:
        """
        Handles order placed events. Records purchase interactions and updates co-occurrences.
        """
        try:
            user_id_raw = payload.get("user_id")
            user_id = uuid.UUID(user_id_raw) if user_id_raw else None
            items: List[Dict[str, Any]] = payload.get("items", [])
            product_ids = []

            for item in items:
                pid = uuid.UUID(item.get("product_id"))
                product_ids.append(pid)

                # Record PURCHASE interaction
                interaction = InteractionCreate(
                    user_id=user_id,
                    product_id=pid,
                    interaction_type=InteractionType.PURCHASE,
                    metadata={"order_id": payload.get("order_id")},
                )
                await self.interaction_repo.create_interaction(interaction)

            # Invalidate user caches
            if user_id:
                await cache.delete_keys(f"rec:user:{user_id}:*")

            # Update co-occurrences for basket if more than 1 item
            if len(product_ids) > 1:
                model_manager.cooccurrence_engine.fit_transactions([product_ids])
                for i in range(len(product_ids)):
                    for j in range(len(product_ids)):
                        if i != j:
                            await self.rel_repo.upsert_relationship(
                                source_id=product_ids[i],
                                target_id=product_ids[j],
                                relationship_type=RelationshipType.BOUGHT_TOGETHER,
                                score=1.0,
                                support_count=1,
                            )
                            await cache.delete_keys(f"rec:prod:{product_ids[i]}:BOUGHT_TOGETHER*")
            logger.info(f"Processed order placed event with {len(product_ids)} items.")
        except Exception as e:
            logger.error(f"Error handling order event: {e}", exc_info=True)

    async def handle_review_created_event(self, payload: Dict[str, Any]) -> None:
        """
        Handles product reviews to update average rating and candidate score.
        """
        try:
            prod_id = uuid.UUID(payload.get("product_id"))
            rating = float(payload.get("rating", 5.0))
            await self.candidate_repo.update_rating(prod_id, rating)
            logger.info(f"Updated rating for product {prod_id} to include new rating {rating}.")
        except Exception as e:
            logger.error(f"Error handling review event: {e}")

    async def handle_interaction_event(self, payload: Dict[str, Any]) -> None:
        """
        Handles clickstream / view events published to Kafka.
        """
        try:
            user_id_raw = payload.get("user_id")
            user_id = uuid.UUID(user_id_raw) if user_id_raw else None
            prod_id = uuid.UUID(payload.get("product_id"))
            interaction_type_str = payload.get("interaction_type", "VIEW").upper()
            interaction_type = InteractionType(interaction_type_str)

            interaction = InteractionCreate(
                user_id=user_id,
                session_id=payload.get("session_id"),
                product_id=prod_id,
                interaction_type=interaction_type,
                duration_seconds=payload.get("duration_seconds"),
                metadata=payload.get("metadata", {}),
            )
            await self.interaction_repo.create_interaction(interaction)
        except Exception as e:
            logger.error(f"Error handling interaction event: {e}")
