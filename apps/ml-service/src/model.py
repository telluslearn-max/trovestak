import tensorflow as tf
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
import os
from src.utils import GCPLogger

log = GCPLogger("ml-model")

class TroveTensorFlowModel:
    """
    TensorFlow model for personalized category affinity and product recommendations.
    Uses an embedding-based approach to map users and categories into a shared latent space.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or "models/trove_affinity_v1"
        self.model = None
        self._initialize_model()

    def _initialize_model(self):
        """
        Loads the model if it exists, or creates a fresh one.
        """
        if os.path.exists(self.model_path):
            try:
                self.model = tf.keras.models.load_model(self.model_path)
                log.info(f"Loaded existing model from {self.model_path}")
            except Exception as e:
                log.error(f"Failed to load model from {self.model_path}", {"error": str(e)})
                self._build_fresh_model()
        else:
            self._build_fresh_model()

    def _build_fresh_model(self):
        """
        Builds a simple collaborative filtering style model using Keras.
        Actually, for a hackathon, we'll use a Hybrid approach:
        Interest = f(UserEmbedding, CategoryEmbedding, Metadata)
        """
        log.info("Building fresh TensorFlow model...")
        
        # Inputs
        user_input = tf.keras.layers.Input(shape=(1,), name="user")
        category_input = tf.keras.layers.Input(shape=(1,), name="category")
        metrics_input = tf.keras.layers.Input(shape=(2,), name="metrics") # [view_duration, scroll_depth]

        # Embeddings (Vocab size 1000 for users, 100 for categories as placeholders)
        user_embedding = tf.keras.layers.Embedding(1000, 16)(user_input)
        cat_embedding = tf.keras.layers.Embedding(100, 16)(category_input)

        # Flatten
        u_vec = tf.keras.layers.Flatten()(user_embedding)
        c_vec = tf.keras.layers.Flatten()(cat_embedding)

        # Concatenate everything
        concat = tf.keras.layers.Concatenate()([u_vec, c_vec, metrics_input])

        # Dense Layers
        dense1 = tf.keras.layers.Dense(32, activation='relu')(concat)
        dense2 = tf.keras.layers.Dense(16, activation='relu')(dense1)
        output = tf.keras.layers.Dense(1, activation='sigmoid', name="score")(dense2)

        self.model = tf.keras.models.Model(
            inputs=[user_input, category_input, metrics_input],
            outputs=output
        )

        self.model.compile(optimizer='adam', loss='mse')
        log.info("Model built and compiled.")

    def predict_affinity(self, user_id_int: int, category_id_int: int, metrics: List[float]) -> float:
        """
        Predicts the affinity score (0-1) for a user and category.
        """
        if self.model is None:
            return 0.5
        
        try:
            # Prepare inputs as numpy arrays
            u = np.array([[user_id_int]])
            c = np.array([[category_id_int]])
            m = np.array([metrics]) # [[view_duration, scroll_depth]]

            prediction = self.model.predict([u, c, m], verbose=0)
            return float(prediction[0][0])
        except Exception as e:
            log.error("Prediction failed", {"error": str(e)})
            return 0.5

    def save(self):
        """
        Saves the model to the local filesystem.
        """
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            self.model.save(self.model_path)
            log.info(f"Model saved to {self.model_path}")
        except Exception as e:
            log.error(f"Failed to save model", {"error": str(e)})

# Singleton instance
recommender = TroveTensorFlowModel()
