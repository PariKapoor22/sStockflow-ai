from stockflow_hazard.district_merge import calculate_district_status

def test_district_merge_verified_extreme():
    # Kohima, Nagaland (d-in-nl-koh)
    risks = []
    incidents = [{"district_id": "d-in-nl-koh", "severity": "EXTREME", "verified": True, "status": "OPEN", "report_id": "r_koh_01", "segment_id": "seg_nl_koh_001"}]
    overrides = []
    calc_at = "2026-08-26T12:00:00Z"
    
    res = calculate_district_status("d-in-nl-koh", risks, incidents, overrides, calc_at)
    assert res["status"] == "ISOLATED"
    assert "VERIFIED_EXTREME_INCIDENT" in res["reason_codes"]
    assert res["active_report_ids"] == ["r_koh_01"]
    assert res["worst_affected_segments"] == ["seg_nl_koh_001"]
    assert res["source_counts"]["incidents"] == 1

def test_district_merge_unverified_high():
    # Kamrup Metropolitan, Assam (d-in-as-kam)
    incidents = [{"district_id": "d-in-as-kam", "severity": "HIGH", "verified": False, "status": "OPEN", "report_id": "r_kam_01"}]
    res = calculate_district_status("d-in-as-kam", [], incidents, [], "2026-08-26T12:00:00Z")
    assert res["status"] == "CAUTION"

def test_district_merge_expired_risk():
    # Imphal West, Manipur (d-in-mn-iw)
    risks = [{"district_id": "d-in-mn-iw", "risk_level": "HIGH", "valid_until": "2026-08-26T10:00:00Z"}]
    res = calculate_district_status("d-in-mn-iw", risks, [], [], "2026-08-26T12:00:00Z")
    assert res["status"] == "NO_DATA"

def test_district_merge_manual_override():
    # East Khasi Hills, Meghalaya (d-in-ml-ekh)
    risks = [{"district_id": "d-in-ml-ekh", "risk_level": "HIGH", "valid_until": "2026-08-26T14:00:00Z"}]
    overrides = [{"district_id": "d-in-ml-ekh", "status": "RESTRICTED", "expires_at": "2026-08-27T12:00:00Z"}]
    res = calculate_district_status("d-in-ml-ekh", risks, [], overrides, "2026-08-26T12:00:00Z")
    assert res["status"] == "RESTRICTED"
    # Source counts should reflect the real underlying risks even when overridden
    assert res["source_counts"]["risks"] == 1
    assert res["source_counts"]["overrides"] == 1

def test_district_merge_cleared_rejected_ignored():
    # West Tripura, Tripura (d-in-tr-wt)
    incidents = [
        {"district_id": "d-in-tr-wt", "severity": "EXTREME", "verified": True, "status": "CLEARED", "report_id": "r_wt_01"},
        {"district_id": "d-in-tr-wt", "severity": "HIGH", "verified": True, "status": "REJECTED", "report_id": "r_wt_02"}
    ]
    res = calculate_district_status("d-in-tr-wt", [], incidents, [], "2026-08-26T12:00:00Z")
    assert res["status"] == "NO_DATA"
    assert res["source_counts"]["incidents"] == 0

def test_district_merge_verified_high_overrides_low_risk():
    # East Sikkim, Sikkim (d-in-sk-esk)
    risks = [{"district_id": "d-in-sk-esk", "risk_level": "LOW", "valid_until": "2026-08-26T14:00:00Z", "segment_id": "seg_sk_esk_001"}]
    incidents = [{"district_id": "d-in-sk-esk", "severity": "HIGH", "verified": True, "status": "OPEN", "report_id": "r_sk_01", "segment_id": "seg_sk_esk_002"}]
    
    res = calculate_district_status("d-in-sk-esk", risks, incidents, [], "2026-08-26T12:00:00Z")
    
    assert res["status"] == "RESTRICTED"
    assert "VERIFIED_HIGH_INCIDENT" in res["reason_codes"]
    assert res["source_counts"]["incidents"] == 1
    assert res["source_counts"]["risks"] == 1
    assert "seg_sk_esk_001" not in res["worst_affected_segments"] # Only HIGH/EXTREME risks add to worst segments
    assert "seg_sk_esk_002" in res["worst_affected_segments"]
    assert "r_sk_01" in res["active_report_ids"]
