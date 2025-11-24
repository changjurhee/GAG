import re
import json

def parse_excel_html():
    files = ['excel (1-600).xls', 'excel (601-1198).xls']
    all_data = [] # Will store (round_num, main_numbers, bonus)

    for filename in files:
        print(f"Processing {filename}...")
        try:
            with open(filename, 'r', encoding='cp949') as f:
                content = f.read()
        except UnicodeDecodeError:
            try:
                with open(filename, 'r', encoding='euc-kr') as f:
                    content = f.read()
            except Exception as e:
                print(f"Error reading {filename}: {e}")
                continue
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue

        # Find all rows
        rows = re.findall(r'<tr.*?>(.*?)</tr>', content, re.DOTALL)
        
        for row in rows:
            # Extract cells
            cells = re.findall(r'<td.*?>(.*?)</td>', row, re.DOTALL)
            
            # Clean up cell content
            cells = [re.sub(r'<.*?>', '', c).strip().replace(',', '') for c in cells]
            
            if len(cells) < 5:
                continue
                
            try:
                # Determine where the data starts.
                date_index = -1
                for i, cell in enumerate(cells[:5]): 
                    if re.match(r'\d{4}\.\d{2}\.\d{2}', cell):
                        date_index = i
                        break
                
                if date_index == -1:
                    continue
                    
                # Round number is immediately before Date
                round_num = int(cells[date_index - 1])
                
                # Numbers are the last 7 columns (6 main + 1 bonus)
                potential_numbers = cells[-7:]
                nums = [int(x) for x in potential_numbers]
                
                if all(1 <= x <= 45 for x in nums):
                    main_numbers = nums[:6]
                    bonus = nums[6]
                    all_data.append({'round': round_num, 'main': main_numbers, 'bonus': bonus})
                
            except (ValueError, IndexError):
                continue

    # Sort by round number descending (latest first)
    all_data.sort(key=lambda x: x['round'], reverse=True)
    
    print(f"Total extracted draws: {len(all_data)}")
    if all_data:
        print(f"Latest Round: {all_data[0]['round']}")
        print(f"Oldest Round: {all_data[-1]['round']}")

    winning_data = [x['main'] for x in all_data]
    bonus_data = [x['bonus'] for x in all_data]
    
    # Write to JS file
    js_content = f"const allWinningNumbers = {json.dumps(winning_data)};\nconst allBonusNumbers = {json.dumps(bonus_data)};"
    
    with open('winning_numbers.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("Successfully created winning_numbers.js")

if __name__ == "__main__":
    parse_excel_html()
