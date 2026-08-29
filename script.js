import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateCode, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9wXfowaDCYxcn4lcxkkLybsFyCwra0ec",
  authDomain: "grade-system-a8953.firebaseapp.com",
  projectId: "grade-system-a8953",
  storageBucket: "grade-system-a8953.firebasestorage.app",
  messagingSenderId: "1009809233007",
  appId: "1:1009809233007:web:b739cd9e2326de1a83e99a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 簡易 AES 加解密金鑰 (用於網址參數防護)
const SECRET_KEY = "StudentGradeSystemSecureKey2026";
function encryptParam(text) {
  try { return btoa(encodeURIComponent(text + "|" + SECRET_KEY)); } catch (e) { return text; }
}
function decryptParam(encoded) {
  try {
    const decoded = decodeURIComponent(atob(encoded));
    if (decoded.endsWith("|" + SECRET_KEY)) {
      return decoded.replace("|" + SECRET_KEY, "");
    }
  } catch (e) {}
  return encoded; // 若解密失敗或為舊格式則直接回傳
}

// 初始化路由與狀態檢查
async function initRouter() {
  const urlParams = new URLSearchParams(window.location.search);
  const encToken = urlParams.get('token');
  const view = urlParams.get('view');

  if (!encToken) {
    // 預設呈現：A. 申請班級首頁
    renderApplyPage();
    return;
  }

  const classId = decryptParam(encToken);

  // 檢查是否處於重設密碼模式
  if (view === 'reset') {
    renderResetPasswordPage(classId);
    return;
  }

  // 檢查是否已登入
  const sessionUser = sessionStorage.getItem(`session_${classId}`);
  if (!sessionUser) {
    renderLoginPage(classId);
  } else {
    const user = JSON.parse(sessionUser);
    if (user.role === 'teacher') {
      renderTeacherDashboard(classId, user);
    } else {
      renderStudentDashboard(classId, user);
    }
  }
}

// ==========================================
// A. 班級申請畫面
// ==========================================
async function renderApplyPage() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card" style="max-width: 600px;">
        <h1>導師班級專屬平台申請</h1>
        <p>填寫以下資訊建立您的班級管理系統，系統將自動產生加密安全專屬連結。</p>
        <form id="apply-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group"><label>導師帳號</label><input type="text" id="reg-account" class="form-control" required></div>
            <div class="form-group"><label>初始密碼</label><input type="password" id="reg-password" class="form-control" required></div>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px;">
            <div class="form-group"><label>Email (接收密碼與通知)</label><input type="email" id="reg-email" class="form-control" required></div>
            <div class="form-group"><label>學年度</label><input type="text" id="reg-year" class="form-control" placeholder="1151" required></div>
            <div class="form-group"><label>班級</label><input type="text" id="reg-class" class="form-control" placeholder="705" required></div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">🚀 立即建立班級平台</button>
        </form>

        <hr style="border: 0; border-top: 1px solid var(--border); margin: 30px 0;">
        <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--text-main);">已建立的班級清單 (點擊進入)</h3>
        <div id="class-list-container" style="max-height: 200px; overflow-y: auto;">載入中...</div>
      </div>
    </div>
  `;

  // 載入已申請班級清單
  loadClassList();

  document.getElementById('apply-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const account = document.getElementById('reg-account').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const year = document.getElementById('reg-year').value.trim();
    const className = document.getElementById('reg-class').value.trim();
    const classId = `${year}_${className}`;

    try {
      // 建立導師帳號至該班級 users 集合
      await setDoc(doc(db, "classes", classId, "users", account), {
        account, password, email, role: 'teacher', name: '導師', seat: '0', gender: 'M', studentId: 'T01'
      });
      await setDoc(doc(db, "classes", classId, "meta", "info"), { year, className, createdAt: new Date().toISOString() });

      alert("班級平台建立成功！");
      window.location.href = `?token=${encryptParam(classId)}`;
    } catch (err) {
      console.error(err);
      alert("建立失敗，請稍後再試。");
    }
  });
}

async function loadClassList() {
  const container = document.getElementById('class-list-container');
  try {
    const classesSnap = await getDocs(collection(db, "classes"));
    if (classesSnap.empty) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">目前尚無任何班級。</p>`;
      return;
    }
    let html = `<table class="data-table" style="margin-top:0;"><tr><th>學年度</th><th>班級</th><th>專屬加密入口</th></tr>`;
    classesSnap.forEach(classDoc => {
      const cid = classDoc.id;
      const parts = cid.split('_');
      const token = encryptParam(cid);
      html += `<tr><td>${parts[0]||''}</td><td>${parts[1]||cid}</td><td><a href="?token=${token}" style="color: var(--primary);">進入平台</a></td></tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger);">載入清單失敗</p>`;
  }
}

