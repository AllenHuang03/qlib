#!/usr/bin/env python3
"""
Ultra-minimal API for Railway deployment testing
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Qlib Minimal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Qlib API is running"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "message": "Minimal API working"}

@app.get("/api/models")
def get_models():
    return [
        {
            "id": "1",
            "name": "AI Stock Picker #1",
            "type": "LSTM",
            "status": "active",
            "accuracy": 89.2,
            "sharpe": 1.67
        }
    ]

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("minimal_api:app", host="0.0.0.0", port=port, log_level="info")