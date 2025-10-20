// Firebase操作サービス

// Firestoreインポート（動的に取得）
let collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc, getDoc;
let ref, uploadBytes, getDownloadURL;

// Firebase SDKをロード
async function loadFirebaseSDK() {
  const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  collection = firestoreModule.collection;
  query = firestoreModule.query;
  where = firestoreModule.where;
  getDocs = firestoreModule.getDocs;
  addDoc = firestoreModule.addDoc;
  serverTimestamp = firestoreModule.serverTimestamp;
  doc = firestoreModule.doc;
  setDoc = firestoreModule.setDoc;
  getDoc = firestoreModule.getDoc;
  
  const storageModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
  ref = storageModule.ref;
  uploadBytes = storageModule.uploadBytes;
  getDownloadURL = storageModule.getDownloadURL;
}

// アファメーションデータを取得
async function fetchAffirmations(settings) {
  await loadFirebaseSDK();
  
  const { mood, level, sentencesPerDay } = settings;
  
  // ムードでフィルタ
  let q;
  if (mood && mood !== 'balanced') {
    q = query(
      collection(window.db, 'affirmations'),
      where('level', '==', level),
      where('moods', 'array-contains', mood)
    );
  } else {
    // balanced または mood未指定の場合はlevelのみで検索
    q = query(
      collection(window.db, 'affirmations'),
      where('level', '==', level)
    );
  }
  
  const snapshot = await getDocs(q);
  const affirmations = [];
  
  snapshot.forEach(doc => {
    affirmations.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  console.log(`📚 取得したアファメーション: ${affirmations.length}件`);
  return affirmations;
}

// 週間カードを抽選（フォールバック付き）
async function drawWeeklyCards(settings) {
  console.log('🎴 カード抽選開始', settings);
  
  const { mood, level, sentencesPerDay } = settings;
  const needed = sentencesPerDay * 7;
  const usedIds = window.utils.getUsedIdsByLevel(level);
  
  // 優先度1: 同じレベル + 同じムード の未使用文
  let available = await fetchAffirmations({ level, mood });
  available = available.filter(a => !usedIds.includes(a.id));
  
  console.log(`📚 同レベル・同ムード未使用: ${available.length}件`);
  
  if (available.length >= needed) {
    // 十分ある！
    return await createWeeklyData(window.utils.pickRandomItems(available, needed), settings);
  }
  
  // 優先度2: 同じレベル + 全ムード の未使用文
  available = await fetchAffirmations({ level });
  available = available.filter(a => !usedIds.includes(a.id));
  
  console.log(`📚 同レベル全ムード未使用: ${available.length}件`);
  
  if (available.length >= needed) {
    console.log('💡 同じムードが足りないので、他のムードも混ぜました');
    return createWeeklyData(window.utils.pickRandomItems(available, needed), settings);
  }
  
  // レベルコンプリート or もうすぐコンプリート
  const completion = window.utils.checkLevelCompletion(level);
  
  if (completion.completed) {
    console.log('🎉 このレベルはコンプリート済み！再抽選します');
    // コンプ済みでも同じレベルから再抽選
    available = await fetchAffirmations({ level });
    return await createWeeklyData(window.utils.pickRandomItems(available, needed), settings, true);
  }
  
  // 足りない分は使える文を全部使う
  console.log(`⚠️ 未使用文が足りません。残り${available.length}件を全部使います`);
  return await createWeeklyData(available, settings);
}

// 週間データを作成
async function createWeeklyData(affirmations, settings, isRepeating = false) {
  const weeklyCards = [];
  const today = new Date();
  const startDate = new Date(today); // 今日から開始
  
  const sentencesPerDay = settings.sentencesPerDay;
  let affirmationIndex = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = window.getLocalDateString(date); 
    
    // この日のアファメーション
    const dayAffirmations = [];
    for (let j = 0; j < sentencesPerDay && affirmationIndex < affirmations.length; j++) {
      // 🔧 修正: recorded フィールドを初期化
      dayAffirmations.push({
        ...affirmations[affirmationIndex],
        recorded: false, // 初期値は false
        recordingUrl: null // 初期値は null
      });
      affirmationIndex++;
    }
    
    weeklyCards.push({
      date: dateStr,
      dayOfWeek: date.getDay(),
      affirmations: dayAffirmations,
      completed: false
    });
  }
  
  const user = window.getCurrentUser();
  const weeklyData = {
    studentName: user.displayName,
    weekStartDate: weeklyCards[0].date,
    weekEndDate: weeklyCards[6].date,
    settings: settings,
    weeklyCards: weeklyCards,
    isRepeating: isRepeating
  };
  
  // Firestoreに保存（ユーザーIDベース）
  if (user) {
    await window.saveUserData(user.uid, weeklyData);
  }
  
  window.appState.weeklyData = weeklyData;
  
  console.log('✅ カード抽選完了', weeklyData);
  return weeklyData;
}

// 録音をFirebase Storageにアップロード
async function uploadRecordingsToFirebase() {
  await loadFirebaseSDK();
  
  const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
  const recordings = window.appState.recordings;
  const studentName = window.appState.studentName;
  
  console.log('📤 アップロード開始', {
    date: day.date,
    studentName: studentName,
    count: recordings.length
  });
  
  const uploadedFiles = [];
  
  // 各録音をアップロード
  for (let i = 0; i < recordings.length; i++) {
    if (!recordings[i]) continue;
    
    const affirmation = day.affirmations[i];
    const timestamp = Date.now();
    const filename = `${studentName}_${day.date}_${i}_${timestamp}.webm`;
    const storagePath = `recordings/${studentName}/${day.date}/${filename}`;
    
    // Firebase Storageにアップロード
    const storageRef = ref(window.storage, storagePath);
    await uploadBytes(storageRef, recordings[i]);
    
    // ダウンロードURLを取得
    const audioUrl = await getDownloadURL(storageRef);
    
    // 🔧 修正: 個別の recorded フラグを保存
    day.affirmations[i].recorded = true;
    day.affirmations[i].recordingUrl = audioUrl;
    
    uploadedFiles.push({
      affirmation: affirmation.text,
      japanese: affirmation.japanese,
      audioUrl: audioUrl,
      filename: filename
    });
    
    console.log(`✅ アップロード完了: ${filename}`);
  }
  
  // 🔧 修正: 完了状態を判定
  const totalCount = day.affirmations.length;
  const completedCount = day.affirmations.filter(a => a.recorded).length;
  
  if (completedCount === totalCount) {
    day.completed = true; // 全部完了
  } else {
    day.completed = false; // 一部完了 or 未完了
  }
  
  // 使用済みIDとしてマーク
  day.affirmations.forEach(aff => {
    window.utils.markAsUsed(aff.id, window.appState.weeklyData.settings.level);
  });
  
  // レベルコンプリート確認
  const completion = window.utils.checkLevelCompletion(window.appState.weeklyData.settings.level);
  if (completion.justCompleted) {
    // コンプリートした瞬間！
    localStorage.setItem('justCompletedLevel', window.appState.weeklyData.settings.level);
  }
  
  // ユーザーの週データを更新（Firestoreに保存）
  const user = window.getCurrentUser();
  if (user) {
    await window.saveUserData(user.uid, window.appState.weeklyData);
  }
  
  // Firestoreにレコーディングメタデータも保存
  await addDoc(collection(window.db, 'users', user.uid, 'recordings'), {
    date: day.date,
    files: uploadedFiles,
    settings: window.appState.weeklyData.settings,
    createdAt: serverTimestamp()
  });
  
  console.log('🎉 Firestoreに保存完了');
}

// 統計データを取得
async function fetchUserStats(studentName) {
  await loadFirebaseSDK();
  
  const q = query(
    collection(window.db, 'recordings'),
    where('studentName', '==', studentName)
  );
  
  const snapshot = await getDocs(q);
  const recordings = [];
  
  snapshot.forEach(doc => {
    recordings.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  console.log(`📊 統計データ取得: ${recordings.length}件`);
  return recordings;
}

// グローバルに公開
window.fetchAffirmations = fetchAffirmations;
window.drawWeeklyCards = drawWeeklyCards;
window.uploadRecordingsToFirebase = uploadRecordingsToFirebase;
window.fetchUserStats = fetchUserStats;
// Firestore関数も公開
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;