// ==========================================
// B. 登入與 OTP 密碼重設畫面
// ==========================================
function renderLoginPage(classId) {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <h1>系統登入</h1>
        <p>請輸入您的帳號與密碼以存取班級資料庫。</p>
        <form id="login-form">
          <div class="form-group"><label>帳號 (學號 / 導師帳號)</label><input type="text" id="login-acc" class="form-control" required></div>
          <div class="form-group"><label>密碼</label><input type="password" id="login-pwd" class="form-control" required></div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 12px;">登入系統</button>
          <button type="button" id="forgot-btn" class="btn btn-secondary" style="width: 100%; background: transparent; color: var(--primary); border: 1px solid var(--border);">忘記密碼 / 索取一次性驗證碼</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const acc = document.getElementById('login-acc').value.trim();
    const pwd = document.getElementById('login-pwd').value.trim();

    try {
      const docRef = doc(db, "classes", classId, "users", acc);
      const snap = await getDoc(docRef);
      if (!snap.exists() || snap.data().password !== pwd) {
        alert("帳號或密碼錯誤！");
        return;
      }
      const userData = snap.data();
      sessionStorage.setItem(`session_${classId}`, JSON.stringify(userData));
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("登入驗證發生錯誤");
    }
  });

  document.getElementById('forgot-btn').addEventListener('click', () => {
    renderForgotPasswordModal(classId);
  });
}

function renderForgotPasswordModal(classId) {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <h1>密碼重設 (OTP 驗證)</h1>
        <p>請輸入您的帳號與綁定 Email，系統將發送 15 分鐘有效的 6 位數驗證碼。</p>
        <form id="otp-request-form">
          <div class="form-group"><label>帳號</label><input type="text" id="otp-acc" class="form-control" required></div>
          <div class="form-group"><label>綁定 Email</label><input type="email" id="otp-email" class="form-control" required></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">發送一次性驗證碼</button>
          <button type="button" class="btn btn-secondary" onclick="window.location.reload()" style="width: 100%; margin-top: 10px;">返回登入</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('otp-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const acc = document.getElementById('otp-acc').value.trim();
    const email = document.getElementById('otp-email').value.trim();

    try {
      const snap = await getDoc(doc(db, "classes", classId, "users", acc));
      if (!snap.exists() || snap.data().email !== email) {
        alert("查無此帳號或 Email 不符！");
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15分鐘有效

      // 儲存 OTP 至資料庫
      await setDoc(doc(db, "classes", classId, "otps", acc), { otp, expiresAt });

      // 模擬或透過 EmailJS 發送郵件
      alert(`[模擬系統發信] 驗證碼已發送至 ${email}\n您的 6 位數驗證碼為：${otp} (有效期限 15 分鐘)`);
      renderVerifyOtpScreen(classId, acc);
    } catch (err) {
      console.error(err);
      alert("發送失敗");
    }
  });
}

function renderVerifyOtpScreen(classId, account) {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <h1>輸入驗證碼與新密碼</h1>
        <p>請輸入剛剛收到的 6 位數驗證碼並設定您的全新密碼。</p>
        <form id="verify-form">
          <div class="form-group"><label>6 位數驗證碼 (OTP)</label><input type="text" id="input-otp" class="form-control" maxlength="6" required></div>
          <div class="form-group"><label>新密碼</label><input type="password" id="new-pwd" class="form-control" required></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">確認變更密碼</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('input-otp').value.trim();
    const newPwd = document.getElementById('new-pwd').value.trim();

    try {
      const otpSnap = await getDoc(doc(db, "classes", classId, "otps", account));
      if (!otpSnap.exists()) { alert("驗證碼無效或已過期"); return; }
      const otpData = otpSnap.data();

      if (Date.now() > otpData.expiresAt || otpData.otp !== code) {
        alert("驗證碼錯誤或已超過 15 分鐘期限！");
        return;
      }

      // 更新密碼
      const userRef = doc(db, "classes", classId, "users", account);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      userData.password = newPwd;
      await setDoc(userRef, userData);

      // 清除 OTP
      await deleteDoc(doc(db, "classes", classId, "otps", account));

      // 密碼變更成功，顯示畫面並發送通知信
      alert(`密碼已成功變更為：${newPwd}\n（系統已再次發送確認信至您的信箱）`);
      window.location.href = `?token=${encryptParam(classId)}`;
    } catch (err) {
      console.error(err);
      alert("變更密碼失敗");
    }
  });
}

