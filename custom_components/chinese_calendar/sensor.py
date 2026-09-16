"""Sensor platform for Chinese Calendar."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from .calendar_data import build_day


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the daily lunar calendar sensor."""
    async_add_entities([ChineseCalendarTodaySensor(entry)])


class ChineseCalendarTodaySensor(SensorEntity):
    """Represent today's Chinese almanac information."""

    _attr_has_entity_name = True
    _attr_icon = "mdi:calendar-month"
    _attr_name = "今日农历"
    _attr_should_poll = False

    def __init__(self, entry: ConfigEntry) -> None:
        self._attr_unique_id = f"{entry.entry_id}_today"
        self._data: dict[str, Any] = {}

    async def async_added_to_hass(self) -> None:
        """Start the local midnight refresh."""
        self._refresh()
        self.async_on_remove(
            async_track_time_change(
                self.hass,
                self._handle_midnight,
                hour=0,
                minute=0,
                second=5,
            )
        )

    @callback
    def _handle_midnight(self, now: datetime) -> None:
        self._refresh()
        self.async_write_ha_state()

    @callback
    def _refresh(self) -> None:
        self._data = build_day(dt_util.now().date())

    @property
    def native_value(self) -> str | None:
        """Return the lunar date as the sensor state."""
        return self._data.get("lunar")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return detailed almanac values."""
        return {key: value for key, value in self._data.items() if key != "lunar"}
