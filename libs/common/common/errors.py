import logging
from fastapi import HTTPException, Request


def raise_api_error(request: Request, status_code: int, error_code: str, message: str) -> None:
    request_id = getattr(request.state, "request_id", None)
    logging.warning(message, extra={"error_code": error_code, "request_id": request_id})
    raise HTTPException(
        status_code=status_code,
        detail={"error": error_code, "message": message, "request_id": request_id},
    )

