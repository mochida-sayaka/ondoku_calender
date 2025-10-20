import json

# 日本語訳に対応する英文の修正
english_updates = {
    "255-a": "I wish I could go anywhere I want. But I start with what I can do now.",
    "255-b": "I wish I could explore all the places I want to go. But I'm moving forward step by step.",
    "255-c": "I wish I could freely visit any place. But I'm starting my journey from here and now.",
    
    "256-a": "I wish I truly knew how strong I am. But I'm discovering my strength every day.",
    "256-b": "I wish I understood my true power. But I'm starting to realize it now.",
    "256-c": "I wish I had noticed my true power. But I'm experiencing it day by day.",
    
    "257-a": "I wish I had started believing sooner. But from now on, I believe in myself.",
    "257-b": "I wish I had believed in myself sooner. But I start from this moment.",
    "257-c": "I wish I had faith from earlier. But from today, I live believing.",
    
    "258-a": "I wish I could see the future clearly. But I trust this present moment.",
    "258-b": "I wish I could see what lies ahead. But I'm moving forward step by step.",
    "258-c": "I wish I could see the path ahead. But I'm creating the path as I walk.",
    
    "259-a": "I wish I had more confidence now. But I'm nurturing confidence every day.",
    "259-b": "I wish I had more confidence now. But I'm confident from today.",
    "259-c": "I wish I believed in myself more now. But I'll keep believing from now on.",
    
    "260-a": "I wish I had noticed my worth sooner. But now, I know my worth.",
    "260-b": "I wish I had recognized my value sooner. But from today, I recognize myself.",
    "260-c": "I wish I had known my importance earlier. But from this moment, I cherish myself.",
    
    "264-a": "Sometimes I feel limited. But I have infinite power. And I can change the world.",
    "264-b": "Sometimes I think I'm small. But I have no limits. And I can change everything.",
    "264-c": "Sometimes I think there are things I can't do. But I have no limits. And I can change reality.",
    
    "265-a": "Honestly, failure is scary. But I have no fear. So I take on challenges.",
    "265-b": "Sometimes I get intimidated. But I am brave. So I try it.",
    "265-c": "Sometimes I feel anxious. But I have courage. So I take on challenges.",
    
    "266-a": "Sometimes I feel bound. But I am free. And I follow my heart.",
    "266-b": "Sometimes I feel not free. But I am free. And I chase my dreams.",
    "266-c": "Sometimes I feel bound by something. But I am free. And I chase my passion.",
}

def update_english_text(input_file, output_file):
    """JSONファイルの英文を更新"""
    
    # JSONファイルを読み込む
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 更新カウンター
    updated_count = 0
    
    # 各項目をチェックして更新
    for item in data:
        item_id = item.get('id')
        if item_id in english_updates:
            # text フィールドを更新
            old_text = item.get('text', '')
            item['text'] = english_updates[item_id]
            updated_count += 1
            print(f"✓ 更新: {item_id}")
            print(f"  旧: {old_text}")
            print(f"  新: {english_updates[item_id]}\n")
    
    # 更新されたJSONを保存
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 完了！{updated_count}件を更新しました")
    print(f"✓ 出力ファイル: {output_file}")

if __name__ == "__main__":
    input_file = "affirmations_exported.json"
    output_file = "affirmations_exported_fixed.json"
    
    # バックアップを作成
    import shutil
    backup_file = "affirmations_exported_backup.json"
    try:
        shutil.copy(input_file, backup_file)
        print(f"✓ バックアップ作成: {backup_file}\n")
    except FileNotFoundError:
        print("⚠ 入力ファイルが見つかりません\n")
    
    update_english_text(input_file, output_file)