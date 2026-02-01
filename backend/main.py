from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import syllabus, calendar, simplify


# Initialize FastAPI app
app = FastAPI(
    title="Syllabus Kitty API",
    description="AI-powered syllabus extraction and calendar generation",
    version="1.0.0",
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(syllabus.router)
app.include_router(calendar.router)
app.include_router(simplify.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🐱 Welcome to Syllabus Kitty API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "syllabus-kitty-api"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
