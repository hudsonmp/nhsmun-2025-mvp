import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Initialize the Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase_client() -> Client:
    """Returns an initialized Supabase client."""
    return supabase 