import datetime
import uuid
from unittest.mock import MagicMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization

# Generate a temporary ES256 key pair for testing
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException
from jwt import PyJWKClientError

from app.api.deps import decode_and_verify_jwt

private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

mock_supabase_url = "https://mock.supabase.co"
expected_issuer = f"{mock_supabase_url}/auth/v1"
mock_sub = str(uuid.uuid4())

def create_mock_token(
    exp_delta=3600,
    nbf_delta=0,
    iss=expected_issuer,
    aud="authenticated",
    sub=mock_sub,
    alg="ES256"
):
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "exp": now + datetime.timedelta(seconds=exp_delta),
        "nbf": now + datetime.timedelta(seconds=nbf_delta),
        "iss": iss,
        "aud": aud,
        "sub": sub
    }
    return jwt.encode(payload, private_pem, algorithm=alg, headers={"kid": "test-key-id"})

@pytest.fixture
def mock_jwks_env():
    with patch("app.api.deps.get_supabase_url", return_value=mock_supabase_url):
        # Mock PyJWKClient to return our test public key
        mock_key = MagicMock()
        mock_key.key = public_pem
        
        mock_client = MagicMock()
        mock_client.get_signing_key_from_jwt.return_value = mock_key
        
        with patch("app.api.deps.get_jwks_client", return_value=mock_client) as m:
            yield m

def test_valid_es256_token(mock_jwks_env):
    token = create_mock_token()
    payload = decode_and_verify_jwt(token)
    assert payload["sub"] == mock_sub

def test_expired_token(mock_jwks_env):
    token = create_mock_token(exp_delta=-3600)
    with pytest.raises(HTTPException) as exc:
        decode_and_verify_jwt(token)
    assert exc.value.status_code == 401

def test_invalid_issuer(mock_jwks_env):
    token = create_mock_token(iss="https://wrong-issuer.com")
    with pytest.raises(HTTPException) as exc:
        decode_and_verify_jwt(token)
    assert exc.value.status_code == 401

def test_invalid_audience(mock_jwks_env):
    token = create_mock_token(aud="public")
    with pytest.raises(HTTPException) as exc:
        decode_and_verify_jwt(token)
    assert exc.value.status_code == 401

def test_invalid_nbf(mock_jwks_env):
    token = create_mock_token(nbf_delta=3600) # Valid in the future
    with pytest.raises(HTTPException) as exc:
        decode_and_verify_jwt(token)
    assert exc.value.status_code == 401

def test_unknown_signing_key():
    with patch("app.api.deps.get_supabase_url", return_value=mock_supabase_url):
        mock_client = MagicMock()
        mock_client.get_signing_key_from_jwt.side_effect = PyJWKClientError("Key not found")
        
        with patch("app.api.deps.get_jwks_client", return_value=mock_client):
            token = create_mock_token()
            with pytest.raises(HTTPException) as exc:
                decode_and_verify_jwt(token)
            assert exc.value.status_code == 401

def test_invalid_signature(mock_jwks_env):
    # Sign with a different key
    wrong_key = ec.generate_private_key(ec.SECP256R1())
    wrong_pem = wrong_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "exp": now + datetime.timedelta(seconds=3600),
        "nbf": now,
        "iss": expected_issuer,
        "aud": "authenticated",
        "sub": mock_sub
    }
    bad_token = jwt.encode(payload, wrong_pem, algorithm="ES256", headers={"kid": "test-key-id"})
    
    with pytest.raises(HTTPException) as exc:
        decode_and_verify_jwt(bad_token)
    assert exc.value.status_code == 401
