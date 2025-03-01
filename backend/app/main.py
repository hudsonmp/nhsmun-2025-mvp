import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .api.routes import auth, documents

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="MUN Platform API",
    description="API for Model United Nations Platform",
    version="0.1.0"
)

# Configure CORS
cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "").replace("'", "\"")
if cors_origins:
    import json
    origins = json.loads(cors_origins)
else:
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the MUN Platform API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 