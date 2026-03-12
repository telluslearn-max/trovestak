"""
ML SERVICE — Entry Point
FastAPI application for TensorFlow-powered recommendations,
demand forecasting, and search ranking via Vertex AI.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import signal
from src.processors import process_order_created, process_user_event
from src.utils import GCPLogger, validate_env
from google.cloud import pubsub_v1
import threading
from pydantic import BaseModel
from typing import List, Optional
from src.model import TroveTensorFlowModel
import zlib

# 1. Initialize Logger
log = GCPLogger("ml-service")

# 2. Validate Environment
required_vars = [
    "GOOGLE_CLOUD_PROJECT",
    "PUBSUB_SUBSCRIPTION_ORDER_CREATED_ML",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
]
env = validate_env(required_vars)

app = FastAPI(
    title="Trovestak ML Service",
    description="TensorFlow microservice for product recommendations and demand forecasting",
    version="1.0.0",
)

# 3. Initialize Model
recommender = TroveTensorFlowModel()

class RecommendRequest(BaseModel):
    user_id: str
    category_ids: List[str]
    view_durations: Optional[List[float]] = None # Relative to each category
    scroll_depths: Optional[List[float]] = None # Relative to each category

@app.post("/recommend")
async def get_recommendations(req: RecommendRequest):
    """
    Returns scores for requested categories using the TensorFlow model.
    """
    results = []
    
    # Simple Hash to Map String IDs to Ints for Embedding Layer
    user_int = zlib.adler32(req.user_id.encode()) % 1000
    
    for i, cat_id in enumerate(req.category_ids):
        cat_int = zlib.adler32(cat_id.encode()) % 100
        
        # Default metrics if not provided
        duration = req.view_durations[i] if req.view_durations and i < len(req.view_durations) else 0.0
        depth = req.scroll_depths[i] if req.scroll_depths and i < len(req.scroll_depths) else 0.0
        
        score = recommender.predict_affinity(user_int, cat_int, [duration, depth])
        results.append({
            "category_id": cat_id,
            "score": score
        })
        
    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "user_id": req.user_id,
        "recommendations": results
    }

# Pub/Sub Streaming Pull State
subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path(env["GOOGLE_CLOUD_PROJECT"], env["PUBSUB_SUBSCRIPTION_ORDER_CREATED_ML"])
streaming_pull_future = None

def callback(message):
    log.info(f"Received message: {message.message_id}")
    try:
        data_str = message.data.decode("utf-8")
        event = json.loads(data_str)
        event_type = event.get("type", "unknown")
        
        success = False
        if event_type == "order.created":
            success = process_order_created(data_str)
        else:
            # Assume it's a behavioral user event (view, scroll, etc)
            success = process_user_event(data_str)
            
        if success:
            message.ack()
        else:
            message.nack()
    except Exception as e:
        log.error("Callback failed", {"error": str(e)})
        message.nack()

@app.on_event("startup")
async def startup_event():
    global streaming_pull_future
    log.info("ml-service starting up...")
    
    # Start the subscribers
    log.info(f"Starting Pub/Sub subscribers...")
    
    # Sub 1: Orders
    subscriber.subscribe(subscription_path, callback=callback)
    
    # Sub 2: User Events
    user_events_sub = env.get("PUBSUB_SUBSCRIPTION_USER_EVENTS_ML")
    if user_events_sub:
        user_events_path = subscriber.subscription_path(env["GOOGLE_CLOUD_PROJECT"], user_events_sub)
        log.info(f"Subscribing to {user_events_path}")
        subscriber.subscribe(user_events_path, callback=callback)

@app.on_event("shutdown")
async def shutdown_event():
    log.info("ml-service shutting down...")
    if streaming_pull_future:
        streaming_pull_future.cancel()
        streaming_pull_future.result() # Wait for shutdown

# TODO: Mount routers for recommendations, forecasting, and ranking
