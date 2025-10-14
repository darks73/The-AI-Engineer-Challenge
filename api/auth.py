"""
OIDC Authentication Service for FastAPI
Handles JWT token validation using OIDC configuration
"""

import httpx
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from jose import jwt, JWTError
from jose.backends import RSAKey
import asyncio
from functools import lru_cache

# OIDC Configuration
OIDC_CONFIG_URL = "https://mavericks-playground.gw.test.onewelcome.net/oauth/.well-known/openid-configuration"
OIDC_CLIENT_ID = "348C95000A1FAD810C2640F8F79462539362DDDA744F4896EA840FD7FFE55C86"

class OIDCAuthService:
    def __init__(self):
        self._jwks_cache: Dict[str, RSAKey] = {}
        self._config_cache: Optional[Dict[str, Any]] = None
        self._cache_expiry: Optional[datetime] = None

    async def get_oidc_config(self) -> Dict[str, Any]:
        """Get OIDC configuration with caching"""
        if (self._config_cache and self._cache_expiry and 
            datetime.now(timezone.utc) < self._cache_expiry):
            return self._config_cache

        async with httpx.AsyncClient() as client:
            response = await client.get(OIDC_CONFIG_URL)
            response.raise_for_status()
            self._config_cache = response.json()
            # Cache for 1 hour
            self._cache_expiry = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=1)
            return self._config_cache

    async def get_jwks(self) -> Dict[str, Any]:
        """Get JWKS (JSON Web Key Set) from OIDC provider"""
        config = await self.get_oidc_config()
        jwks_uri = config["jwks_uri"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_uri)
            response.raise_for_status()
            return response.json()

    async def get_signing_key(self, token: str) -> Optional[RSAKey]:
        """Get the RSA public key for token verification"""
        try:
            # Decode token header to get key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            if not kid:
                return None

            # Check cache first
            if kid in self._jwks_cache:
                return self._jwks_cache[kid]

            # Get JWKS from OIDC provider
            jwks = await self.get_jwks()
            
            # Find the key with matching kid
            for key_data in jwks.get("keys", []):
                if key_data.get("kid") == kid:
                    # Convert JWK to RSA key
                    rsa_key = RSAKey(key_data, algorithm="RS256")
                    self._jwks_cache[kid] = rsa_key
                    return rsa_key
            
            return None
            
        except Exception as e:
            print(f"Error getting signing key: {e}")
            return None

    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token and return claims if valid"""
        try:
            # Get signing key
            signing_key = await self.get_signing_key(token)
            if not signing_key:
                return None

            # Get OIDC config for issuer validation
            config = await self.get_oidc_config()
            expected_issuer = config["issuer"]

            # Decode and verify token
            claims = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256", "RS384", "RS512"],
                issuer=expected_issuer,
                options={
                    "verify_signature": True,
                    "verify_aud": False,  # For public clients, we don't verify audience
                    "verify_iss": True,
                    "verify_exp": True,
                    "verify_iat": True,
                }
            )

            return claims

        except JWTError as e:
            print(f"JWT validation error: {e}")
            return None
        except Exception as e:
            print(f"Token validation error: {e}")
            return None

    async def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user info from OIDC userinfo endpoint"""
        try:
            config = await self.get_oidc_config()
            userinfo_endpoint = config["userinfo_endpoint"]
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    userinfo_endpoint,
                    headers={"Authorization": f"Bearer {token}"}
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            print(f"Error getting user info: {e}")
            return None

# Global instance
oidc_auth = OIDCAuthService()
