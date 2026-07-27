from fastapi import APIRouter
from app.api.endpoints import customers, batches, ai

api_router = APIRouter()

api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(batches.router, prefix="/batches", tags=["batches"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
