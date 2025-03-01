from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    type: str = Field(..., description="Type of document: position_paper, resolution, speech, research")
    committee: str
    country: str
    topic: str
    content: Optional[str] = None
    
class DocumentCreate(DocumentBase):
    pass
    
class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    committee: Optional[str] = None
    country: Optional[str] = None
    topic: Optional[str] = None
    content: Optional[str] = None
    format_status: Optional[str] = None
    
class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    format_status: Optional[str] = "not_checked"
    
    class Config:
        orm_mode = True
        
class FormatCheckRequest(BaseModel):
    document_id: str
    
class FormatCheckResponse(BaseModel):
    document_id: str
    format_status: str
    issues: Optional[List[str]] = None 