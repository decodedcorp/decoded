from typing import Optional, Dict
import httpx
from fastapi import HTTPException
from contextlib import asynccontextmanager
from src.config._logger import http_error_handler


class BackendManager:
    """
    Manager for backend communication
    """

    def __init__(self, url: str, access_token: str, logger):
        self._client: Optional[httpx.AsyncClient] = None
        self.backend_url = url
        self.access_token = access_token
        self.headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}",
        }

        self._async_client: Optional[httpx.AsyncClient] = None
        self._sync_client = httpx.Client(
            base_url=self.backend_url, headers=self.headers, timeout=10.0
        )
        self.logger = logger

    async def get_client(self):
        """Call client_context only when needed"""
        if self._async_client is None:
            self.logger.debug("Creating new AsyncClient instance")
            self._async_client = httpx.AsyncClient(
                base_url=self.backend_url, headers=self.headers, timeout=10.0
            )
        return self._async_client

    @asynccontextmanager
    async def client_context(self):
        """Provide client context as an asynchronous context manager"""
        if self._async_client is None:
            self._async_client = httpx.AsyncClient(
                base_url=self.backend_url, headers=self.headers, timeout=10.0
            )
        try:
            yield self._async_client
        except Exception as e:
            self.logger.error(f"Error in client context: {str(e)}")
            raise

    @http_error_handler
    async def request(
        self,
        method: str,
        endpoint: str,
        data: Dict = None,
    ) -> Dict:
        async with self.client_context() as client:
            kwargs = {}
            if data is not None and method.lower() != "get":
                kwargs["json"] = data

            response = await getattr(client, method.lower())(
                endpoint,
                **kwargs,
            )
            response.raise_for_status()
            return response.json()

    async def post_request(self, endpoint: str, data: Dict) -> Dict:
        return await self.request("POST", endpoint, data)

    async def patch_request(self, endpoint: str, data: Dict) -> Dict:
        return await self.request("PATCH", endpoint, data)

    async def get_request(self, endpoint: str) -> Dict:
        return await self.request("GET", endpoint)

    async def put_request(self, endpoint: str, data: Dict) -> Dict:
        return await self.request("PUT", endpoint, data)

    async def delete_request(self, endpoint: str) -> Dict:
        return await self.request("DELETE", endpoint)

    def health_check(self):
        try:
            response = self._sync_client.get("/health")
            response.raise_for_status()
            return "OK"
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error in HTTP request: {str(e)}",
            )

    async def shutdown(self):
        """Shutdown and clean up clients"""
        if self._async_client:
            await self._async_client.aclose()
            self._async_client = None

        if self._sync_client:
            self._sync_client.close()
            self._sync_client = None

        self.logger.info("BackendManager clients shut down")
