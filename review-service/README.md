# Review / Rating Service — Core Service #11

## 1. Purpose & Domain Ownership

The **Review / Rating Service** manages customer reviews, ratings (1–5 stars), verified purchase checks, review media metadata, helpful/unhelpful voting, moderation, and incremental product rating summaries.

### Responsibility Boundaries:
- **Review Service owns**: Reviews, ratings, verified purchase status, helpful votes, review reports, and rating summaries.
- **Catalog Service owns**: Product base information (name, SKU, images, categories).
- **Order Service owns**: Orders, purchase records, and payments.
- **Search Service owns**: Product search and index filtering (consumes `RatingUpdated` events).

> **Verified Purchase Safeguard**: Verified purchase status is never trusted from client inputs. It is verified against purchase eligibility (`review_purchase_eligibility`) populated by Order delivery events or Order verification APIs.

---

## 2. Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL (`review_db` on port `5442`)
- **ORM**: Prisma ORM
- **Cache**: Redis (`port 6389`, keys: `rating:summary:{productId}`)
- **Event Broker**: Kafka (`review.events` on `localhost:9102`)
- **Testing**: Jest (`ts-jest`)
- **Documentation**: OpenAPI / Swagger (`/docs`)

---

## 3. Database Schema

- `reviews`: `id`, `product_id`, `variant_id`, `user_id`, `order_id`, `order_item_id`, `rating`, `title`, `content`, `status`, `verified_purchase`, `helpful_count`, `report_count`, `created_at`, `published_at`
- `product_rating_summaries`: `product_id` (PK), `total_reviews`, `rating_sum`, `average_rating`, `rating_1_count` .. `rating_5_count`, `updated_at`
- `review_media`: `id`, `review_id`, `media_type`, `url`, `storage_key`, `sort_order`
- `review_votes`: `id`, `review_id`, `user_id`, `vote` (Unique on `[review_id, user_id]`)
- `review_reports`: `id`, `review_id`, `user_id`, `reason`, `description`, `status`
- `review_purchase_eligibility`: `id`, `user_id`, `order_id`, `order_item_id`, `product_id`, `eligible`
- `outbox_events`: `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `status`

---

## 4. Incremental Rating Summaries

Rather than executing slow table-scanning `AVG()` aggregations across millions of rows:
- Adding a review increments `total_reviews`, adds `rating` to `rating_sum`, and increments the corresponding star bucket.
- Updating a rating adjusts the difference in `rating_sum` and shifts bucket counts.
- Deleting a review decrements the counts and deducts from `rating_sum`.
- Redis caches the summary under `rating:summary:{productId}` with a 10-minute TTL.

---

## 5. API Reference

### Customer APIs
- `POST /api/v1/reviews` (Create review with verified purchase check)
- `GET /api/v1/reviews/:id` (Get review details)
- `PATCH /api/v1/reviews/:id` (Update review & recalculate rating)
- `DELETE /api/v1/reviews/:id` (Soft-delete review & deduct rating)
- `GET /api/v1/products/:productId/reviews` (Paginated reviews with summary)
- `GET /api/v1/products/:productId/rating` (Direct rating summary)
- `POST /api/v1/reviews/:id/helpful` (Vote helpful)
- `DELETE /api/v1/reviews/:id/helpful` (Remove helpful vote)
- `POST /api/v1/reviews/:id/report` (Report inappropriate review)

### Admin & Moderation APIs
- `GET /api/v1/admin/reviews` (Filter by status: PENDING, PUBLISHED, FLAGGED, etc.)
- `GET /api/v1/admin/reviews/:id`
- `PATCH /api/v1/admin/reviews/:id/status` (Approve, reject, hide, restore)
- `GET /api/v1/admin/reports` (Audit reports)
- `PATCH /api/v1/admin/reports/:id` (Resolve or dismiss report)

### Health
- `GET /health`
- `GET /docs` (Swagger UI)

---

## 6. Running Locally & Testing

```bash
cd review-service

# Run unit tests
npm test

# Build bundle
npm run build

# Start with Docker Compose
docker-compose up -d
```
