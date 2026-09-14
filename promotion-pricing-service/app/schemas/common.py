from enum import Enum
from pydantic import BaseModel, ConfigDict

class PromotionType(str, Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED_AMOUNT = "FIXED_AMOUNT"
    BUY_X_GET_Y = "BUY_X_GET_Y"
    FREE_SHIPPING = "FREE_SHIPPING"
    CATEGORY_DISCOUNT = "CATEGORY_DISCOUNT"
    PRODUCT_DISCOUNT = "PRODUCT_DISCOUNT"
    ORDER_DISCOUNT = "ORDER_DISCOUNT"

class PromotionStatus(str, Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class CouponStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    EXPIRED = "EXPIRED"

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )
