"""Convert lunar_python values into Home Assistant friendly dictionaries."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from lunar_python import Solar


def _unique(values: list[str]) -> list[str]:
    """Return non-empty strings without duplicates while preserving order."""
    return list(dict.fromkeys(value for value in values if value))


def build_day(day: date) -> dict[str, Any]:
    """Build almanac data for one Gregorian date."""
    solar = Solar.fromYmd(day.year, day.month, day.day)
    lunar = solar.getLunar()

    solar_festivals = _unique(list(solar.getFestivals()))
    solar_other_festivals = _unique(list(solar.getOtherFestivals()))
    lunar_festivals = _unique([*lunar.getFestivals(), *lunar.getOtherFestivals()])
    festivals = _unique([*lunar_festivals, *solar_festivals, *solar_other_festivals])
    jieqi = lunar.getJieQi() or ""
    lunar_month = f"{lunar.getMonthInChinese()}月"
    lunar_day = lunar.getDayInChinese()

    return {
        "date": day.isoformat(),
        "year": day.year,
        "month": day.month,
        "day": day.day,
        "weekday": solar.getWeekInChinese(),
        "lunar": f"{lunar_month}{lunar_day}",
        "lunar_month": lunar_month,
        "lunar_day": lunar_day,
        "year_ganzhi": lunar.getYearInGanZhi(),
        "month_ganzhi": lunar.getMonthInGanZhi(),
        "day_ganzhi": lunar.getDayInGanZhi(),
        "zodiac": lunar.getYearShengXiao(),
        "year_zodiac": lunar.getYearShengXiao(),
        "month_zodiac": lunar.getMonthShengXiao(),
        "day_zodiac": lunar.getDayShengXiao(),
        "year_nayin": lunar.getYearNaYin(),
        "month_nayin": lunar.getMonthNaYin(),
        "day_nayin": lunar.getDayNaYin(),
        "jieqi": jieqi,
        "festivals": festivals,
        "solar_festivals": solar_festivals,
        "solar_other_festivals": solar_other_festivals,
        "lunar_festivals": lunar_festivals,
        "yi": list(lunar.getDayYi()),
        "ji": list(lunar.getDayJi()),
        "chong": lunar.getChongDesc(),
        "sha": lunar.getSha(),
        "caishen": lunar.getDayPositionCaiDesc(),
        "xishen": lunar.getDayPositionXiDesc(),
        "fushen": lunar.getDayPositionFuDesc(),
        "pengzu": f"{lunar.getPengZuGan()} {lunar.getPengZuZhi()}",
        "xiu": f"{lunar.getXiu()}（{lunar.getXiuLuck()}）",
        "ji_shen": list(lunar.getDayJiShen()),
        "xiong_sha": list(lunar.getDayXiongSha()),
        "tian_shen": lunar.getDayTianShen(),
        "tian_shen_type": lunar.getDayTianShenType(),
        "tian_shen_luck": lunar.getDayTianShenLuck(),
        "tai_shen": lunar.getDayPositionTai(),
        "month_tai_shen": lunar.getMonthPositionTai(),
        "nine_star": str(lunar.getDayNineStar()),
        "day_lu": lunar.getDayLu(),
        "hou": lunar.getHou(),
        "wu_hou": lunar.getWuHou(),
        "yanggui": lunar.getDayPositionYangGuiDesc(),
        "yingui": lunar.getDayPositionYinGuiDesc(),
    }


def build_month(year: int, month: int) -> dict[str, Any]:
    """Build an always-six-week, Monday-first calendar month."""
    if not 1900 <= year <= 2100:
        raise ValueError("year must be between 1900 and 2100")
    if not 1 <= month <= 12:
        raise ValueError("month must be between 1 and 12")

    first = date(year, month, 1)
    start = first - timedelta(days=first.weekday())
    days = []
    for offset in range(42):
        current = start + timedelta(days=offset)
        item = build_day(current)
        item["in_month"] = current.month == month
        item["is_weekend"] = current.weekday() >= 5
        days.append(item)

    solar_terms = [
        {"name": item["jieqi"], "date": item["date"], "weekday": item["weekday"]}
        for item in days
        if item["in_month"] and item["jieqi"]
    ]

    return {"year": year, "month": month, "days": days, "solar_terms": solar_terms}
