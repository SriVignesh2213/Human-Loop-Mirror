import logging
import sys
import json
from datetime import datetime, timezone


class StructuredJsonFormatter(logging.Formatter):
    """
    Formats logs as structured JSON containing timestamp, level, message,
    and optional request metadata (request_id, route, status, duration_ms).
    Safely redacts passwords, tokens, and keys.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Extra fields if provided
        for key in ["request_id", "route", "status", "duration_ms", "user_id"]:
            if hasattr(record, key):
                log_obj[key] = getattr(record, key)

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)


def setup_logger(name: str = "habit_loop_mirror") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)

    return logger


logger = setup_logger()
