"""MediaParseScheduler per-candidate flow tests (#260).

We exercise the `_process_one` path because it encodes:
  - R2 fetch failure → mark_failed
  - Vision call failure → mark_failed
  - items=[] → mark_skipped
  - happy path → seed_writer + mark_parsed
  - reparse_by_id wires through claim_for_reparse
"""

from __future__ import annotations

import uuid
from typing import List, Optional, Tuple

import pytest

from src.services.media.models import (
    ParseCandidate,
    ParsedDecodeResult,
    ParsedItem,
)
from src.services.media.scheduler import MediaParseScheduler


class _RecordingRepo:
    def __init__(
        self,
        *,
        claim_return: Optional[List[ParseCandidate]] = None,
        reparse_return: Optional[ParseCandidate] = None,
    ):
        self._claim = claim_return or []
        self._reparse = reparse_return
        self.events: List[Tuple[str, ...]] = []

    async def claim_pending(self, *, limit, max_attempts):
        self.events.append(("claim_pending", str(limit), str(max_attempts)))
        return list(self._claim)

    async def claim_for_reparse(self, raw_post_id):
        self.events.append(("claim_for_reparse", str(raw_post_id)))
        return self._reparse

    async def mark_parsed(self, raw_post_id, *, seed_post_id, parse_result):
        self.events.append(
            ("mark_parsed", str(raw_post_id), str(seed_post_id),
             str(len(parse_result.get("items", []))))
        )

    async def mark_skipped(self, raw_post_id):
        self.events.append(("mark_skipped", str(raw_post_id)))

    async def mark_failed(self, raw_post_id, *, error, max_attempts):
        self.events.append(
            ("mark_failed", str(raw_post_id), error[:40], str(max_attempts))
        )


class _Parser:
    def __init__(self, *, result: Optional[ParsedDecodeResult] = None, raise_exc=None):
        self._result = result or ParsedDecodeResult(items=[])
        self._raise_exc = raise_exc

    async def parse(self, *, image_bytes, mime_type, caption):
        if self._raise_exc is not None:
            raise self._raise_exc
        return self._result


class _Writer:
    def __init__(self, *, seed_post_id: Optional[uuid.UUID] = None, raise_exc=None):
        self._sid = seed_post_id or uuid.uuid4()
        self._raise_exc = raise_exc
        self.calls = 0

    async def write_for_parse_result(self, candidate, parsed, *, image_sha256):
        self.calls += 1
        if self._raise_exc is not None:
            raise self._raise_exc
        return self._sid


class _R2:
    def __init__(self, *, bytes_: bytes = b"image-bytes", raise_exc=None):
        self._bytes = bytes_
        self._raise_exc = raise_exc

    def get(self, key):
        if self._raise_exc is not None:
            raise self._raise_exc
        return self._bytes


def _candidate() -> ParseCandidate:
    return ParseCandidate(
        id=uuid.uuid4(),
        platform="pinterest",
        external_id="pin1",
        external_url="https://pinterest.com/pin/1/",
        r2_key="pinterest/pi/pin1.jpg",
        r2_url="https://r2/x.jpg",
        caption=None,
        image_hash=None,
        parse_attempts=1,
    )


def _result_with_items(n=1) -> ParsedDecodeResult:
    return ParsedDecodeResult(
        items=[
            ParsedItem(
                brand="B", subcategory="top",
                position_x_pct=50, position_y_pct=50,
            )
            for _ in range(n)
        ]
    )


def _make(repo, parser, writer, r2) -> MediaParseScheduler:
    return MediaParseScheduler(
        repository=repo,
        parser=parser,
        writer=writer,
        r2_client=r2,
        interval_seconds=60,
        batch_size=5,
        max_attempts=3,
    )


@pytest.mark.asyncio
async def test_run_once_returns_zero_when_no_candidates():
    repo = _RecordingRepo(claim_return=[])
    sch = _make(repo, _Parser(), _Writer(), _R2())
    assert await sch.run_once() == 0
    assert repo.events == [("claim_pending", "5", "3")]


@pytest.mark.asyncio
async def test_happy_path_marks_parsed():
    cand = _candidate()
    repo = _RecordingRepo(claim_return=[cand])
    sid = uuid.uuid4()
    writer = _Writer(seed_post_id=sid)
    sch = _make(repo, _Parser(result=_result_with_items(2)), writer, _R2())

    count = await sch.run_once()

    assert count == 1
    assert writer.calls == 1
    assert any(
        e[0] == "mark_parsed"
        and e[1] == str(cand.id)
        and e[2] == str(sid)
        and e[3] == "2"
        for e in repo.events
    )


@pytest.mark.asyncio
async def test_empty_items_marks_skipped_without_writing_seed():
    cand = _candidate()
    repo = _RecordingRepo(claim_return=[cand])
    writer = _Writer()
    sch = _make(repo, _Parser(result=ParsedDecodeResult(items=[])), writer, _R2())

    await sch.run_once()

    assert writer.calls == 0
    assert any(e[0] == "mark_skipped" and e[1] == str(cand.id) for e in repo.events)


@pytest.mark.asyncio
async def test_vision_exception_marks_failed():
    cand = _candidate()
    repo = _RecordingRepo(claim_return=[cand])
    writer = _Writer()
    sch = _make(
        repo,
        _Parser(raise_exc=RuntimeError("boom")),
        writer,
        _R2(),
    )

    await sch.run_once()

    assert writer.calls == 0
    failed = [e for e in repo.events if e[0] == "mark_failed"]
    assert failed
    assert failed[0][1] == str(cand.id)
    assert "vision" in failed[0][2]


@pytest.mark.asyncio
async def test_r2_fetch_exception_marks_failed():
    cand = _candidate()
    repo = _RecordingRepo(claim_return=[cand])
    writer = _Writer()
    sch = _make(
        repo,
        _Parser(),
        writer,
        _R2(raise_exc=RuntimeError("r2 down")),
    )

    await sch.run_once()

    assert writer.calls == 0
    failed = [e for e in repo.events if e[0] == "mark_failed"]
    assert failed
    assert "r2_fetch" in failed[0][2]


@pytest.mark.asyncio
async def test_seed_write_exception_marks_failed():
    cand = _candidate()
    repo = _RecordingRepo(claim_return=[cand])
    writer = _Writer(raise_exc=RuntimeError("fk violation"))
    sch = _make(repo, _Parser(result=_result_with_items(1)), writer, _R2())

    await sch.run_once()

    failed = [e for e in repo.events if e[0] == "mark_failed"]
    assert failed
    assert "seed_write" in failed[0][2]


@pytest.mark.asyncio
async def test_reparse_by_id_runs_one_row():
    cand = _candidate()
    repo = _RecordingRepo(reparse_return=cand)
    sid = uuid.uuid4()
    sch = _make(
        repo, _Parser(result=_result_with_items(1)), _Writer(seed_post_id=sid), _R2()
    )

    status = await sch.reparse_by_id(cand.id)

    assert status == "parsed"
    assert ("claim_for_reparse", str(cand.id)) in repo.events


@pytest.mark.asyncio
async def test_reparse_by_id_raises_when_row_missing():
    repo = _RecordingRepo(reparse_return=None)
    sch = _make(repo, _Parser(), _Writer(), _R2())
    with pytest.raises(KeyError):
        await sch.reparse_by_id(uuid.uuid4())
