from .auth import router as auth_router
from .analyzer import router as analyzer_router
from .dashboard import router as dashboard_router


__all__ = ["auth_router", "analyzer_router", "dashboard_router"]