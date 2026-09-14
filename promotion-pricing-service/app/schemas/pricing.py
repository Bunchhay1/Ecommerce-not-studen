from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from pydantic import Field
from app.schemas.common import BaseSchema

class PricingCalculateItem(BaseSchema):
    product_id: Optional[str] = Field(None, alias="productId")
    variant_id: str = Field(..., alias="variantId")
    quantity: int = Field(..., ge=1)
    category_id: Optional[str] = Field(None, alias="categoryId")
    brand_id: Optional[str] = Field(None, alias="brandId")

class PricingCalculateRequest(BaseSchema):
    user_id: Optional[str] = Field(None, alias="userId")
    currency: str = Field("USD", max_length=10)
    items: List[PricingCalculateItem]
    coupon_code: Optional[str] = Field(None, alias="couponCode")

class ItemPriceBreakdown(BaseSchema):
    variant_id: str = Field(..., alias="variantId")
    product_id: Optional[str] = Field(None, alias="productId")
    quantity: int
    unit_price: Decimal = Field(..., alias="unitPrice")
    discount: Decimal
    final_unit_price: Decimal = Field(..., alias="finalUnitPrice")
    subtotal: Decimal

class AppliedPromotionDto(BaseSchema):
    promotion_id: str = Field(..., alias="promotionId")
    name: str
    code: Optional[str] = None
    discount: Decimal

class PricingCalculateResponse(BaseSchema):
    currency: str
    subtotal: Decimal
    discount: Decimal
    shipping_discount: Decimal = Field(Decimal("0.00"), alias="shippingDiscount")
    taxable_amount: Decimal = Field(..., alias="taxableAmount")
    total: Decimal
    items: List[ItemPriceBreakdown]
    applied_promotions: List[AppliedPromotionDto] = Field(default_factory=list, alias="appliedPromotions")

class ProductPriceCreateDto(BaseSchema):
    product_id: str = Field(..., alias="productId")
    variant_id: str = Field(..., alias="variantId")
    currency: str = Field("USD", max_length=10)
    base_price: Decimal = Field(..., alias="basePrice", ge=0)
    sale_price: Optional[Decimal] = Field(None, alias="salePrice", ge=0)
    status: str = "ACTIVE"
    effective_from: Optional[datetime] = Field(None, alias="effectiveFrom")
    effective_to: Optional[datetime] = Field(None, alias="effectiveTo")

class ProductPriceResponseDto(BaseSchema):
    id: str
    product_id: str = Field(..., alias="productId")
    variant_id: str = Field(..., alias="variantId")
    currency: str
    base_price: Decimal = Field(..., alias="basePrice")
    sale_price: Optional[Decimal] = Field(None, alias="salePrice")
    status: str
    effective_from: Optional[datetime] = Field(None, alias="effectiveFrom")
    effective_to: Optional[datetime] = Field(None, alias="effectiveTo")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
