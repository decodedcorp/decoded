from pydantic import BaseModel


class RedisConfig(BaseModel):
    host: str
    port: int
    password: str
