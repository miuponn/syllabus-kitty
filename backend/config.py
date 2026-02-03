from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Gemini API
    gemini_api_key: str
    gemini_model_id: str = "gemini-3-flash-preview"
    
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    
    # Google Calendar API
    google_calendar_credentials_path: str = "./credentials.json"
    google_calendar_token_path: str = "./token.json"
    
    # Email Configuration (SMTP)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_starttls: bool = True
    smtp_ssl_tls: bool = False
    
    # Notification Settings
    notification_advance_days: int = 10
    timezone: str = "America/Toronto"
    system_notification_key: str = "your_secret_system_key_here"
    
    # FastAPI Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS
    allowed_origins: str = "http://localhost:3000"
    
    # Frontend URL (for extension app-url endpoint)
    frontend_url: str = "http://localhost:3000"
    
    # Upload Configuration
    max_upload_size_mb: int = 25
    upload_dir: str = "./uploads"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def max_upload_size_bytes(self) -> int:
        """Convert MB to bytes"""
        return self.max_upload_size_mb * 1024 * 1024
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
