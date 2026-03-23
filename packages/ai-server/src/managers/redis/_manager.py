from redis import asyncio as aioredis
from redis import Redis
from redis.exceptions import RedisError
from src.config._logger import LoggerService
from typing import Awaitable, Union

class RedisManager:
    """Redis 연결 관리 클래스"""

    def __init__(
        self,
        password=None,
        decode_responses=True,
        redis_config: dict = None,
        logger: LoggerService = None,
    ):
        self.password = password
        self.decode_responses = decode_responses
        self._client = None
        self.redis_config = redis_config
        self.logger = logger
        self.logger.debug("RedisManager initialized")

    async def get_client(self):
        """Return Redis client"""
        if self._client is None:
            self._client = aioredis.Redis(
                host=self.redis_config.host,
                port=self.redis_config.port,
                password=self.redis_config.password,
                decode_responses=self.decode_responses,
            )
        return self._client

    async def close(self):
        """Close Redis connection"""
        if self._client:
            await self._client.close()
            self._client = None

    async def exists(self, key: str):
        """Check if key exists"""
        client = await self.get_client()
        return await client.exists(key)

    async def set(self, key: str, value: str, ex: int = 300):
        """Set key-value pair"""
        client = await self.get_client()
        return await client.set(key, value, ex=ex)  # Use the provided expiration time

    async def get(self, key: str):
        """Return value for key"""
        client = await self.get_client()
        return await client.get(key)

    # Low-level Redis command wrapper methods
    async def rpush(self, key: str, value: str):
        """Add value to right side of list"""
        client = await self.get_client()
        return await client.rpush(key, value)

    async def lpop(self, key: str):
        """Extract value from left side of list"""
        client = await self.get_client()
        return await client.lpop(key)
    
    async def lpush(self, key: str, value: str):
        """Add value to left side of list"""
        client = await self.get_client()
        return await client.lpush(key, value)
    
    async def rpop(self, key: str):
        """Extract value from right side of list"""
        client = await self.get_client()
        return await client.rpop(key)

    async def llen(self, key: str) -> Union[Awaitable[int], int]:
        """Return length of list"""
        client = await self.get_client()
        return await client.llen(key)

    async def lrange(self, key: str, start: int, end: int):
        """Return list elements within range"""
        client = await self.get_client()
        return await client.lrange(key, start, end)

    async def ltrim(self, key: str, start: int, end: int):
        """Trim list to specified range"""
        client = await self.get_client()
        return await client.ltrim(key, start, end)

    async def delete(self, *keys):
        """Delete keys"""
        client = await self.get_client()
        return await client.delete(*keys)

    # Sorted Set commands
    async def zadd(self, key: str, mapping: dict):
        """Add member and score to sorted set"""
        client = await self.get_client()
        return await client.zadd(key, mapping)

    async def zrangebyscore(self, key: str, min_score: float, max_score: float, start: int = None, num: int = None, count: int = None):
        """Return members within score range"""
        client = await self.get_client()
        # Handle start/num parameters (support for existing call style)
        if start is not None and num is not None:
            return await client.zrangebyscore(key, min_score, max_score, start=start, num=num)
        elif count is not None:
            return await client.zrangebyscore(key, min_score, max_score, start=0, num=count)
        else:
            return await client.zrangebyscore(key, min_score, max_score)

    async def zrem(self, key: str, *members):
        """Remove members from sorted set"""
        client = await self.get_client()
        return await client.zrem(key, *members)

    async def zcard(self, key: str):
        """Return size of sorted set"""
        client = await self.get_client()
        return await client.zcard(key)

    async def zcount(self, key: str, min_score: float, max_score: float):
        """Return number of members within score range"""
        client = await self.get_client()
        return await client.zcount(key, min_score, max_score)

    # Hash commands
    async def hdel(self, key: str, *fields):
        """Delete fields from hash"""
        client = await self.get_client()
        return await client.hdel(key, *fields)

    async def hset(self, key: str, field: str, value: str):
        """Set field in hash"""
        client = await self.get_client()
        return await client.hset(key, field, value)

    async def hget(self, key: str, field: str):
        """Return value of field in hash"""
        client = await self.get_client()
        return await client.hget(key, field)

    async def hgetall(self, key: str):
        """Return all fields and values in hash"""
        client = await self.get_client()
        return await client.hgetall(key)

    async def hlen(self, key: str):
        """Return number of fields in hash"""
        client = await self.get_client()
        return await client.hlen(key)

    # Set commands
    async def scard(self, key: str):
        """Return size of set"""
        client = await self.get_client()
        return await client.scard(key)

    async def sadd(self, key: str, *members):
        """Add members to set"""
        client = await self.get_client()
        return await client.sadd(key, *members)

    async def srem(self, key: str, *members):
        """Remove members from set"""
        client = await self.get_client()
        return await client.srem(key, *members)

    async def smembers(self, key: str):
        """Return all members of set"""
        client = await self.get_client()
        return await client.smembers(key)

    def health_check(self) -> bool:
        """Synchronous Redis health check"""
        try:
            # Create synchronous Redis client
            client = Redis(
                host=self.redis_config.host,
                port=self.redis_config.port,
                password=self.redis_config.password,
                decode_responses=self.decode_responses,
                socket_timeout=2.0,  # Set timeout
            )
            # Perform ping
            response = client.ping()
            # Close connection
            client.close()
            return response
        except RedisError as e:
            if self.logger:
                self.logger.error(f"Redis health check failed: {str(e)}")
            return False