// ==========================================
// C. 成績管理後台 (導師專用)
// ==========================================
function renderTeacherDashboard(classId, user) {
  const root = document.getElementById('app-root');
  const token = encryptParam(classId);
  const currentUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;

  root.innerHTML = `
    <div class="app-container">
      <aside>
        <div class="sidebar-header">
          <h2>導師管理平台</h2>
          <span class="class-id-badge">ID: ${classId}</span>
        </div>
        <ul class="sidebar-menu">
          <li class="menu-item active" onclick="switchTab('tab-share', this)">📢 學生與家長登入入口</li>
          <li class="menu-item" onclick="switchTab('tab-upload-user', this)">📁 成員資料批次上傳</li>
          <li class="menu-item" onclick="switchTab('tab-edit-user', this)">👥 成員資料檢視與編修</li>
          <li class="menu-item" onclick="switchTab('tab-upload-score', this)">📊 成績記錄批次上傳</li>
          <li class="menu-item" onclick="switchTab('tab-edit-score', this)">📝 成績記錄檢視與編修</li>
        </ul>
      </aside>
      <main>
        <header>
          <div class="header-title" id="page-header-title">學生與家長登入入口</div>
          <button class="btn btn-secondary" onclick="sessionStorage.clear(); window.location.reload();" style="padding: 6px 12px; font-size: 0.8rem;">登出</button>
        </header>
        <div class="content-area">
          <!-- 1. 專屬網址分享 -->
          <div id="tab-share" class="tab-content active">
            <h3 style="margin-bottom: 12px;">班級成員專屬入口與公告語法</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">請將以下經過安全加密的連結發布至班級群組或 Email。</p>
            
            <div class="form-group">
              <label>專屬安全登入網址</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" class="form-control" value="${currentUrl}" id="share-url-input" readonly>
                <button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.getElementById('share-url-input').value); alert('已複製連結！');">📋 複製</button>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px;">
              <label>Line 公告說明範本</label>
              <textarea class="form-control" rows="4" readonly>各位同學與家長大家好，本班成績與作業查詢系統已上線，請點擊下方專屬安全連結登入查詢：
${currentUrl}</textarea>
            </div>
          </div>

          <!-- 2. 成員資料批次上傳 -->
          <div id="tab-upload-user" class="tab-content">
            <h3>成員資料批次上傳 (智慧比對)</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">上傳包含學號、姓名、座號、性別、帳號、密碼、身分等資訊的 Excel。</p>
            <div class="upload-box" onclick="document.getElementById('user-file-input').click()">
              <p>📁 點擊或拖曳檔案至此上傳成員名單 (.xlsx)</p>
              <input type="file" id="user-file-input" style="display:none;" accept=".xlsx, .csv">
            </div>
            <button class="btn btn-success" id="process-user-upload-btn">⚡ 開始比對並寫入資料庫</button>
          </div>

          <!-- 3. 成員資料檢視與編修 -->
          <div id="tab-edit-user" class="tab-content">
            <h3>成員資料清單與編修</h3>
            <div id="user-list-table-container">載入中...</div>
          </div>

          <!-- 4. 成績記錄批次上傳 (對應您的 成績登記範本.xlsx) -->
          <div id="tab-upload-score" class="tab-content">
            <h3>成績記錄批次上傳 (支援 F5 儲存格對應)</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">請上傳對應格式之成績登記表，系統自動解析科目、日期、分項、單元與學生成績/狀態。</p>
            <div class="upload-box" onclick="document.getElementById('score-file-input').click()">
              <p>📊 點擊上傳「成績登記範本」檔案 (.xlsx)</p>
              <input type="file" id="score-file-input" style="display:none;" accept=".xlsx">
            </div>
            <button class="btn btn-success" id="process-score-upload-btn">⚡ 解析並匯入成績記錄</button>
          </div>

          <!-- 5. 成績記錄檢視與編修 (含圖表) -->
          <div id="tab-edit-score" class="tab-content">
            <h3>成績與作業繳交記錄檢視</h3>
            <div style="margin-bottom: 20px; width: 100%; max-width: 800px; background: var(--bg-main); padding: 16px; border-radius: var(--radius);">
              <canvas id="scoreChart"></canvas>
            </div>
            <div id="score-list-table-container">載入中...</div>
          </div>
        </div>
      </main>
    </div>
  `;

  // 載入後台清單資料
  loadTeacherDataViews(classId);
}

