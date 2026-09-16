"""Authenticated HTTP API used by the local Lovelace card."""

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .calendar_data import build_month


class ChineseCalendarMonthView(HomeAssistantView):
    """Return one six-week calendar page."""

    url = "/api/chinese_calendar/month"
    name = "api:chinese_calendar:month"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Handle an authenticated month request."""
        try:
            year = int(request.query["year"])
            month = int(request.query["month"])
            result = build_month(year, month)
        except (KeyError, TypeError, ValueError) as err:
            return self.json({"error": str(err)}, status_code=400)

        return self.json(result)

