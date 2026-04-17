from typing import Dict, List, Optional, Union
from ..base.client import BaseLLMClient
from ..base.message import LLMMessage, LLMResponse
from ..base.config import LLMConfig
from ..base.types import ContentType
from .content_resolver import ContentTypeResolver
import logging


class LLMRouter(BaseLLMClient):
    """
    Router that directs requests to different LLM clients based on content type

    Example:
        router = LLMRouter({
            "link": perplexity_client,
            "image": groq_client,
            "text": llama_client
        })
    """

    def __init__(
        self,
        client_mapping: Dict[str, Union[BaseLLMClient, List[BaseLLMClient]]],
        fallback_provider: str = "text",
        content_resolver: Optional[ContentTypeResolver] = None,
    ):
        """
        Initialize LLM Router

        Args:
            client_mapping: Dictionary mapping content_type to LLM client
            fallback_provider: Content type to use when requested type not found
        """
        # Create a dummy config for the router
        super().__init__(LLMConfig(provider="router", api_key="", model="router"))

        # Normalize client mapping to handle both single clients and lists
        self.clients = self._normalize_client_mapping(client_mapping)

        # Initialize content resolver for URL pattern analysis
        self.content_resolver = content_resolver or ContentTypeResolver()
        self.fallback_provider = fallback_provider
        self.logger = logging.getLogger(__name__)

        # Validate that fallback provider exists
        if fallback_provider not in self.clients:
            self.logger.warning(
                f"Fallback provider '{fallback_provider}' not found in client mapping"
            )
            # Use first available client as fallback
            self.fallback_provider = next(iter(self.clients.keys())) if self.clients else None
        self.logger.info(f"LLMRouter initialized with fallback provider: {self.fallback_provider}")

    async def completion(
        self,
        messages: List[LLMMessage],
        content_type: ContentType = ContentType.TEXT,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs,
    ) -> LLMResponse:
        """
        Route completion request to appropriate LLM client

        Args:
            messages: List of messages for conversation
            content_type: Type of content (ContentType enum)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional provider-specific parameters (including locale)

        Returns:
            LLMResponse from the appropriate client
        """
        # Route to appropriate client
        url = kwargs.get("url", "")
        # Convert ContentType enum to string for lookup in client mapping
        content_type_str = content_type.value
        client = self._get_client_for_content_type(content_type_str, url)
        if client is None:
            raise ValueError(
                f"No client available for content type '{content_type}' and no fallback"
            )

        self.logger.debug(f"Routing {content_type} request to {client.get_provider()}")

        # Forward request to the appropriate client
        return await client.completion(
            messages=messages,
            content_type=content_type,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs,
        )

    def health_check(self) -> bool:
        """
        Check if at least one client is healthy

        Returns:
            True if any client is healthy, False otherwise
        """
        for content_type, clients in self.clients.items():
            # Handle both single client and list of clients
            client_list = clients if isinstance(clients, list) else [clients]

            for client in client_list:
                try:
                    if client.health_check():
                        return True
                except Exception as e:
                    self.logger.warning(
                        f"Health check failed for {content_type} client ({client.get_provider()}): {e}"
                    )
                    continue
        return False

    def get_provider(self) -> str:
        """Get router info"""
        providers = []
        for ct, clients in self.clients.items():
            if isinstance(clients, list):
                provider_list = [c.get_provider() for c in clients]
                providers.append(f"{ct}:[{','.join(provider_list)}]")
            else:
                providers.append(f"{ct}:{clients.get_provider()}")
        return f"router({', '.join(providers)})"

    def get_model(self) -> str:
        """Get models info"""
        models = []
        for ct, clients in self.clients.items():
            if isinstance(clients, list):
                model_list = [c.get_model() for c in clients]
                models.append(f"{ct}:[{','.join(model_list)}]")
            else:
                models.append(f"{ct}:{clients.get_model()}")
        return f"router({', '.join(models)})"

    def _get_client_for_content_type(
        self, content_type: str, url: str = ""
    ) -> Optional[BaseLLMClient]:
        """
        Get appropriate client for content type

        Args:
            content_type: Type of content to process

        Returns:
            LLM client or None if not found
        """
        # Try exact match first
        if content_type in self.clients:
            clients = self.clients[content_type]
            # If it's a list of clients, select based on URL
            if isinstance(clients, list):
                return self._select_client_for_url(url, clients)
            return clients

        # Try fallback
        if self.fallback_provider and self.fallback_provider in self.clients:
            self.logger.info(
                f"Using fallback provider '{self.fallback_provider}' for content type '{content_type}'"
            )
            fallback_clients = self.clients[self.fallback_provider]
            if isinstance(fallback_clients, list):
                return self._select_client_for_url(url, fallback_clients)
            return fallback_clients

        return None

    def add_client(self, content_type: str, client: Union[BaseLLMClient, List[BaseLLMClient]]):
        """Add or update client for specific content type"""
        if isinstance(client, list):
            self.clients[content_type] = client
        else:
            self.clients[content_type] = client

    def remove_client(self, content_type: str):
        """Remove client for specific content type"""
        if content_type in self.clients:
            del self.clients[content_type]

    def get_available_content_types(self) -> List[str]:
        """Get list of supported content types"""
        return list(self.clients.keys())

    def _normalize_client_mapping(
        self, client_mapping: Dict[str, Union[BaseLLMClient, List[BaseLLMClient]]]
    ) -> Dict[str, Union[BaseLLMClient, List[BaseLLMClient]]]:
        """Normalize client mapping to ensure consistent format and resolve providers"""
        normalized = {}
        for content_type, clients in client_mapping.items():
            if isinstance(clients, list):
                # Resolve each client in the list
                resolved_clients = []
                for client in clients:
                    resolved_client = self._resolve_provider_if_needed(client)
                    if resolved_client:
                        resolved_clients.append(resolved_client)
                normalized[content_type] = resolved_clients
            else:
                # Resolve single client
                resolved_client = self._resolve_provider_if_needed(clients)
                if resolved_client:
                    normalized[content_type] = resolved_client
        return normalized

    def _resolve_provider_if_needed(self, client):
        """Resolve dependency injector provider to actual instance if needed"""
        # Check if it's a dependency injector provider
        if hasattr(client, "__class__") and "dependency_injector" in str(client.__class__):
            # Try to call it to get the actual instance
            try:
                if hasattr(client, "__call__"):
                    return client()
                else:
                    return client
            except Exception as e:
                self.logger.warning(f"Failed to resolve provider {client}: {e}")
                return None
        else:
            # It's already an actual instance
            return client

    def _select_client_for_url(self, url: str, clients: List[BaseLLMClient]) -> BaseLLMClient:
        """
        Select appropriate client based on URL pattern using ContentTypeResolver

        Args:
            url: URL to analyze
            clients: List of available clients

        Returns:
            Selected LLM client
        """
        if not url or not clients:
            return clients[0] if clients else None

        # Use ContentTypeResolver to determine URL type
        from src.database.models.batch import DataItemType

        resolved_type = self.content_resolver.resolve_content_type(url, DataItemType.LINK)
        # YouTube URLs -> prefer Groq for speed
        if resolved_type == "youtube":
            groq_client = next((c for c in clients if c.get_provider() == "groq"), None)
            if groq_client:
                self.logger.debug(f"Selected Groq for YouTube URL: {url}")
                return groq_client

        # Default -> prefer Perplexity for web search capabilities
        perplexity_client = next((c for c in clients if c.get_provider() == "perplexity"), None)
        if perplexity_client:
            self.logger.debug(f"Selected Perplexity for general URL: {url}")
            return perplexity_client

        # Fallback to first available client
        self.logger.debug(f"Using fallback client for URL: {url}")
        return clients[0]
