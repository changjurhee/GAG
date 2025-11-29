import requests
import json
import os

def crawl_lottery_data():
    print("Starting Lottery Data Crawler...")
    
    # API URL for Donghang Lottery (Official)
    # They provide a simple API: https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round}
    base_url = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo="
    
    all_winning_numbers = []
    all_bonus_numbers = []
    
    # 1. Find the latest round
    # We can do this by trying a very high number or binary search, 
    # but for simplicity, let's start from 1 and go until we fail.
    # Or better, let's assume a safe upper bound and check.
    # Actually, let's just loop from 1. It's only ~1100 requests. 
    # To be faster, we can check the latest round first.
    
    current_round = 1
    consecutive_failures = 0
    
    print("Fetching data (this may take a moment)...")
    
    while True:
        try:
            url = f"{base_url}{current_round}"
            response = requests.get(url, timeout=5)
            
            if response.status_code != 200:
                print(f"Failed to fetch round {current_round}")
                consecutive_failures += 1
                if consecutive_failures > 5: break
                continue
                
            data = response.json()
            
            if data.get("returnValue") != "success":
                # End of data
                print(f"Reached end of data at round {current_round - 1}")
                break
            
            # Extract numbers
            # The API returns drwtNo1, drwtNo2, ... drwtNo6, bnusNo
            # Note: The API returns them sorted.
            main_nums = [
                data["drwtNo1"], data["drwtNo2"], data["drwtNo3"],
                data["drwtNo4"], data["drwtNo5"], data["drwtNo6"]
            ]
            bonus_num = data["bnusNo"]
            
            all_winning_numbers.append(main_nums)
            all_bonus_numbers.append(bonus_num)
            
            if current_round % 100 == 0:
                print(f"Processed up to round {current_round}...")
                
            current_round += 1
            consecutive_failures = 0
            
        except Exception as e:
            print(f"Error fetching round {current_round}: {e}")
            consecutive_failures += 1
            if consecutive_failures > 5: break
    
    # Reverse to have latest first? 
    # The previous extract_numbers.py sorted by round descending (latest first).
    # Let's match that format: Latest -> Oldest
    all_winning_numbers.reverse()
    all_bonus_numbers.reverse()
    
    print(f"Total rounds fetched: {len(all_winning_numbers)}")
    
    # Save to JS file
    js_content = f"const allWinningNumbers = {json.dumps(all_winning_numbers)};\nconst allBonusNumbers = {json.dumps(all_bonus_numbers)};"
    
    with open('winning_numbers.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Successfully updated winning_numbers.js")

if __name__ == "__main__":
    crawl_lottery_data()
