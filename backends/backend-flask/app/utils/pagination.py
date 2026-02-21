"""
Pagination Utilities

Provides consistent pagination for list endpoints.
"""

from flask import request, url_for
from typing import TypeVar, Generic, List, Dict, Any, Optional
from dataclasses import dataclass
from math import ceil


T = TypeVar('T')


@dataclass
class PaginationParams:
    """Pagination parameters extracted from request."""
    page: int
    per_page: int
    
    @classmethod
    def from_request(cls, default_per_page: int = 20, max_per_page: int = 100) -> 'PaginationParams':
        """Extract pagination params from Flask request."""
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', default_per_page, type=int)
        
        # Enforce limits
        page = max(1, page)
        per_page = min(max(1, per_page), max_per_page)
        
        return cls(page=page, per_page=per_page)


@dataclass
class PaginatedResult(Generic[T]):
    """Paginated query result with metadata."""
    items: List[T]
    total: int
    page: int
    per_page: int
    
    @property
    def pages(self) -> int:
        """Total number of pages."""
        return ceil(self.total / self.per_page) if self.per_page > 0 else 0
    
    @property
    def has_next(self) -> bool:
        """Whether there's a next page."""
        return self.page < self.pages
    
    @property
    def has_prev(self) -> bool:
        """Whether there's a previous page."""
        return self.page > 1
    
    def to_dict(self, item_serializer=None) -> Dict[str, Any]:
        """
        Convert to dictionary for JSON response.
        
        Args:
            item_serializer: Optional function to serialize each item
        """
        items = self.items
        if item_serializer:
            items = [item_serializer(item) for item in self.items]
        
        return {
            'items': items,
            'pagination': {
                'page': self.page,
                'per_page': self.per_page,
                'total': self.total,
                'pages': self.pages,
                'has_next': self.has_next,
                'has_prev': self.has_prev
            }
        }
    
    def link_header(self, endpoint: str, **kwargs) -> str:
        """
        Generate Link header for RESTful pagination.
        
        Args:
            endpoint: Flask endpoint name
            **kwargs: Additional URL parameters
        """
        links = []
        
        if self.has_prev:
            prev_url = url_for(endpoint, page=self.page - 1, per_page=self.per_page, **kwargs, _external=True)
            links.append(f'<{prev_url}>; rel="prev"')
        
        if self.has_next:
            next_url = url_for(endpoint, page=self.page + 1, per_page=self.per_page, **kwargs, _external=True)
            links.append(f'<{next_url}>; rel="next"')
        
        first_url = url_for(endpoint, page=1, per_page=self.per_page, **kwargs, _external=True)
        links.append(f'<{first_url}>; rel="first"')
        
        last_url = url_for(endpoint, page=self.pages, per_page=self.per_page, **kwargs, _external=True)
        links.append(f'<{last_url}>; rel="last"')
        
        return ', '.join(links)


def paginate_query(query, params: PaginationParams) -> PaginatedResult:
    """
    Apply pagination to a SQLAlchemy query.
    
    Args:
        query: SQLAlchemy query object
        params: Pagination parameters
    
    Returns:
        PaginatedResult with items and metadata
    """
    # Get total count (optimized query)
    total = query.count()
    
    # Apply offset and limit
    offset = (params.page - 1) * params.per_page
    items = query.offset(offset).limit(params.per_page).all()
    
    return PaginatedResult(
        items=items,
        total=total,
        page=params.page,
        per_page=params.per_page
    )
