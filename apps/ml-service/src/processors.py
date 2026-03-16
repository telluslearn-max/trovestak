from google.cloud import bigquery
import json
import os
from src.utils import GCPLogger
from supabase import create_client, Client
import zlib

log = GCPLogger("ml-processors")
bq_client = bigquery.Client()
DATASET_ID = os.getenv("BQ_DATASET_ID", "trovestak_ml")
TABLE_ID = os.getenv("BQ_TABLE_ID", "interactions")

def process_order_created(message_data: str):
    """
    Processes an 'order.created' event.
    Extracts features and persists to BigQuery for ML training.
    """
    try:
        event = json.loads(message_data)
        data = event.get("data", {})
        order_id = data.get("order_id")
        user_id = data.get("user_id", "anonymous")
        items = data.get("items", [])
        total_amount = data.get("total_amount", 0)
        
        # Extract product IDs
        product_ids = [item.get("product_id") for item in items if item.get("product_id")]
        
        # Prepare BigQuery row
        row = {
            "order_id": order_id,
            "user_id": user_id,
            "product_ids": [{"id": pid} for pid in product_ids],
            "total_amount": total_amount,
            "timestamp": event.get("timestamp")
        }

        # Stream into BigQuery
        table_ref = f"{bq_client.project}.{DATASET_ID}.{TABLE_ID}"
        errors = bq_client.insert_rows_json(table_ref, [row])
        
        if errors:
            log.error(f"BQ Insert errors for order {order_id}", {"errors": errors})
            return False

        log.info(f"Successfully ingested order {order_id} to BigQuery")
        return True
    except Exception as e:
        log.error("Failed to process order event", {"error": str(e), "data": message_data})
        return False

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

def process_stock_updated(message_data: str):
    """
    Processes a 'stock.updated' event from catalog-service.
    On restock (positive change), invalidates cached recommendations for the affected variant's
    product so users see the restocked item surface again.
    """
    try:
        event = json.loads(message_data)
        data = event.get("data", {})
        variant_id = data.get("variant_id")
        change = data.get("change", 0)
        reason = data.get("reason", "unknown")

        if change > 0 and supabase:
            # Restock: fetch the product_id for this variant, then delete cached recommendations
            # that excluded this product so it can resurface in fresh scores.
            result = supabase.table("product_variants") \
                .select("product_id") \
                .eq("id", variant_id) \
                .maybe_single() \
                .execute()
            product_id = result.data.get("product_id") if result.data else None
            if product_id:
                supabase.table("product_recommendations") \
                    .delete() \
                    .contains("excluded_product_ids", [product_id]) \
                    .execute()
                log.info(f"Invalidated recommendations for restocked product {product_id}")

        log.info(f"stock.updated processed", {"variant_id": variant_id, "change": change, "reason": reason})
        return True
    except Exception as e:
        log.error("Failed to process stock.updated event", {"error": str(e)})
        return False


def process_user_event(message_data: str):
    """
    Processes a 'user_event' from the storefront.
    Updates the user's taste profile using ML-derived scores.
    """
    from src.model import recommender
    
    try:
        event = json.loads(message_data)
        user_id = event.get("user_id")
        event_type = event.get("type")
        metadata = event.get("metadata", {})
        
        category_id = metadata.get("category_id")
        if not user_id or not category_id:
            return True # Not actionable but acknowledged

        # 1. Map IDs to ints for TF model
        user_int = zlib.adler32(user_id.encode()) % 1000
        cat_int = zlib.adler32(category_id.encode()) % 100
        
        # 2. Extract metrics
        view_duration = metadata.get("view_duration", 0.0)
        scroll_depth = metadata.get("scroll_depth", 0.0)
        
        # 3. Predict Affinity Score
        score = recommender.predict_affinity(user_int, cat_int, [view_duration, scroll_depth])
        
        # 4. Update Supabase Taste Profile
        if supabase:
            # We use an upsert/logic to increment affinity or set it
            # The "affinity_score" in our DB might be a column or a JSONB map
            # Assuming a structure: { category_id: score } in a jsonb column 'affinities'
            log.info(f"Updating taste profile for {user_id} category {category_id} with score {score}")
            
            # This is a simplification: in a real app, we'd fetch-and-merge or use a Postgres function
            # For the hackathon, we'll try a direct update to a specific category affinity table or similar
            # Let's assume there's a table `user_taste_profiles` with `user_id`, `category_id`, `affinity_score`
            supabase.table("user_taste_profiles").upsert({
                "user_id": user_id,
                "category_id": category_id,
                "tf_affinity_score": score,
                "updated_at": "now()"
            }, on_conflict="user_id, category_id").execute()

        # 5. Also log to BigQuery for future retraining
        row = {
            "user_id": user_id,
            "event_type": event_type,
            "category_id": category_id,
            "view_duration": view_duration,
            "scroll_depth": scroll_depth,
            "ml_score": score,
            "timestamp": "auto"
        }
        # In a real app: bq_client.insert_rows_json(...)
        
        return True
    except Exception as e:
        log.error("Failed to process user event", {"error": str(e), "data": message_data})
        return False
