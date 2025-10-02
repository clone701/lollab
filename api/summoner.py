# /api/summoner.py
import os, json, urllib.parse, urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

RIOT_KEY = os.environ.get("RIOT_API_KEY")
PLATFORM = os.environ.get("RIOT_PLATFORM", "jp1")  # summoner/league v4
REGION = os.environ.get("RIOT_REGION", "asia")     # match v5

TIMEOUT = 15

DEFAULT_HEADERS = {
    "Accept": "application/json",
    "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
    # ここはあなたの連絡先に変えてOK（Riot側のbot検出を避ける狙い）
    "User-Agent": "LoLLab/0.1 (+contact: clone701@gmail.com)",
}


class HTTPError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def fetch_json(url: str):
    headers = {**DEFAULT_HEADERS}
    if RIOT_KEY:
        headers["X-Riot-Token"] = RIOT_KEY
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            # Cloudflareブロック時は text/html が返ることがある
            ctype = res.headers.get("Content-Type", "")
            text = res.read()
            if "application/json" not in ctype and text.startswith(b"<!DOCTYPE html"):
                raise HTTPError(403, "Cloudflare WAF (error 1010 suspected): blocked by UA/signature")
            return json.loads(text.decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8")
        except Exception:
            detail = str(e)
        raise HTTPError(e.code, detail)


class handler(BaseHTTPRequestHandler):
    def _write(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not RIOT_KEY:
            return self._write({"error": "RIOT_API_KEY is not set on server"}, 500)

        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        name = qs.get("name", [""])[0].strip()
        tag = qs.get("tag", [""])[0].strip()  # 追加

        if not name:
            return self._write({"error": "Query param 'name' is required"}, 400)

        # 取得件数（1〜10）
        try:
            count = int(qs.get("count", ["5"])[0])
        except ValueError:
            count = 5
        count = max(1, min(10, count))

        # 詳細を取得するか（true/1/yes で有効）
        details = qs.get("details", ["0"])[0].lower() in ("1", "true", "yes")

        try:
            if tag:
                # タグライン指定時は by-riot-id を使う
                summ = fetch_json(
                    f"https://{REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/"
                    + urllib.parse.quote(name) + "/" + urllib.parse.quote(tag)
                )
                # puuid からサモナー情報取得
                summ_detail = fetch_json(
                    f"https://{PLATFORM}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{summ['puuid']}"
                )
            else:
                # 従来通り
                summ_detail = fetch_json(
                    f"https://{PLATFORM}.api.riotgames.com/lol/summoner/v4/summoners/by-name/"
                    + urllib.parse.quote(name)
                )

            if "id" not in summ_detail:
                return self._write({"error": "サモナー情報が取得できませんでした", "detail": summ_detail}, 404)

            # 2) ランク情報
            leagues = fetch_json(
                f"https://{PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summ_detail['id']}"
            )

            # 3) 直近試合 ID
            ids = fetch_json(
                f"https://{REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/{summ_detail['puuid']}/ids?start=0&count={count}"
            )

            result = {
                "profile": {
                    "name": summ_detail.get("name"),
                    "level": summ_detail.get("summonerLevel"),
                    "puuid": summ_detail.get("puuid"),
                    "profileIconId": summ_detail.get("profileIconId"),
                },
                "leagues": leagues,
                "recent_ids": ids,
            }

            if details:
                recent = []
                for mid in ids:
                    m = fetch_json(f"https://{REGION}.api.riotgames.com/lol/match/v5/matches/{mid}")
                    info = m.get("info", {})
                    parts = info.get("participants", [])
                    me = next((p for p in parts if p.get("puuid") == summ_detail.get("puuid")), None)
                    if not me:
                        continue
                    cs = (me.get("neutralMinionsKilled", 0) or 0) + (me.get("totalMinionsKilled", 0) or 0)
                    recent.append({
                        "matchId": m.get("metadata", {}).get("matchId"),
                        "win": me.get("win"),
                        "championName": me.get("championName"),
                        "k": me.get("kills"),
                        "d": me.get("deaths"),
                        "a": me.get("assists"),
                        "cs": cs,
                        "damage": me.get("totalDamageDealtToChampions"),
                        "queueId": info.get("queueId"),
                        "gameDuration": info.get("gameDuration"),
                        "gameEnd": info.get("gameEndTimestamp"),
                    })
                result["recent"] = recent

            return self._write(result, 200)

        except HTTPError as e:
            # Riot API のエラーをそのまま伝搬（429/404 など）
            return self._write({"error": f"Riot API {e.status}", "detail": e.message}, e.status)
        except Exception as e:
            return self._write({"error": "Internal error", "detail": str(e)}, 500)