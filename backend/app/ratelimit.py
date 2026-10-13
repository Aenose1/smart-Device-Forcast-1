import threading
import time
from collections import defaultdict, deque

from fastapi import Request

from .config import get_settings
from .errors import AppError

_hits: dict[str, deque] = defaultdict(deque)
_lock = threading.Lock()


def limiter(name: str, limit: int, window_s: int):
    """Sliding-window limiter per client IP (in-memory; use Redis/gateway when scaling out)."""

    def dep(request: Request):
        if not get_settings().rate_limit_enabled:
            return
        key = f"{name}:{request.client.host if request.client else 'unknown'}"
        now = time.monotonic()
        with _lock:
            q = _hits[key]
            while q and now - q[0] > window_s:
                q.popleft()
            if len(q) >= limit:
                raise AppError(429, "rate_limited", "Too many requests. Please wait a moment and try again.")
            q.append(now)

    return dep


def reset_limits() -> None:
    with _lock:
        _hits.clear()
