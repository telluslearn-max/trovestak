"""
ML SERVICE — Entry Point
FastAPI application for TensorFlow-powered recommendations.
"""

import json
import os
import uuid
import zlib
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.utils import GCPLogger, validate_env

log = GCPLogger("ml-service")

# Validate required env vars at startup (but don't crash if optional ones are missing)
required_vars = [
    "GOOGLE_CLOUD_PROJECT",
    "PUBSUB_SUBSCRIPTION_ORDER_CREATED_ML",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
]
env = validate_env(required_vars)

# ── Lazy-loaded globals (initialized on startup, not at import time) ──────────
recommender = None
subscriber = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    global recommender, subscriber

    log.info("ml-service starting up...")

    # 1. Initialize TensorFlow model (lazy — after server is ready to accept traffic)
    from src.model import TroveTensorFlowModel
    recommender = TroveTensorFlowModel()
    log.info("TensorFlow model initialized.")

    # 2. Start Pub/Sub subscribers in background
    try:
        from google.cloud import pubsub_v1
        from src.processors import process_order_created, process_user_event, process_stock_updated

        subscriber = pubsub_v1.SubscriberClient()

        def make_callback(handler):
            def callback(message):
                log.info(f"Received message: {message.message_id}")
                try:
                    data_str = message.data.decode("utf-8")
                    success = handler(data_str)
                    message.ack() if success else message.nack()
                except Exception as e:
                    log.error("Callback failed", {"error": str(e)})
                    message.nack()
            return callback

        def order_callback(message):
            log.info(f"Received message: {message.message_id}")
            try:
                data_str = message.data.decode("utf-8")
                event = json.loads(data_str)
                event_type = event.get("type", event.get("topic", "unknown"))
                success = process_order_created(data_str) if "order.created" in event_type else process_user_event(data_str)
                message.ack() if success else message.nack()
            except Exception as e:
                log.error("Callback failed", {"error": str(e)})
                message.nack()

        # Sub 1: Orders
        orders_path = subscriber.subscription_path(
            env["GOOGLE_CLOUD_PROJECT"],
            env["PUBSUB_SUBSCRIPTION_ORDER_CREATED_ML"]
        )
        subscriber.subscribe(orders_path, callback=order_callback)
        log.info(f"Subscribed to {orders_path}")

        # Sub 2: Stock Updated — invalidate recommendations on restock
        stock_sub = os.environ.get("PUBSUB_SUBSCRIPTION_STOCK_UPDATED_ML")
        if stock_sub:
            stock_path = subscriber.subscription_path(env["GOOGLE_CLOUD_PROJECT"], stock_sub)
            subscriber.subscribe(stock_path, callback=make_callback(process_stock_updated))
            log.info(f"Subscribed to {stock_path}")

        # Sub 3: User Events (optional)
        user_events_sub = os.environ.get("PUBSUB_SUBSCRIPTION_USER_EVENTS_ML")
        if user_events_sub:
            events_path = subscriber.subscription_path(
                env["GOOGLE_CLOUD_PROJECT"], user_events_sub
            )
            subscriber.subscribe(events_path, callback=make_callback(process_user_event))
            log.info(f"Subscribed to {events_path}")

    except Exception as e:
        # Don't crash if Pub/Sub fails — the /recommend API should still serve
        log.error("Pub/Sub subscription failed (non-fatal)", {"error": str(e)})

    yield

    # Shutdown
    log.info("ml-service shutting down...")
    if subscriber:
        subscriber.close()


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Trovestak ML Service",
    description="TensorFlow microservice for product recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    return {"status": "ok", "service": "ml-service"}


# ── Recommendation endpoint ────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    user_id: str
    category_ids: List[str]
    view_durations: Optional[List[float]] = None
    scroll_depths: Optional[List[float]] = None


@app.post("/recommend")
async def get_recommendations(req: RecommendRequest):
    """Returns affinity scores for requested categories using TensorFlow."""
    if not recommender:
        return {"error": "Model not yet initialized"}

    results = []
    user_int = zlib.adler32(req.user_id.encode()) % 1000

    for i, cat_id in enumerate(req.category_ids):
        cat_int = zlib.adler32(cat_id.encode()) % 100
        duration = req.view_durations[i] if req.view_durations and i < len(req.view_durations) else 0.0
        depth = req.scroll_depths[i] if req.scroll_depths and i < len(req.scroll_depths) else 0.0

        score = recommender.predict_affinity(user_int, cat_int, [duration, depth])
        results.append({"category_id": cat_id, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)

    # Publish recommendation.ready (fire-and-forget)
    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    if project:
        try:
            from google.cloud import pubsub_v1
            publisher = pubsub_v1.PublisherClient()
            topic_path = publisher.topic_path(project, "recommendation.ready")
            payload = json.dumps({
                "id": str(uuid.uuid4()),
                "topic": "recommendation.ready",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "ml-service",
                "version": "1.0",
                "data": {
                    "user_id": req.user_id,
                    "recommendations": results,
                },
            }).encode("utf-8")
            publisher.publish(topic_path, payload)
        except Exception as e:
            log.error("Failed to publish recommendation.ready", {"error": str(e)})

    return {"user_id": req.user_id, "recommendations": results}


# ── Train endpoint ─────────────────────────────────────────────────────────────

class TrainRequest(BaseModel):
    session_id: str


@app.post("/train")
async def train_for_session(req: TrainRequest):
    """
    Reads this session's user_events from Supabase, fine-tunes the TF model,
    and persists category affinities to user_taste_profiles.
    """
    if not recommender:
        return {"error": "Model not initialized"}

    sb_url = os.environ.get("SUPABASE_URL")
    sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not sb_url or not sb_key:
        return {"error": "Supabase not configured"}

    from supabase import create_client
    sb = create_client(sb_url, sb_key)

    result = sb.table("user_events") \
        .select("session_id, category_id, metadata") \
        .eq("session_id", req.session_id) \
        .order("created_at", desc=False) \
        .limit(200) \
        .execute()

    flat_events = []
    for e in (result.data or []):
        if not e.get("category_id"):
            continue
        meta = e.get("metadata") or {}
        flat_events.append({
            "session_id": e["session_id"],
            "category_id": e["category_id"],
            "view_duration": meta.get("view_duration", 0),
            "scroll_depth": meta.get("scroll_depth", 0),
        })

    train_result = recommender.train_on_events(flat_events)

    if train_result.get("affinities"):
        rows = [
            {
                "session_id": req.session_id,
                "category_id": cat_id,
                "affinity": score,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            for cat_id, score in train_result["affinities"].items()
        ]
        sb.table("user_taste_profiles") \
            .upsert(rows, on_conflict="session_id,category_id") \
            .execute()

    return {"session_id": req.session_id, **train_result}


# ── Affinities endpoint ────────────────────────────────────────────────────────

@app.get("/affinities/{session_id}")
async def get_affinities(session_id: str):
    """Returns stored TF affinity scores for a session."""
    sb_url = os.environ.get("SUPABASE_URL")
    sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not sb_url or not sb_key:
        return {"affinities": []}

    from supabase import create_client
    sb = create_client(sb_url, sb_key)
    result = sb.table("user_taste_profiles") \
        .select("category_id, affinity") \
        .eq("session_id", session_id) \
        .order("affinity", desc=True) \
        .execute()

    return {"session_id": session_id, "affinities": result.data or []}
