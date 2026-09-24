import time
from collections import defaultdict
from typing import Dict, List
from app.core.config import settings
from app.core.logging import logger

try:
    import redis
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    # Test connection
    redis_client.ping()
    HAS_REDIS = True
    logger.info("Connected to Redis for rate limiting & cache.")
except Exception as e:
    HAS_REDIS = False
    redis_client = None
    logger.warning(f"Redis not reachable ({e}). Using robust in-memory sliding window rate limiter.")

class RateLimiterService:
    def __init__(self):
        # In-memory storage: key -> list of timestamps
        self._memory_store: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str, max_requests: int = 5, window_seconds: int = 60) -> tuple[bool, int]:
        """
        Checks if a key has exceeded the maximum allowed requests within window_seconds.
        Returns:
            (is_limited: bool, retry_after_seconds: int)
        """
        now = time.time()
        
        if HAS_REDIS and redis_client:
            try:
                redis_key = f"rate_limit:{key}"
                pipe = redis_client.pipeline()
                pipe.zremrangebyscore(redis_key, 0, now - window_seconds)
                pipe.zcard(redis_key)
                pipe.zadd(redis_key, {str(now): now})
                pipe.expire(redis_key, window_seconds)
                results = pipe.execute()
                
                request_count = results[1]
                if request_count >= max_requests:
                    return True, window_seconds
                return False, 0
            except Exception as e:
                logger.warning(f"Redis rate limit error ({e}), falling back to memory.")

        # In-Memory sliding window
        window_start = now - window_seconds
        # Filter out timestamps outside window
        timestamps = [t for t in self._memory_store[key] if t > window_start]
        
        if len(timestamps) >= max_requests:
            retry_after = int(timestamps[0] + window_seconds - now) + 1
            return True, max(1, retry_after)
        
        timestamps.append(now)
        self._memory_store[key] = timestamps
        return False, 0

    def reset(self, key: str):
        if HAS_REDIS and redis_client:
            try:
                redis_client.delete(f"rate_limit:{key}")
            except Exception:
                pass
        self._memory_store.pop(key, None)

rate_limiter = RateLimiterService()
