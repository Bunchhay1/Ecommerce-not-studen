from typing import Any, Optional
from fastapi import HTTPException, status


class RecommendationException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Any] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "errorCode": error_code,
                "message": message,
                "details": details,
            },
        )
        self.error_code = error_code
        self.message = message
        self.details = details


RecommendationServiceException = RecommendationException


class RecommendationNotFoundException(RecommendationException):
    def __init__(self, message: str = "No recommendations found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RECOMMENDATION_NOT_FOUND",
            message=message,
        )


class ProductNotFoundException(RecommendationException):
    def __init__(self, product_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="INVALID_PRODUCT_ID",
            message=f"Product '{product_id}' not found in candidate catalog",
        )


class InvalidRecommendationTypeException(RecommendationException):
    def __init__(self, rec_type: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_RECOMMENDATION_TYPE",
            message=f"Unsupported recommendation type: {rec_type}",
        )


class UnauthorizedException(RecommendationException):
    def __init__(self, message: str = "Authentication required for personalized recommendations"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED_REQUEST",
            message=message,
        )
