#!/usr/bin/env python3
"""
Firebaseから全アファメーションデータを取得してJSONに出力
"""

import json
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase Admin SDKを初期化
# ⚠️ ここのパスを実際のサービスアカウントキーのパスに変更してください
cred = credentials.Certificate('serviceAccountKey.json')  # ← 要修正
firebase_admin.initialize_app(cred)

db = firestore.client()

def fetch_all_affirmations():
    """全アファメーションを取得"""
    print('📚 Firestoreからデータを取得中...')
    
    affirmations_ref = db.collection('affirmations')
    docs = affirmations_ref.stream()
    
    affirmations = []
    count = 0
    
    for doc in docs:
        data = doc.to_dict()
        affirmations.append({
            'id': doc.id,
            **data
        })
        count += 1
        if count % 100 == 0:
            print(f'  {count}件取得...')
    
    print(f'✅ {len(affirmations)}件のデータを取得しました')
    return affirmations

def save_to_json(affirmations, filename='affirmations_exported.json'):
    """JSONファイルに保存"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(affirmations, f, ensure_ascii=False, indent=2)
    
    print(f'💾 {filename} に保存しました')

def main():
    affirmations = fetch_all_affirmations()
    save_to_json(affirmations)
    
    # レベルごとの件数を表示
    levels = {}
    for aff in affirmations:
        level = aff.get('level', 'unknown')
        levels[level] = levels.get(level, 0) + 1
    
    print('\n📊 レベル別件数:')
    for level, count in sorted(levels.items()):
        print(f'  {level}: {count}件')
    
    # サンプルを表示
    print('\n🔍 サンプルデータ（最初の1件）:')
    if affirmations:
        sample = affirmations[0]
        print(f'  ID: {sample.get("id")}')
        print(f'  英文: {sample.get("text")}')
        print(f'  日本語: {sample.get("japanese")}')
        print(f'  レベル: {sample.get("level")}')

if __name__ == '__main__':
    main()