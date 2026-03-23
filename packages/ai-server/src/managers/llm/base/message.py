from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class LLMMessage(BaseModel):
    """Standard message format for LLM interactions"""
    role: str  # "system", "user", "assistant"
    content: str

class LLMMessageContext(BaseModel):
    """List of LLM messages"""
    messages: List[LLMMessage] = Field(default_factory=list)

    def add_message(self, message: LLMMessage):
        """Add a message to the list"""
        self.messages.append(message)

    def get_messages(self) -> List[LLMMessage]:
        """Get the list of messages"""
        return self.messages


class LLMUsage(BaseModel):
    """Standard usage tracking format"""
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None


class LLMResponse(BaseModel):
    """Standard response format from LLM APIs"""
    provider: str
    content: str
    usage: Optional[LLMUsage] = None
    structured_output: Dict[str, Any] = {}