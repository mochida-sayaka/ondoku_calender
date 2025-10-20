#!/usr/bin/env python3
"""
修正済みアファメーションをFirestoreにアップロード
"""

import json
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase Admin SDKを初期化
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

def upload_fixed_affirmations(json_file):
    """修正済みJSONをFirestoreにアップロード"""
    
    # JSONファイルを読み込む
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f'📚 {len(data)}件のデータを読み込みました')
    print('🚀 Firestoreにアップロード開始...\n')
    
    # 更新カウンター
    updated_count = 0
    
    # 各項目をFirestoreに保存
    for item in data:
        doc_id = item.get('id')
        
        if not doc_id:
            print(f'⚠️ IDがありません: {item}')
            continue
        
        try:
            # Firestoreのドキュメントを更新
            doc_ref = db.collection('affirmations').document(doc_id)
            doc_ref.set(item)
            
            updated_count += 1
            
            if updated_count % 100 == 0:
                print(f'  {updated_count}件アップロード完了...')
        
        except Exception as e:
            print(f'❌ エラー: {doc_id} - {e}')
    
    print(f'\n✅ 完了！{updated_count}件をFirestoreにアップロードしました')

if __name__ == "__main__":
    input_file = "affirmations_exported_fixed.json"
    
    # 確認
    print('⚠️  この操作はFirestoreの全データを上書きします')
    print(f'📄 アップロードファイル: {input_file}')
    
    confirm = input('\n続行しますか？ (yes/no): ')
    
    if confirm.lower() == 'yes':
        upload_fixed_affirmations(input_file)
    else:
        print('❌ キャンセルしました')