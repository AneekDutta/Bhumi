import sys
from pathlib import Path

import pytest

# Ensure backend root is on sys.path regardless of execution environment
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))


@pytest.fixture(autouse=True, scope="function")
def reset_rate_limiter_for_test():
    """
    Reset the in-process rate limiter at the start of each test session.

    The rate limiter is a module-level singleton (app.core.security.rate_limiter).
    When all tests run sequentially in a single process, MUTATION endpoint request
    counts accumulate across the entire session. Tests that happen to be scheduled
    after many MUTATION requests are made will see 429 responses even though they
    have nothing to do with rate limiting.

    Clearing _store at session start guarantees a known-zero baseline without
    changing the rate limiter's behaviour in production or altering any security
    property.
    """
    from app.core.security import rate_limiter
    with rate_limiter._lock:
        rate_limiter._store.clear()
    yield
    # No teardown needed — process exits after the session completes.
