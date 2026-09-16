"""Tests for calendar conversion helpers."""

from datetime import date
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

MODULE_PATH = (
    Path(__file__).parents[1]
    / "custom_components"
    / "chinese_calendar"
    / "calendar_data.py"
)
SPEC = spec_from_file_location("calendar_data", MODULE_PATH)
assert SPEC and SPEC.loader
calendar_data = module_from_spec(SPEC)
SPEC.loader.exec_module(calendar_data)
build_day = calendar_data.build_day
build_month = calendar_data.build_month


def test_build_day_known_mid_autumn_festival() -> None:
    result = build_day(date(2024, 9, 17))
    assert result["lunar"] == "八月十五"
    assert "中秋节" in result["festivals"]
    assert "中秋节" in result["lunar_festivals"]


def test_build_day_separates_international_observances() -> None:
    result = build_day(date(2026, 9, 8))
    assert "世界扫盲日" in result["solar_other_festivals"]
    assert "世界扫盲日" not in result["lunar_festivals"]


def test_build_month_always_has_six_weeks() -> None:
    result = build_month(2026, 9)
    assert len(result["days"]) == 42
    assert result["days"][0]["date"] == "2026-08-31"
    assert result["days"][-1]["date"] == "2026-10-11"
    assert sum(day["in_month"] for day in result["days"]) == 30


def test_build_month_rejects_invalid_values() -> None:
    try:
        build_month(2026, 13)
    except ValueError as err:
        assert "month" in str(err)
    else:
        raise AssertionError("invalid month should fail")
