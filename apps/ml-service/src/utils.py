import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

class GCPLogger:
    """
    Structured JSON logger for Google Cloud Logging.
    """
    def __init__(self, service: str):
        self.service = service
        self.is_prod = os.getenv("NODE_ENV") == "production"

    def _emit(self, severity: str, message: str, meta: Optional[Dict[str, Any]] = None):
        entry = {
            "severity": severity,
            "message": message,
            "service": self.service,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        if meta:
            entry.update(meta)

        if self.is_prod:
            print(json.dumps(entry))
        else:
            # Dev mode colors
            colors = {"DEBUG": "\033[36m", "INFO": "\033[32m", "WARNING": "\033[33m", "ERROR": "\033[31m"}
            reset = "\033[0m"
            print(f"{colors.get(severity, '')}[{severity}]{reset} [{self.service}] {message} {meta if meta else ''}")

    def debug(self, msg: str, meta: Optional[Dict[str, Any]] = None): self._emit("DEBUG", msg, meta)
    def info(self, msg: str, meta: Optional[Dict[str, Any]] = None): self._emit("INFO", msg, meta)
    def warn(self, msg: str, meta: Optional[Dict[str, Any]] = None): self._emit("WARNING", msg, meta)
    def error(self, msg: str, meta: Optional[Dict[str, Any]] = None): self._emit("ERROR", msg, meta)

def validate_env(required_vars: List[str]) -> Dict[str, str]:
    """
    Fail fast if required environment variables are missing.
    """
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
    return {var: os.getenv(var) for var in required_vars}