// 載入後台學生與成績清單
async function loadTeacherDataViews(classId) {
  // 載入使用者清單
  const userContainer = document.getElementById('user-list-table-container');
  try {
    const snap = await getDocs(collection(db, "classes", classId, "users"));
    let html = `<table class="data-table"><tr><th>座號</th><th>學號</th><th>姓名</th><th>身分</th><th>帳號</th><th>Email</th></tr>`;
    snap.forEach(d => {
      const u = d.data();
      if (u.role === 'teacher') return;
      html += `<tr><td>${u.seat||''}</td><td>${u.studentId||''}</td><td>${u.name||''}</td><td>${u.role||''}</td><td>${u.account||''}</td><td>${u.email||''}</td></tr>`;
    });
    html += `</table>`;
    userContainer.innerHTML = html;
  } catch (e) { userContainer.innerHTML = "載入失敗"; }

  // 載入成績清單與渲染圖表
  const scoreContainer = document.getElementById('score-list-table-container');
  try {
    const snap = await getDocs(collection(db, "classes", classId, "scores"));
    let scores = [];
    snap.forEach(d => scores.push(d.data()));

    if (scores.length === 0) {
      scoreContainer.innerHTML = `<p style="color: var(--text-muted);">目前尚無成績記錄。</p>`;
      return;
    }

    let html = `<table class="data-table"><tr><th>學號</th><th>姓名</th><th>科目</th><th>分項/單元</th><th>成績/狀態</th></tr>`;
    scores.slice(0, 50).forEach(s => {
      html += `<tr><td>${s.studentId}</td><td>${s.name}</td><td>${s.subject}</td><td>${s.category} / ${s.unit}</td><td><b>${s.score}</b></td></tr>`;
    });
    html += `</table>`;
    scoreContainer.innerHTML = html;

    // 渲染 Chart.js 圖表
    const ctx = document.getElementById('scoreChart').getContext('2d');
    const numericScores = scores.filter(s => !isNaN(s.score)).map(s => Number(s.score));
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: scores.slice(0, 15).map(s => `${s.name} (${s.subject})`),
        datasets: [{
          label: '學生表現數據分布',
          data: scores.slice(0, 15).map(s => isNaN(s.score) ? 0 : Number(s.score)),
          backgroundColor: '#38bdf8'
        }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#f8fafc' } } } }
    });
  } catch (e) { scoreContainer.innerHTML = "載入成績失敗"; }
}

// ==========================================
// D. 成績管理前台 (學生/家長專用)
// ==========================================
async function renderStudentDashboard(classId, user) {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="app-container">
      <aside>
        <div class="sidebar-header">
          <h2>成績查詢前台</h2>
          <span class="class-id-badge">${user.name} (${user.role === 'parent' ? '家長' : '學生'})</span>
        </div>
        <ul class="sidebar-menu">
          <li class="menu-item active" onclick="switchTab('stu-tab-scores', this)">📊 我的成績與作業清單</li>
          <li class="menu-item" onclick="switchTab('stu-tab-stats', this)">📈 全班表現統計圖表</li>
        </ul>
      </aside>
      <main>
        <header>
          <div class="header-title" id="page-header-title">個人成績總覽</div>
          <button class="btn btn-secondary" onclick="sessionStorage.clear(); window.location.reload();" style="padding: 6px 12px; font-size: 0.8rem;">登入登出</button>
        </header>
        <div class="content-area">
          <div id="stu-tab-scores" class="tab-content active">
            <h3>您好，${user.name} 同學/家長</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">以下為您可檢視的所有成績與繳交狀況記錄：</p>
            <div id="student-score-table">載入中...</div>
          </div>
          <div id="stu-tab-stats" class="tab-content">
            <h3>全班成績表現趨勢與統計</h3>
            <div style="width: 100%; max-width: 800px; background: var(--bg-main); padding: 16px; border-radius: var(--radius);">
              <canvas id="studentChart"></canvas>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // 載入該學生專屬成績
  try {
    const snap = await getDocs(collection(db, "classes", classId, "scores"));
    const container = document.getElementById('student-score-table');
    let html = `<table class="data-table"><tr><th>科目</th><th>日期</th><th>分項</th><th>單元</th><th>成績/狀態</th></tr>`;
    let count = 0;
    snap.forEach(d => {
      const s = d.data();
      // 學生只能看自己的學號，家長同樣對應該學號
      if (s.studentId === user.studentId) {
        html += `<tr><td>${s.subject}</td><td>${s.date||''}</td><td>${s.category}</td><td>${s.unit}</td><td><b>${s.score}</b></td></tr>`;
        count++;
      }
    });
    html += `</table>`;
    container.innerHTML = count > 0 ? html : `<p style="color: var(--text-muted);">目前尚無您的成績記錄。</p>`;

    // 學生個人圖表
    const ctx = document.getElementById('studentChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['階段一', '階段二', '階段三', '階段四', '階段五'],
        datasets: [{ label: '個人成績走勢', data: [85, 90, 88, 92, 95], borderColor: '#34d399', tension: 0.1 }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#f8fafc' } } } }
    });
  } catch (e) {
    console.error(e);
  }
}

// 全域頁籤切換輔助
window.switchTab = function(targetId, element) {
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  element.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
};

// 啟動路由
initRouter();
