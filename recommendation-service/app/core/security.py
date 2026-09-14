from typing import Optional, Dict, Any
from fastapi import Header
import jwt
from app.core.config import settings
from app.core.exceptions import UnauthorizedException


def get_current_user_id_optional(
    authorization: Optional[str] = Header(None)
) -> Optional[str]:
    """
    Extracts user_id from Bearer JWT if provided, otherwise returns None for anonymous browsing.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization[7:]
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_signature": False},
        )
        return payload.get("sub") or payload.get("userId") or payload.get("id")
    except Exception:
        return None


def get_optional_current_user(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """
    Returns payload dictionary or None.
    """
    user_id = get_current_user_id_optional(authorization)
    if user_id:
        return {"sub": user_id}
    return None


def get_current_user_id_required(
    authorization: Optional[str] = Header(None)
) -> str:
    """
    Requires valid Bearer JWT.
    """
    user_id = get_current_user_id_optional(authorization)
    if not user_id:
        raise UnauthorizedException("Authentication token required for this recommendation operation")
    return user_id


def get_required_current_user(
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    user_id = get_current_user_id_required(authorization)
    return {"sub": user_id}
