"""
Limiter configuration for Rate Limiting.
=========================================
Uses SlowAPI to limit requests.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
