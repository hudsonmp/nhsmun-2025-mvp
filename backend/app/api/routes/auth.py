from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import json

from ...schemas.user import UserCreate, UserResponse, Token, UserLogin
from ...database.supabase_client import get_supabase_client
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """
    Create a new user in Supabase.
    """
    supabase = get_supabase_client()
    
    # Check if user already exists
    existing_user = supabase.table("users").select("*").eq("email", user.email).execute()
    
    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create the user record
    new_user = {
        "email": user.email,
        "username": user.username,
        "password": hashed_password
    }
    
    # Insert user into database
    result = supabase.table("users").insert(new_user).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    created_user = result.data[0]
    
    # Return the user without sensitive information
    return {
        "id": created_user["id"],
        "email": created_user["email"],
        "username": created_user["username"],
        "created_at": created_user["created_at"]
    }

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    supabase = get_supabase_client()
    
    # Get user by email
    user_result = supabase.table("users").select("*").eq("email", form_data.username).execute()
    
    if not user_result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = user_result.data[0]
    
    # Verify password
    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """
    Regular login endpoint (non-OAuth2).
    """
    form_data = OAuth2PasswordRequestForm(username=user_data.email, password=user_data.password)
    return await login_for_access_token(form_data) 