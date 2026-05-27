import sys
from app.core.config import get_settings
settings = get_settings()
print('URL:', settings.DATABASE_URL)
