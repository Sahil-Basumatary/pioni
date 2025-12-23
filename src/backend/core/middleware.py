from uuid import uuid4
from fastapi import Request


async def attach_request_id(request: Request, call_next):
    request_id = uuid4().hex[:12]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response