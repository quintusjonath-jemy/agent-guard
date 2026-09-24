import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Any
import bcrypt
from jose import jwt, JWTError
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # bcrypt requires bytes and max 72 bytes length
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")

def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None, extra_claims: Optional[dict] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if extra_claims:
        to_encode.update(extra_claims)
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_api_key(prefix: str = "ag_live") -> tuple[str, str, str]:
    """
    Generates a secure API key.
    Returns:
        (full_key, key_prefix, hashed_key)
    """
    random_part = secrets.token_urlsafe(32)
    full_key = f"{prefix}_{random_part}"
    key_prefix = full_key[:12]
    hashed_key = hashlib.sha256(full_key.encode("utf-8")).hexdigest()
    return full_key, key_prefix, hashed_key

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()
