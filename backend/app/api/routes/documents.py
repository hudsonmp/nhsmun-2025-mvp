from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
import json
import random  # For mock format check

from ...schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate, FormatCheckResponse
from ...database.supabase_client import get_supabase_client
from ..auth import get_current_user
from ...schemas.user import TokenData

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    document: DocumentCreate,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Create a new document in the repository.
    """
    supabase = get_supabase_client()
    
    # Create document record
    new_document = document.dict()
    new_document["user_id"] = current_user.user_id
    new_document["format_status"] = "not_checked"
    
    # Insert document into database
    result = supabase.table("documents").insert(new_document).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create document"
        )
    
    return result.data[0]

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    type: Optional[str] = None,
    committee: Optional[str] = None,
    country: Optional[str] = None,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get all documents with optional filtering.
    """
    supabase = get_supabase_client()
    
    # Start query
    query = supabase.table("documents").select("*")
    
    # Apply filters if provided
    if type:
        query = query.eq("type", type)
    if committee:
        query = query.eq("committee", committee)
    if country:
        query = query.eq("country", country)
    
    # Execute query
    result = query.execute()
    
    return result.data

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get a specific document by ID.
    """
    supabase = get_supabase_client()
    
    # Get document
    result = supabase.table("documents").select("*").eq("id", document_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return result.data[0]

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Update a document.
    """
    supabase = get_supabase_client()
    
    # Check if document exists and belongs to user
    document = supabase.table("documents").select("*").eq("id", document_id).execute()
    
    if not document.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.data[0]["user_id"] != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this document"
        )
    
    # Update document
    update_data = {k: v for k, v in document_update.dict().items() if v is not None}
    result = supabase.table("documents").update(update_data).eq("id", document_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update document"
        )
    
    return result.data[0]

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Delete a document.
    """
    supabase = get_supabase_client()
    
    # Check if document exists and belongs to user
    document = supabase.table("documents").select("*").eq("id", document_id).execute()
    
    if not document.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.data[0]["user_id"] != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this document"
        )
    
    # Delete document
    supabase.table("documents").delete().eq("id", document_id).execute()
    
    return None

@router.post("/{document_id}/format-check", response_model=FormatCheckResponse)
async def check_document_format(
    document_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Check the format of a document. 
    This is a simplified mock implementation.
    In a real application, this would use an AI service to check the format.
    """
    supabase = get_supabase_client()
    
    # Check if document exists
    document = supabase.table("documents").select("*").eq("id", document_id).execute()
    
    if not document.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Mock format check (randomly valid or with issues)
    is_valid = random.choice([True, False])
    
    format_status = "valid" if is_valid else "issues"
    issues = None if is_valid else [
        "Incorrect heading format",
        "Missing country flag in header",
        "Citation style inconsistent"
    ]
    
    # Update document with format check results
    supabase.table("documents").update({"format_status": format_status}).eq("id", document_id).execute()
    
    return {
        "document_id": document_id,
        "format_status": format_status,
        "issues": issues
    } 