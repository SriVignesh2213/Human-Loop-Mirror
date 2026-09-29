from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    success: bool = True
    data: Optional[T] = None
    message: str = "Success"


class ApiErrorResponse(BaseModel):
    success: bool = False
    data: Optional[Any] = None
    message: str
    error_code: str
