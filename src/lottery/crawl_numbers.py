# Refactored crawl_numbers.py
# - safer file path handling
# - requests.Session with retries/backoff
# - robust JS-array sanitization for json.loads
# - do not discard existing winning numbers when dates missing (preserve, fill None)
# - increment current_round on failures to avoid stuck loops
# - better logging and small helper functions

import os
import re
import json
import time
from typing import List, Tuple, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={}"
WINNING_JS_FILENAME = "winning_numbers.js"
MAX_CONSECUTIVE_FAILURES = 5


def get_local_js_path(filename: str) -> str:
    """Return path to file located next to this script."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, filename)


def make_session(retries: int = 3, backoff_factor: float = 0.3, status_forcelist=(500, 502, 504)):
    session = requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        allowed_methods=frozenset(["GET", "POST"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def sanitize_js_array(js_array_text: str) -> str:
    """
    Make a JS array string JSON-compatible for json.loads:
    - Remove trailing commas before closing ]
    - Remove JS-style comments (simple approach)
    Assumes array contains only numbers/strings/arrays/dicts.
    """
    # remove // comments
    js_array_text = re.sub(r"//.*?$", "", js_array_text, flags=re.MULTILINE)
    # remove /* ... */ comments
    js_array_text = re.sub(r"/\*.*?\*/", "", js_array_text, flags=re.DOTALL)
    # remove trailing commas before ] or }
    js_array_text = re.sub(r",\s*([\]\}])", r"\1", js_array_text)
    return js_array_text


def parse_existing_js(content: str) -> Tuple[List[List[int]], List[int], List[Optional[str]]]:
    wn_match = re.search(r'const\s+allWinningNumbers\s*=\s*(\[[\s\S]*?\]);', content)
    bn_match = re.search(r'const\s+allBonusNumbers\s*=\s*(\[[\s\S]*?\]);', content)
    wd_match = re.search(r'const\s+allWinningDates\s*=\s*(\[[\s\S]*?\]);', content)

    existing_winning_numbers = []
    existing_bonus_numbers = []
    existing_dates = []

    try:
        if wn_match and bn_match:
            wn_text = sanitize_js_array(wn_match.group(1))
            bn_text = sanitize_js_array(bn_match.group(1))
            existing_winning_numbers = json.loads(wn_text)
            existing_bonus_numbers = json.loads(bn_text)

            if wd_match:
                wd_text = sanitize_js_array(wd_match.group(1))
                existing_dates = json.loads(wd_text)
            else:
                # preserve existing numbers but mark dates as unknown(None)
                existing_dates = [None] * len(existing_winning_numbers)
    except Exception as e:
        print(f"[parse_existing_js] Failed to parse existing JS content: {e}")
        existing_winning_numbers, existing_bonus_numbers, existing_dates = [], [], []

    return existing_winning_numbers, existing_bonus_numbers, existing_dates


def fetch_round(session: requests.Session, round_no: int, timeout: float = 5.0) -> Optional[dict]:
    url = BASE_URL.format(round_no)
    try:
        resp = session.get(url, timeout=timeout)
        if resp.status_code != 200:
            print(f"[fetch_round] HTTP {resp.status_code} for round {round_no}")
            return None
        data = resp.json()
        return data
    except Exception as e:
        print(f"[fetch_round] Exception fetching round {round_no}: {e}")
        return None


def crawl_lottery_data():
    print("Starting Smart Lottery Data Crawler...")

    file_path = get_local_js_path(WINNING_JS_FILENAME)

    existing_winning_numbers, existing_bonus_numbers, existing_dates = [], [], []
    start_round = 1

    # Read existing file if present
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            existing_winning_numbers, existing_bonus_numbers, existing_dates = parse_existing_js(content)

            if existing_winning_numbers:
                # If stored as Latest -> Oldest, and rounds were stored contiguously starting from 1,
                # we can assume latest round number == len(existing_winning_numbers).
                start_round = len(existing_winning_numbers) + 1
                print(f"Found {len(existing_winning_numbers)} existing rounds. Starting from round {start_round}.")
            else:
                print("No parseable existing winning number arrays found. Starting from round 1.")
        except Exception as e:
            print(f"Error reading existing file: {e}. Starting from round 1.")
    else:
        print("No existing file found. Starting from round 1.")

    session = make_session(retries=3, backoff_factor=0.5)
    new_winning_numbers = []
    new_bonus_numbers = []
    new_dates = []

    current_round = start_round
    consecutive_failures = 0

    while True:
        if consecutive_failures > MAX_CONSECUTIVE_FAILURES:
            print("[crawl] Too many consecutive failures. Stopping.")
            break

        data = fetch_round(session, current_round)
        if data is None:
            consecutive_failures += 1
            current_round += 1  # advance to avoid getting stuck on same failing round
            time.sleep(0.5)
            continue

        if data.get("returnValue") != "success":
            # If the API says not-success, we treat as end of available data
            print(f"[crawl] Reached end of data at round {current_round - 1}")
            break

        # Ensure expected fields exist
        try:
            main_nums = [
                data.get("drwtNo1"),
                data.get("drwtNo2"),
                data.get("drwtNo3"),
                data.get("drwtNo4"),
                data.get("drwtNo5"),
                data.get("drwtNo6"),
            ]
            if any(n is None for n in main_nums):
                print(f"[crawl] Incomplete main numbers for round {current_round}, skipping.")
                current_round += 1
                continue

            bonus_num = data.get("bnusNo")
            draw_date = data.get("drwNoDate", "")

            new_winning_numbers.append(main_nums)
            new_bonus_numbers.append(bonus_num)
            new_dates.append(draw_date)

            print(f"Fetched Round {current_round} ({draw_date})")

            current_round += 1
            consecutive_failures = 0
        except Exception as e:
            print(f"[crawl] Error processing round {current_round}: {e}")
            consecutive_failures += 1
            current_round += 1

    if not new_winning_numbers:
        print("No new data found.")
        return

    # new_winning_numbers currently OldestNew -> LatestNew (because we started at start_round and increased)
    new_winning_numbers.reverse()
    new_bonus_numbers.reverse()
    new_dates.reverse()

    final_winning_numbers = new_winning_numbers + existing_winning_numbers
    final_bonus_numbers = new_bonus_numbers + existing_bonus_numbers
    final_dates = new_dates + existing_dates

    print(f"Total rounds after merge: {len(final_winning_numbers)}")

    # Write to file
    js_content = (
        f"const allWinningNumbers = {json.dumps(final_winning_numbers)};\n"
        f"const allBonusNumbers = {json.dumps(final_bonus_numbers)};\n"
        f"const allWinningDates = {json.dumps(final_dates)};\n"
    )
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Successfully updated {file_path}")
    except Exception as e:
        print(f"Failed to write updated JS file: {e}")


if __name__ == "__main__":
    crawl_lottery_data()
