"""
Aegis Multi-Domain Services Package
"""

from .creator_service import CreatorService
from .design_service import DesignService
from .office_service import OfficeDataEngine
from .student_service import StudentService
from .universal_service import UniversalService

__all__ = [
    "OfficeDataEngine",
    "StudentService",
    "CreatorService",
    "DesignService",
    "UniversalService",
]
