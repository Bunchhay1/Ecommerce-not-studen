from typing import List, Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import settings
from app.core.logging import logger

security_scheme = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    sub: str
    roles: List[str] = []
    exp: Optional[int] = None


def decode_jwt(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True}
        )
        roles = payload.get("roles", [])
        if isinstance(roles, str):
            roles = [roles]
        return TokenPayload(
            sub=str(payload.get("sub", "")),
            roles=[r.upper() for r in roles],
            exp=payload.get("exp")
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.PyJWTError as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[TokenPayload]:
    if not credentials:
        return None
    return decode_jwt(credentials.credentials)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> TokenPayload:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return decode_jwt(credentials.credentials)


def require_role(required_role: str):
    async def role_checker(user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
        normalized_req = required_role.upper().replace("ROLE_", "")
        user_roles = [r.replace("ROLE_", "") for r in user.roles]
        if normalized_req not in user_roles and "ADMIN" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User lacks required role: {required_role}"
            )
        return user
    return role_checker
