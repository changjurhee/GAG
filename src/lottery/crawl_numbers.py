import requests
import json
import os
import re

def crawl_lottery_data():
    print("Starting Smart Lottery Data Crawler...")
    
    base_url = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo="
    file_path = 'winning_numbers.js'
    
    # Existing data containers
    # Note: We store them in descending order (Latest -> Oldest) in the file,
    # but for appending new data, it's easier to work with Ascending (Oldest -> Latest) temporarily,
    # or just prepend new data.
    
    existing_winning_numbers = []
    existing_bonus_numbers = []
    existing_dates = []
    
    start_round = 1
    
    # 1. Read existing data
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Parse JS content using regex or simple string manipulation
            # Pattern: const allWinningNumbers = [...];
            # Pattern: const allBonusNumbers = [...];
            # Pattern: const allWinningDates = [...]; (might not exist yet)
            
            wn_match = re.search(r'const allWinningNumbers = (\[.*?\]);', content, re.DOTALL)
            bn_match = re.search(r'const allBonusNumbers = (\[.*?\]);', content, re.DOTALL)
            wd_match = re.search(r'const allWinningDates = (\[.*?\]);', content, re.DOTALL)
            
            if wn_match and bn_match:
                existing_winning_numbers = json.loads(wn_match.group(1))
                existing_bonus_numbers = json.loads(bn_match.group(1))
                
                if wd_match:
                    existing_dates = json.loads(wd_match.group(1))
                else:
                    # If dates don't exist, we might need to re-crawl everything to get dates,
                    # OR we can just start collecting dates for new rounds and leave old ones empty/null.
                    # User requested dates, so let's try to fill them if missing.
                    # If existing data has no dates, let's assume we need to re-crawl everything 
                    # to ensure consistency.
                    print("Existing data found but missing dates. Will re-crawl all to get dates.")
                    existing_winning_numbers = []
                    existing_bonus_numbers = []
                    existing_dates = []
                
                if existing_winning_numbers:
                    # Data is stored Latest -> Oldest.
                    # So the latest round is at index 0.
                    # Total rounds = length.
                    latest_round_in_file = len(existing_winning_numbers)
                    start_round = latest_round_in_file + 1
                    print(f"Found {latest_round_in_file} existing rounds. Checking for updates starting from round {start_round}...")
            else:
                print("Could not parse existing data. Starting from round 1.")
                
        except Exception as e:
            print(f"Error reading existing file: {e}. Starting from round 1.")
    else:
        print("No existing file found. Starting from round 1.")

    # New data containers
    new_winning_numbers = []
    new_bonus_numbers = []
    new_dates = []
    
    current_round = start_round
    consecutive_failures = 0
    
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
            main_nums = [
                data["drwtNo1"], data["drwtNo2"], data["drwtNo3"],
                data["drwtNo4"], data["drwtNo5"], data["drwtNo6"]
            ]
            bonus_num = data["bnusNo"]
            draw_date = data.get("drwNoDate", "") # Format: "2023-01-01"
            
            new_winning_numbers.append(main_nums)
            new_bonus_numbers.append(bonus_num)
            new_dates.append(draw_date)
            
            print(f"Fetched Round {current_round} ({draw_date})")
                
            current_round += 1
            consecutive_failures = 0
            
        except Exception as e:
            print(f"Error fetching round {current_round}: {e}")
            consecutive_failures += 1
            if consecutive_failures > 5: break
    
    if not new_winning_numbers:
        print("No new data found.")
        return

    # Merge Data
    # Existing: [Latest, ..., Oldest]
    # New: [OldestNew, ..., LatestNew] (because we appended in loop)
    
    # We want Final: [LatestNew, ..., OldestNew, Latest, ..., Oldest]
    
    new_winning_numbers.reverse()
    new_bonus_numbers.reverse()
    new_dates.reverse()
    
    final_winning_numbers = new_winning_numbers + existing_winning_numbers
    final_bonus_numbers = new_bonus_numbers + existing_bonus_numbers
    final_dates = new_dates + existing_dates
    
    print(f"Total rounds: {len(final_winning_numbers)}")
    
    # Save to JS file
    js_content = f"""const allWinningNumbers = {json.dumps(final_winning_numbers)};
const allBonusNumbers = {json.dumps(final_bonus_numbers)};
const allWinningDates = {json.dumps(final_dates)};"""
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Successfully updated winning_numbers.js")

if __name__ == "__main__":
    crawl_lottery_data()
