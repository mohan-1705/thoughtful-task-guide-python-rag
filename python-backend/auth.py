"""
Verifies Firebase ID tokens sent from the React frontend.
Mirrors the logic in src/lib/firebase-admin.server.ts but in Python,
using Google's public JWKS (no service account key needed).
"""
import os
from fastapi import Header, HTTPException
from jose import jwt
from jose.exceptions import JWTError
import httpx

FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID")

JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"

_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(JWKS_URL, timeout=10)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


async def verify_firebase_token(token: str) -> dict:
    if not FIREBASE_PROJECT_ID:
        raise HTTPException(status_code=500, detail="Missing FIREBASE_PROJECT_ID env var")

    jwks = await _get_jwks()
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        # Google's endpoint returns { kid: x509_cert_pem, ... } (not standard JWK format).
        # python-jose can load an RSA public key directly from a PEM x509 certificate.
        cert_pem = jwks.get(kid) if isinstance(jwks, dict) else None
        if not cert_pem:
            raise HTTPException(status_code=401, detail="Unauthorized: unknown key id")

        payload = jwt.decode(
            token,
            cert_pem,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
        )
        if "sub" not in payload:
            raise HTTPException(status_code=401, detail="Unauthorized: invalid token")
        return {"uid": payload["sub"], "email": payload.get("email")}
    except HTTPException:
        raise
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {e}")


async def require_auth(authorization: str = Header(default=None)) -> dict:
    """FastAPI dependency — use as: user = Depends(require_auth)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    return await verify_firebase_token(token)
