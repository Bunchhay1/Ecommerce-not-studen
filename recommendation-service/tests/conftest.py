import uuid
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.models.base import Base
from app.models.product_candidate import ProductCandidate
from app.db.database import get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def sample_candidates(db_session: AsyncSession):
    phone_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    case_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
    charger_id = uuid.UUID("33333333-3333-3333-3333-333333333333")
    samsung_id = uuid.UUID("44444444-4444-4444-4444-444444444444")
    macbook_id = uuid.UUID("55555555-5555-5555-5555-555555555555")

    cat_phone = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    cat_acc = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
    cat_comp = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")

    products = [
        ProductCandidate(
            product_id=str(phone_id),
            name="Apple iPhone 15 Pro Max Titanium",
            description="Flagship Apple smartphone with titanium finish and A17 Pro chip.",
            category_id=str(cat_phone),
            category_name="Smartphones",
            brand_id=None,
            brand_name="Apple",
            price=1199.00,
            rating=4.8,
            rating_count=320,
            popularity_score=95.0,
            tags=["apple", "iphone", "ios", "flagship", "5g"],
            attributes={"color": "Natural Titanium", "storage": "256GB"},
            is_active=True,
            is_available=True,
        ),
        ProductCandidate(
            product_id=str(case_id),
            name="Apple iPhone 15 Silicone Case with MagSafe",
            description="Silicone case designed by Apple for iPhone 15 Pro Max with MagSafe charging support.",
            category_id=str(cat_acc),
            category_name="Accessories",
            brand_id=None,
            brand_name="Apple",
            price=49.00,
            rating=4.6,
            rating_count=150,
            popularity_score=80.0,
            tags=["apple", "iphone", "case", "magsafe", "protection"],
            attributes={"color": "Storm Blue"},
            is_active=True,
            is_available=True,
        ),
        ProductCandidate(
            product_id=str(charger_id),
            name="Apple 20W USB-C Fast Charger Power Adapter",
            description="Fast power adapter for iPhone and iPad with USB Type C interface.",
            category_id=str(cat_acc),
            category_name="Accessories",
            brand_id=None,
            brand_name="Apple",
            price=19.00,
            rating=4.7,
            rating_count=450,
            popularity_score=90.0,
            tags=["apple", "charger", "fast-charging", "usb-c", "adapter"],
            attributes={"wattage": "20W"},
            is_active=True,
            is_available=True,
        ),
        ProductCandidate(
            product_id=str(samsung_id),
            name="Samsung Galaxy S24 Ultra Android",
            description="Premium Android smartphone with Galaxy AI and S-Pen.",
            category_id=str(cat_phone),
            category_name="Smartphones",
            brand_id=None,
            brand_name="Samsung",
            price=1299.00,
            rating=4.7,
            rating_count=210,
            popularity_score=88.0,
            tags=["samsung", "galaxy", "android", "flagship", "ai"],
            attributes={"color": "Titanium Black"},
            is_active=True,
            is_available=True,
        ),
        ProductCandidate(
            product_id=str(macbook_id),
            name="Apple MacBook Pro 16-inch M3 Max",
            description="Professional laptop for power users and creators with Liquid Retina XDR display.",
            category_id=str(cat_comp),
            category_name="Computers",
            brand_id=None,
            brand_name="Apple",
            price=2499.00,
            rating=4.9,
            rating_count=95,
            popularity_score=85.0,
            tags=["apple", "macbook", "laptop", "m3", "pro"],
            attributes={"ram": "36GB", "storage": "512GB"},
            is_active=True,
            is_available=True,
        ),
    ]

    for p in products:
        db_session.add(p)
    await db_session.commit()

    return {
        "phone_id": phone_id,
        "case_id": case_id,
        "charger_id": charger_id,
        "samsung_id": samsung_id,
        "macbook_id": macbook_id,
        "cat_phone": cat_phone,
        "cat_acc": cat_acc,
        "cat_comp": cat_comp,
    }
