from datetime import datetime
from typing import List, Dict, Any

def _parse_ts(ts_str: str) -> datetime:
    return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))

def calculate_district_status(
    district_id: str,
    current_risks: List[Dict],
    current_incidents: List[Dict],
    manual_overrides: List[Dict],
    calculated_at: str
) -> Dict[str, Any]:
    calc_time = _parse_ts(calculated_at)
    
    status = "NO_DATA"
    reason_codes = set()
    active_report_ids = []
    worst_segments = set()
    
    # Pre-calculate valid risks and incidents for accurate source_counts
    valid_risks = [r for r in current_risks if r.get('district_id') == district_id and _parse_ts(r['valid_until']) > calc_time]
    valid_incidents = [i for i in current_incidents if i.get('district_id') == district_id and i.get('status') not in ['CLEARED', 'REJECTED']]

    for override in manual_overrides:
        if override.get('district_id') == district_id:
            exp = _parse_ts(override.get('expires_at', '9999-12-31T23:59:59Z'))
            if calc_time < exp:
                return {
                    "district_id": district_id,
                    "status": override.get('status', 'RESTRICTED'),
                    "reason_codes": ["MANUAL_OVERRIDE"],
                    "active_report_ids": [],
                    "worst_affected_segments": [],
                    "source_counts": {"incidents": len(valid_incidents), "risks": len(valid_risks), "overrides": 1},
                    "data_freshness": calculated_at
                }

    if not valid_risks and not valid_incidents:
        return {
            "district_id": district_id,
            "status": "NO_DATA",
            "reason_codes": ["NO_CURRENT_DATA"],
            "active_report_ids": [],
            "worst_affected_segments": [],
            "source_counts": {"incidents": 0, "risks": 0, "overrides": 0},
            "data_freshness": calculated_at
        }

    hierarchy = {"ISOLATED": 4, "RESTRICTED": 3, "CAUTION": 2, "OPEN": 1, "NO_DATA": 0}
    current_best = "OPEN"
    
    for inc in valid_incidents:
        sev = inc.get('severity', '').upper()
        ver = inc.get('verified', False)
        active_report_ids.append(inc.get('report_id'))
        if inc.get('segment_id'): worst_segments.add(inc['segment_id'])
        
        if sev == 'EXTREME' and ver:
            current_best = "ISOLATED"
            reason_codes.add("VERIFIED_EXTREME_INCIDENT")
        elif sev == 'HIGH' and ver:
            if hierarchy[current_best] < hierarchy["RESTRICTED"]: current_best = "RESTRICTED"
            reason_codes.add("VERIFIED_HIGH_INCIDENT")
        elif sev == 'HIGH' and not ver:
            if hierarchy[current_best] < hierarchy["CAUTION"]: current_best = "CAUTION"
            reason_codes.add("UNVERIFIED_HIGH_INCIDENT")

    for rsk in valid_risks:
        level = rsk.get('risk_level', '').upper()
        if level in ['HIGH', 'EXTREME']:
            if hierarchy[current_best] < hierarchy["RESTRICTED"]: current_best = "RESTRICTED"
            reason_codes.add("HIGH_MODEL_RISK")
            if rsk.get('segment_id'): worst_segments.add(rsk['segment_id'])

    if current_best == "OPEN":
        reason_codes.add("NO_CRITICAL_ISSUES")

    return {
        "district_id": district_id,
        "status": current_best,
        "reason_codes": list(reason_codes),
        "active_report_ids": active_report_ids,
        "worst_affected_segments": list(worst_segments),
        "source_counts": {"incidents": len(valid_incidents), "risks": len(valid_risks), "overrides": 0},
        "data_freshness": calculated_at
    }
