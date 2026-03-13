import json
from typing import Any, Dict, Iterable, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class HttpError(RuntimeError):
    pass


def get_json(url: str, params: Optional[Dict[str, Any]] = None, timeout: int = 20) -> Any:
    query = ""
    if params:
        clean = {key: value for key, value in params.items() if value is not None}
        query = urlencode(clean, doseq=True)
    full_url = "{}?{}".format(url, query) if query else url
    request = Request(full_url, headers=_headers())
    return _read_json(request, timeout=timeout)


def post_json(url: str, payload: Iterable[Dict[str, Any]], timeout: int = 20) -> Any:
    body = json.dumps(list(payload)).encode("utf-8")
    request = Request(
        url,
        data=body,
        headers=_headers({"Content-Type": "application/json"}),
        method="POST",
    )
    return _read_json(request, timeout=timeout)


def _read_json(request: Request, timeout: int) -> Any:
    try:
        with urlopen(request, timeout=timeout) as response:
            data = response.read().decode("utf-8")
            return json.loads(data)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise HttpError("HTTP {} for {}: {}".format(exc.code, request.full_url, body)) from exc
    except URLError as exc:
        raise HttpError("Network error for {}: {}".format(request.full_url, exc.reason)) from exc


def _headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    headers = {
        "User-Agent": "polymarket-research-bot/0.1",
        "Accept": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers
