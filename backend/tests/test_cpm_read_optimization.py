import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.sih26016_service import sih_service


@pytest.mark.asyncio
async def test_cpm_read_requests_do_not_recompute():
    """
    Verify P0-2 fix: Read requests (/projects, /projects/{id}, /parcels,
    /critical-path, /geojson) must NOT trigger sync_with_db or CPM graph recomputation.
    """
    # Prime service initial state
    sih_service._load_data()
    sih_service._is_dirty = False
    initial_recomputes = sih_service.recompute_count
    initial_syncs = sih_service.db_sync_count

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"x-mock-role": "ADMIN"}
    ) as ac:
        # Perform 5 consecutive read calls across various endpoints
        res1 = await ac.get("/api/v1/sih26016/projects")
        assert res1.status_code == 200

        res2 = await ac.get("/api/v1/sih26016/projects/P-NH927A")
        assert res2.status_code == 200

        res3 = await ac.get("/api/v1/sih26016/projects/P-NH927A/parcels")
        assert res3.status_code == 200

        res4 = await ac.get("/api/v1/sih26016/projects/P-NH927A/critical-path")
        assert res4.status_code == 200

        res5 = await ac.get("/api/v1/sih26016/projects/P-NH927A/parcels/geojson")
        assert res5.status_code == 200

    # Ensure no recomputations or redundant db syncs occurred during reads
    assert sih_service.recompute_count == initial_recomputes, (
        f"Expected recompute_count {initial_recomputes}, but got {sih_service.recompute_count}. "
        "Read requests should not trigger CPM graph recomputation."
    )
    assert sih_service.db_sync_count == initial_syncs, (
        f"Expected db_sync_count {initial_syncs}, but got {sih_service.db_sync_count}. "
        "Read requests should not trigger database synchronization."
    )


@pytest.mark.asyncio
async def test_cpm_mutation_triggers_dirty_and_recompute():
    """
    Verify that explicit mark_dirty or state mutations cause CPM recomputation on sync.
    """
    sih_service._load_data()
    sih_service._is_dirty = False
    count_before = sih_service.recompute_count

    # Mark dirty explicitly (as done by field/admin mutations)
    sih_service.mark_dirty()
    assert sih_service._is_dirty is True

    # Recompute should occur when _enrich_and_compute is called
    sih_service._enrich_and_compute()
    assert sih_service.recompute_count == count_before + 1
    assert sih_service._is_dirty is False
