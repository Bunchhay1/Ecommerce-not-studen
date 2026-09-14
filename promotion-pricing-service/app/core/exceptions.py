from typing import Optional, Any, Dict
from fastapi import HTTPException, status

class DomainException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "errorCode": error_code,
                "message": message,
                "details": details or {},
            },
        )
        self.error_code = error_code
        self.message = message
        self.details = details or {}

class PriceNotFoundException(DomainException):
    def __init__(self, variant_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="PRICE_NOT_FOUND",
            message=f"Price not found for variant '{variant_id}'",
            details={"variantId": variant_id},
        )

class PromotionNotFoundException(DomainException):
    def __init__(self, promotion_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="PROMOTION_NOT_FOUND",
            message=f"Promotion '{promotion_id}' not found",
            details={"promotionId": promotion_id},
        )

class PromotionExpiredException(DomainException):
    def __init__(self, promotion_id: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="PROMOTION_EXPIRED",
            message=f"Promotion '{promotion_id}' has expired",
            details={"promotionId": promotion_id},
        )

class PromotionNotActiveException(DomainException):
    def __init__(self, promotion_id: str, status_str: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="PROMOTION_NOT_ACTIVE",
            message=f"Promotion '{promotion_id}' is not active (current status: {status_str})",
            details={"promotionId": promotion_id, "status": status_str},
        )

class PromotionNotEligibleException(DomainException):
    def __init__(self, reason: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="PROMOTION_NOT_ELIGIBLE",
            message=f"Order/Items not eligible for promotion: {reason}",
            details={"reason": reason},
        )

class CouponNotFoundException(DomainException):
    def __init__(self, code: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="COUPON_NOT_FOUND",
            message=f"Coupon code '{code}' not found",
            details={"code": code},
        )

class CouponExpiredException(DomainException):
    def __init__(self, code: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="COUPON_EXPIRED",
            message=f"Coupon code '{code}' has expired",
            details={"code": code},
        )

class CouponDisabledException(DomainException):
    def __init__(self, code: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="COUPON_DISABLED",
            message=f"Coupon code '{code}' is disabled",
            details={"code": code},
        )

class CouponUsageLimitReachedException(DomainException):
    def __init__(self, code: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="COUPON_USAGE_LIMIT_REACHED",
            message=f"Coupon '{code}' total usage limit reached",
            details={"code": code},
        )

class CouponUserLimitReachedException(DomainException):
    def __init__(self, code: str, user_id: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="COUPON_USER_LIMIT_REACHED",
            message=f"User '{user_id}' has reached per-user usage limit for coupon '{code}'",
            details={"code": code, "userId": user_id},
        )

class CouponMinOrderNotMetException(DomainException):
    def __init__(self, code: str, min_amount: float, current_amount: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="COUPON_MIN_ORDER_NOT_MET",
            message=f"Coupon '{code}' requires a minimum order of {min_amount}, but cart subtotal is {current_amount}",
            details={"code": code, "minAmount": min_amount, "currentAmount": current_amount},
        )

class InvalidDiscountException(DomainException):
    def __init__(self, reason: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_DISCOUNT",
            message=f"Invalid discount: {reason}",
            details={"reason": reason},
        )

class InvalidCurrencyException(DomainException):
    def __init__(self, currency: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_CURRENCY",
            message=f"Unsupported currency: {currency}",
            details={"currency": currency},
        )

class DuplicateCouponException(DomainException):
    def __init__(self, code: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code="DUPLICATE_COUPON",
            message=f"Coupon code '{code}' already exists",
            details={"code": code},
        )

class UnauthorizedOperationException(DomainException):
    def __init__(self, reason: str = "Admin privilege required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="UNAUTHORIZED_OPERATION",
            message=reason,
            details={"reason": reason},
        )
