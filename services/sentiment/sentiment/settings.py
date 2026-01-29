import os
from dotenv import load_dotenv

load_dotenv()

def is_mock_mode() -> bool:
    return os.getenv("MOCK", "true").lower() == "true"

def hf_api_token() -> str | None:
    return os.getenv("HF_API_TOKEN")

def finbert_required() -> bool:
    return os.getenv("FINBERT_REQUIRED", "false").lower() == "true"

