from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from pydantic import Field
from app.schemas.common import BaseSchema, PromotionType, PromotionStatus

class PromotionTargetDto(BaseSchema):
    id: Optional[str] = None
    target_type: str = Field(..., alias="targetType") # PRODUCT, VARIANT, CATEGORY, BRAND, ORDER, CUSTOMER
    target_id: str = Field(..., alias="targetId")

class PromotionRuleDto(BaseSchema):
    id: Optional[str] = None
    rule_type: str = Field(..., alias="ruleType")
    operator: str
    value: str

class PromotionCreateDto(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    type: PromotionType
    discount_value: Decimal = Field(..., alias="discountValue", ge=0)
    buy_quantity: Optional[int] = Field(None, alias="buyQuantity", ge=1)
    get_quantity: Optional[int] = Field(None, alias="getQuantity", ge=1)
    description: Optional[str] = None
    start_at: Optional[datetime] = Field(None, alias="startAt")
    end_at: Optional[datetime] = Field(None, alias="endAt")
    usage_limit: Optional[int] = Field(None, alias="usageLimit", ge=1)
    per_user_limit: int = Field(1, alias="perUserLimit", ge=1)
    min_order_amount: Optional[Decimal] = Field(None, alias="minOrderAmount", ge=0)
    max_discount_amount: Optional[Decimal] = Field(None, alias="maxDiscountAmount", ge=0)
    is_stackable: bool = Field(False, alias="isStackable")
    priority: int = 0
    targets: List[PromotionTargetDto] = Field(default_factory=list)
    rules: List[PromotionRuleDto] = Field(default_factory=list)

class PromotionUpdateDto(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_value: Optional[Decimal] = Field(None, alias="discountValue")
    start_at: Optional[datetime] = Field(None, alias="startAt")
    end_at: Optional[datetime] = Field(None, alias="endAt")
    usage_limit: Optional[int] = Field(None, alias="usageLimit")
    per_user_limit: Optional[int] = Field(None, alias="perUserLimit")
    min_order_amount: Optional[Decimal] = Field(None, alias="minOrderAmount")
    max_discount_amount: Optional[Decimal] = Field(None, alias="maxDiscountAmount")
    is_stackable: Optional[bool] = Field(None, alias="isStackable")
    priority: Optional[int] = None

class PromotionResponseDto(BaseSchema):
    id: str
    name: str
    code: Optional[str] = None
    type: str
    status: str
    priority: int
    discount_value: Decimal = Field(..., alias="discountValue")
    buy_quantity: Optional[int] = Field(None, alias="buyQuantity")
    get_quantity: Optional[int] = Field(None, alias="getQuantity")
    description: Optional[str] = None
    start_at: Optional[datetime] = Field(None, alias="startAt")
    end_at: Optional[datetime] = Field(None, alias="endAt")
    usage_limit: Optional[int] = Field(None, alias="usageLimit")
    usage_count: int = Field(..., alias="usageCount")
    per_user_limit: int = Field(..., alias="perUserLimit")
    min_order_amount: Optional[Decimal] = Field(None, alias="minOrderAmount")
    max_discount_amount: Optional[Decimal] = Field(None, alias="maxDiscountAmount")
    is_stackable: bool = Field(..., alias="isStackable")
    targets: List[PromotionTargetDto] = Field(default_factory=list)
    rules: List[PromotionRuleDto] = Field(default_factory=list)
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
