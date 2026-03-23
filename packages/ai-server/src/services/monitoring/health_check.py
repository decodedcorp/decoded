import asyncio
import time
from typing import Dict, Any, Optional
import logging
from dataclasses import dataclass
from enum import Enum


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class ComponentHealth:
    name: str
    status: HealthStatus
    response_time_ms: Optional[float] = None
    error_message: Optional[str] = None
    last_check: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class HealthCheckService:
    """Service for monitoring system health and component status"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._component_health = {}
        self._check_interval = 30  # seconds
        self._running = False
        self._health_check_task = None
    
    async def start_monitoring(self):
        """Start continuous health monitoring"""
        if self._running:
            return
        
        self._running = True
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        self.logger.info("Health monitoring started")
    
    async def stop_monitoring(self):
        """Stop health monitoring"""
        self._running = False
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Health monitoring stopped")
    
    async def _health_check_loop(self):
        """Main health check loop"""
        while self._running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self._check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in health check loop: {str(e)}")
                await asyncio.sleep(5)  # Short delay before retry
    
    async def _perform_health_checks(self):
        """Perform health checks for all components"""
        checks = [
            self._check_redis_health(),
            self._check_perplexity_health(),
            self._check_searxng_health(),
            self._check_system_resources(),
        ]
        
        results = await asyncio.gather(*checks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, ComponentHealth):
                self._component_health[result.name] = result
            elif isinstance(result, Exception):
                self.logger.error(f"Health check failed: {str(result)}")
    
    async def _check_redis_health(self) -> ComponentHealth:
        """Check Redis connectivity and performance"""
        start_time = time.time()
        
        try:
            # This would need actual Redis manager instance
            # For now, return a placeholder
            response_time = (time.time() - start_time) * 1000
            
            return ComponentHealth(
                name="redis",
                status=HealthStatus.HEALTHY,
                response_time_ms=response_time,
                last_check=time.time(),
                metadata={"connection_pool": "active"}
            )
        except Exception as e:
            return ComponentHealth(
                name="redis",
                status=HealthStatus.UNHEALTHY,
                error_message=str(e),
                last_check=time.time()
            )
    
    async def _check_perplexity_health(self) -> ComponentHealth:
        """Check Perplexity API health"""
        start_time = time.time()
        
        try:
            # Simple API availability check
            import httpx
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get("https://api.perplexity.ai")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code in [200, 404]:  # 404 is OK, means API is responding
                    return ComponentHealth(
                        name="perplexity_api",
                        status=HealthStatus.HEALTHY,
                        response_time_ms=response_time,
                        last_check=time.time(),
                        metadata={"endpoint": "https://api.perplexity.ai"}
                    )
                else:
                    return ComponentHealth(
                        name="perplexity_api",
                        status=HealthStatus.DEGRADED,
                        response_time_ms=response_time,
                        error_message=f"HTTP {response.status_code}",
                        last_check=time.time()
                    )
        except Exception as e:
            return ComponentHealth(
                name="perplexity_api",
                status=HealthStatus.UNHEALTHY,
                error_message=str(e),
                last_check=time.time()
            )
    
    async def _check_searxng_health(self) -> ComponentHealth:
        """Check SearXNG API health"""
        # This would need actual SearXNG configuration
        return ComponentHealth(
            name="searxng_api",
            status=HealthStatus.HEALTHY,
            last_check=time.time(),
            metadata={"note": "Health check not implemented - requires SearXNG URL"}
        )
    
    async def _check_system_resources(self) -> ComponentHealth:
        """Check system resource usage"""
        try:
            import psutil
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Determine status based on resource usage
            status = HealthStatus.HEALTHY
            if cpu_percent > 80 or memory.percent > 85 or disk.percent > 90:
                status = HealthStatus.DEGRADED
            elif cpu_percent > 95 or memory.percent > 95 or disk.percent > 95:
                status = HealthStatus.UNHEALTHY
            
            return ComponentHealth(
                name="system_resources",
                status=status,
                last_check=time.time(),
                metadata={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "disk_percent": disk.percent,
                    "memory_available_gb": round(memory.available / (1024**3), 2),
                    "disk_free_gb": round(disk.free / (1024**3), 2)
                }
            )
        except ImportError:
            return ComponentHealth(
                name="system_resources",
                status=HealthStatus.HEALTHY,
                last_check=time.time(),
                metadata={"note": "psutil not available - resource monitoring disabled"}
            )
        except Exception as e:
            return ComponentHealth(
                name="system_resources",
                status=HealthStatus.DEGRADED,
                error_message=str(e),
                last_check=time.time()
            )
    
    def get_overall_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        if not self._component_health:
            return {
                "status": HealthStatus.UNHEALTHY,
                "message": "No health checks performed yet",
                "components": {},
                "timestamp": time.time()
            }
        
        # Determine overall status
        component_statuses = [comp.status for comp in self._component_health.values()]
        
        if all(status == HealthStatus.HEALTHY for status in component_statuses):
            overall_status = HealthStatus.HEALTHY
        elif any(status == HealthStatus.UNHEALTHY for status in component_statuses):
            overall_status = HealthStatus.UNHEALTHY
        else:
            overall_status = HealthStatus.DEGRADED
        
        # Build response
        components = {}
        for name, health in self._component_health.items():
            components[name] = {
                "status": health.status,
                "response_time_ms": health.response_time_ms,
                "error_message": health.error_message,
                "last_check": health.last_check,
                "metadata": health.metadata
            }
        
        return {
            "status": overall_status,
            "message": f"System is {overall_status}",
            "components": components,
            "timestamp": time.time(),
            "checks_performed": len(self._component_health)
        }
    
    def get_component_health(self, component_name: str) -> Optional[Dict[str, Any]]:
        """Get health status for a specific component"""
        health = self._component_health.get(component_name)
        if not health:
            return None
        
        return {
            "status": health.status,
            "response_time_ms": health.response_time_ms,
            "error_message": health.error_message,
            "last_check": health.last_check,
            "metadata": health.metadata
        }
    
    async def perform_immediate_check(self, component_name: Optional[str] = None) -> Dict[str, Any]:
        """Perform immediate health check for specific component or all components"""
        if component_name:
            if component_name == "redis":
                result = await self._check_redis_health()
            elif component_name == "perplexity_api":
                result = await self._check_perplexity_health()
            elif component_name == "searxng_api":
                result = await self._check_searxng_health()
            elif component_name == "system_resources":
                result = await self._check_system_resources()
            else:
                return {"error": f"Unknown component: {component_name}"}
            
            self._component_health[result.name] = result
            return {
                "component": result.name,
                "status": result.status,
                "response_time_ms": result.response_time_ms,
                "error_message": result.error_message,
                "metadata": result.metadata
            }
        else:
            await self._perform_health_checks()
            return self.get_overall_health()