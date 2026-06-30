import sys
import logging
from datetime import datetime, timezone
from pythonjsonlogger import jsonlogger
from common.tracing import current_trace_ids


class JSONFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["timestamp"] = datetime.now(timezone.utc).isoformat()
        log_record["level"] = record.levelname
        trace_ids = current_trace_ids()
        if trace_ids is not None:
            log_record["trace_id"], log_record["span_id"] = trace_ids


def setup_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    root.setLevel(level)
    if root.handlers:
        root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root.addHandler(handler)

