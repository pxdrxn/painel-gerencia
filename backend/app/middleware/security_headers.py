"""
Security Headers Middleware.
=============================
Adds critical security headers to all responses.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware que injeta cabeçalhos HTTP de segurança para mitigar XSS,
    clickjacking, MIME sniffing e outras vulnerabilidades comuns.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # 1. Prevenir clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # 2. Mitigar ataques de sniffing de MIME
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # 3. Proteção clássica XSS (browsers legados)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # 4. HSTS (Strict-Transport-Security) para forçar HTTPS (365 dias)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # 5. Content-Security-Policy (CSP) personalizada
        # APIs geralmente têm CSP restrita, exceto para documentação Swagger/Redoc que exige inline scripts/estilos.
        path = request.url.path
        if not (path.startswith("/api/docs") or path.startswith("/api/redoc") or path.startswith("/openapi.json")):
            response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        else:
            # CSP flexível para permitir Swagger UI funcionar corretamente
            response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; frame-ancestors 'none';"
            
        return response
