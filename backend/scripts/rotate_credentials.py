#!/usr/bin/env python3
"""
Credential Rotation Script

This script guides you through the process of rotating all exposed credentials.
IMPORTANT: Run this script after you've revoked the old credentials.
"""

import os
import sys
from pathlib import Path
import secrets
import base64

# ANSI color codes for terminal output
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"

def print_header(text):
    """Print a formatted header."""
    print(f"\n{BLUE}{BOLD}{'=' * 80}{RESET}")
    print(f"{BLUE}{BOLD} {text} {RESET}")
    print(f"{BLUE}{BOLD}{'=' * 80}{RESET}\n")

def print_warning(text):
    """Print a warning message."""
    print(f"{RED}{BOLD}WARNING: {text}{RESET}")

def print_success(text):
    """Print a success message."""
    print(f"{GREEN}{BOLD}{text}{RESET}")

def print_info(text):
    """Print an info message."""
    print(f"{BLUE}{text}{RESET}")

def print_step(step_number, text):
    """Print a step instruction."""
    print(f"{YELLOW}{BOLD}Step {step_number}: {text}{RESET}")

def generate_secret_key():
    """Generate a secure random secret key for JWT."""
    return base64.b64encode(secrets.token_bytes(48)).decode('utf-8')

def main():
    print_header("CREDENTIAL ROTATION SCRIPT")
    
    print_warning("Your credentials have been exposed in a Git repository!")
    print_warning("This script will guide you through rotating ALL exposed credentials.\n")
    
    print_info("The following credentials need to be rotated:")
    print("1. Supabase Keys (both public anon key and service role key)")
    print("2. JWT Secret Key\n")
    
    # Supabase Key Rotation
    print_step(1, "Rotate Supabase Keys")
    print_info("To rotate your Supabase keys:")
    print("   a. Log in to your Supabase dashboard at https://app.supabase.com")
    print("   b. Select your project")
    print("   c. Go to Project Settings > API")
    print("   d. Click on 'Reset API Key' for both Project API keys and service_role key")
    print("   e. Confirm the action and copy the new keys\n")
    
    input(f"{BOLD}Press Enter once you've rotated your Supabase keys...{RESET}")
    
    # JWT Secret Key Rotation
    print_step(2, "Generate a new JWT Secret Key")
    new_secret_key = generate_secret_key()
    print_info("A new secure JWT secret key has been generated:")
    print(f"{new_secret_key}\n")
    
    # Update Environment Files
    print_step(3, "Update Environment Files")
    print_info("Now you need to update your environment files with the new credentials")
    print("1. Update backend/.env.local:")
    print("   - SUPABASE_URL (should remain the same)")
    print("   - SUPABASE_KEY (new anon key)")
    print("   - SUPABASE_SERVICE_KEY (new service role key)")
    print("   - SECRET_KEY (new JWT secret key shown above)")
    print("\n2. Update frontend/.env.local:")
    print("   - NEXT_PUBLIC_SUPABASE_URL (should remain the same)")
    print("   - NEXT_PUBLIC_SUPABASE_ANON_KEY (new anon key)")
    
    print_warning("\nNEVER commit these files to git again!")
    print_info("Your .gitignore has been updated to prevent committing environment files")
    
    # Final steps
    print_step(4, "Commit the updated .gitignore")
    print_info("Run the following commands:")
    print("   git add .gitignore")
    print("   git commit -m \"Updated .gitignore to prevent leaking credentials\"")
    print("   git push")
    
    print_success("\nCredential rotation guidance complete!")
    print_info("Remember: If you've already pushed sensitive data to a public repository,")
    print_info("the historical data might still be accessible. Consider the following:")
    print("1. If this is a public repository, consider making it private temporarily")
    print("2. Consider using tools like BFG Repo-Cleaner or git-filter-repo to purge sensitive data from history")
    print("3. Force push the cleaned history with: git push --force")
    
    print_warning("\nALWAYS treat your credentials as compromised until you're certain they've been properly rotated and your repository history has been cleaned.")
    
if __name__ == "__main__":
    main() 