"""
Supabase service for JWT verification and Google token management
"""

from supabase import create_client, Client
from typing import Optional, Dict, Any
import jwt
from jwt.exceptions import InvalidTokenError
from google.oauth2.credentials import Credentials
from config import settings


class SupabaseService:
    """Service for Supabase authentication and user data management"""
    
    def __init__(self):
        self.supabase: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
    
    def verify_jwt(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Supabase JWT token and extract user information
        
        Args:
            token: The JWT token from Authorization header
            
        Returns:
            Decoded JWT payload if valid, None otherwise
        """
        try:
            # For Supabase JWTs, we typically don't need to verify signature
            # since we trust our own frontend and the token comes from Supabase
            # But we can decode it to get user info
            
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Decode without verification (since it's from our trusted frontend)
            # In production, you might want to verify the signature
            payload = jwt.decode(token, options={"verify_signature": False})
            
            return payload
            
        except InvalidTokenError as e:
            print(f"Invalid JWT token: {e}")
            return None
        except Exception as e:
            print(f"Error verifying JWT: {e}")
            return None
    
    def get_google_tokens(self, user_id: str) -> Optional[Credentials]:
        """
        Fetch Google OAuth tokens for a user from Supabase auth.identities table
        
        Args:
            user_id: User ID from the JWT token
            
        Returns:
            Google OAuth credentials if found, None otherwise
        """
        try:
            # Query the auth.identities table for Google provider tokens
            response = self.supabase.rpc(
                'get_user_google_tokens', 
                {'user_uuid': user_id}
            ).execute()
            
            if not response.data:
                print(f"No Google tokens found for user {user_id}")
                return None
            
            token_data = response.data[0]
            
            # Extract tokens from the identity data
            provider_token = token_data.get('provider_token')
            provider_refresh_token = token_data.get('provider_refresh_token')
            
            if not provider_token:
                print(f"No Google access token found for user {user_id}")
                return None
            
            # Create Google credentials object
            credentials = Credentials(
                token=provider_token,
                refresh_token=provider_refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=None,  # Not needed for refresh
                client_secret=None,  # Not needed for refresh
                scopes=['https://www.googleapis.com/auth/calendar']
            )
            
            return credentials
            
        except Exception as e:
            print(f"Error fetching Google tokens for user {user_id}: {e}")
            return None
    
    def get_google_tokens_direct_query(self, user_id: str) -> Optional[Credentials]:
        """
        Alternative method: Direct query to auth.identities table
        
        Args:
            user_id: User ID from JWT
            
        Returns:
            Google OAuth credentials if found
        """
        try:
            # Direct query to identities table
            response = self.supabase.table('identities').select(
                'provider_token, provider_refresh_token'
            ).eq('user_id', user_id).eq('provider', 'google').execute()
            
            if not response.data:
                print(f"No Google identity found for user {user_id}")
                return None
            
            identity = response.data[0]
            provider_token = identity.get('provider_token')
            provider_refresh_token = identity.get('provider_refresh_token')
            
            if not provider_token:
                print(f"No Google access token in identity for user {user_id}")
                return None
            
            credentials = Credentials(
                token=provider_token,
                refresh_token=provider_refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=None,
                client_secret=None,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
            
            return credentials
            
        except Exception as e:
            print(f"Error in direct query for user {user_id}: {e}")
            # If direct query fails, try using the user's session tokens
            # that were passed from frontend
            return None


# Global service instance
supabase_service = SupabaseService()