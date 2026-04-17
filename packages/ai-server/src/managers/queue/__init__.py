"""Queue management package for ARQ job processing"""

from .queue_manager import QueueManager


def __getattr__(name):
    """Lazy-load worker symbols to avoid circular imports."""
    if name in ("WorkerSettings", "create_worker"):
        from . import worker

        return getattr(worker, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["QueueManager", "WorkerSettings", "create_worker"]
