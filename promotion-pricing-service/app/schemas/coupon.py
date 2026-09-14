from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from pydantic import Field
from app.schemas.common import BaseSchema
from app.schemas.pricing import PricingCalculateItem

class CouponCreateDto(BaseSchema):
    promotion_id: str = Field(..., alias="promotionId")
    code: str = Field(..., min_length=2, max_length=50)
    usage_limit: Optional[int] = Field(None, alias="usageLimit", ge=1)
    per_user_limit: int = Field(1, alias="perUserLimit", ge=1)
    expires_at: Optional[datetime] = Field(None, alias="expiresAt")

class CouponResponseDto(BaseSchema):
    id: str
    promotion_id: str = Field(..., alias="promotionId")
    code: str
    status: str
    usage_limit: Optional[int] = Field(None, alias="usageLimit")
    usage_count: int = Field(..., alias="usageCount")
    per_user_limit: int = Field(..., alias="perUserLimit")
    expires_at: Optional[datetime] = Field(None, alias="expiresAt")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

class CouponValidateRequest(BaseSchema):
    code: str
    user_id: Optional[str] = Field(None, alias="userId")
    items: List[PricingCalculateItem]

class CouponValidateResponse(BaseSchema):
    valid: bool
    code: str
    discount: Decimal
    currency: str = "USD"
    promotion_id: Optional[str] = Field(None, alias="promotionId")
    message: Optional[str] = None

class CouponRecordUsageRequest(BaseSchema):
    code: str
    user_id: str = Field(..., alias="userId")
    order_id: Optional[str] = Field(None, alias="orderId")
    discount_amount: Decimal = Field(..., alias="discountAmount", ge=0)

class PromotionUsageResponseDto(BaseSchema):
    id: str
    promotion_id: str = Field(..., alias="promotionId")
    coupon_id: Optional[str] = Field(None, alias="couponId")
    user_id: str = Field(..., alias="userId")
    order_id: Optional[str] = Field(None, alias="orderId")
    discount_amount: Decimal = Field(..., alias="discountAmount")
    used_at: datetime = Field(..., alias="usedAt")
