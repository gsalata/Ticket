"""Daemon-side snapshot persistence helpers."""

from __future__ import annotations

from backend.app import _insert_snapshot


def insert_snapshot(concert_id: str, snapshot: dict) -> None:
    _insert_snapshot(concert_id, snapshot)
