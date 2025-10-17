// ==============================================
// Firebase Authentication
// ==============================================

let currentUser = null;

/**
 * Googleログイン
 */
async function loginWithGoogle() {
  try {
    const provider = new window.GoogleAuthProvider();
    const auth = window.getAuth();
    const result = await window.signInWithPopup(auth, provider);
    
    currentUser = result.user;
    console.log('✅ ログイン成功:', currentUser.displayName);
    
    // ユーザーデータを保存
    await saveUserProfile(currentUser);
    
    // セットアップ画面へ
    showSetupScreen();
    
    return currentUser;
  } catch (error) {
    console.error('❌ ログインエラー:', error);
    alert('ログインに失敗しました: ' + error.message);
    return null;
  }
}

/**
 * ログアウト
 */
async function logout() {
  try {
    const auth = window.getAuth();
    await window.signOut(auth);
    currentUser = null;
    console.log('✅ ログアウト成功');
    
    // ログイン画面へ
    showLoginScreen();
  } catch (error) {
    console.error('❌ ログアウトエラー:', error);
    alert('ログアウトに失敗しました');
  }
}

/**
 * ユーザープロフィールを保存
 */
async function saveUserProfile(user) {
  const userRef = window.doc(window.db, 'users', user.uid);
  
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  try {
    // setDocでmerge: trueを使うと、既存データを保持しながら更新
    await window.setDoc(userRef, userData, { merge: true });
    console.log('✅ ユーザープロフィール保存成功');
  } catch (error) {
    console.error('❌ ユーザープロフィール保存エラー:', error);
  }
}

/**
 * 認証状態の監視
 */
function observeAuthState(callback) {
  const auth = window.getAuth();
  window.onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (callback) callback(user);
  });
}

/**
 * 現在のユーザーを取得
 */
function getCurrentUser() {
  return currentUser;
}

// グローバルに公開
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.observeAuthState = observeAuthState;
window.getCurrentUser = getCurrentUser;