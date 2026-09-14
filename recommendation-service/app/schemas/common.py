from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    status: str = "success"
    message: Optional[str] = None
    data: Optional[T] = None
    meta: Optional[Dict[str, Any]] = None
