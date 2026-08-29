import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const urlParams = new URLSearchParams(window.location.search);
const currentClassId = urlParams.get('class');

if (!currentClassId) {
  alert("未指定班級代號！");
}

// 初始化儀表板與抓取 Firebase 資料
async function init() {
  if (!currentClassId) return;

  try {
    // 1. 抓取班級名稱
    const docRef = doc(db, "classes", currentClassId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      document.getElementById('class-title-display').textContent = docSnap.data().className || "班級管理後台";
    } else {
      document.getElementById('class-title-display').textContent = "未命名班級";
    }

    document.getElementById('class-id-badge').textContent = `ID: ${currentClassId}`;
    
    // 設定分享連結
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    document.getElementById('login-url-input').value = `${baseUrl}/index.html?class=${currentClassId}`;

    // 2. 載入學生資料庫清單
    loadUserListData();

  } catch (err) {
    console.error("載入失敗：", err);
  }
}

async function loadUserListData() {
  const tbody = document.getElementById('user-list-tbody');
  try {
    const usersRef = collection(db, "classes", currentClassId, "students");
    const querySnapshot = await getDocs(usersRef);
    
    if (querySnapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">目前資料庫尚無學生資料，請至「成員資料批次上傳」匯入。</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${data.seat || ''}</td>
        <td>${data.studentId || docSnap.id}</td>
        <td>${data.name || ''}</td>
        <td><button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.8rem;">編輯</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">讀取資料庫發生錯誤</td></tr>`;
  }
}

init();

// 標籤頁切換邏輯
window.switchTab = function(targetId, element) {
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  element.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');

  const titles = {
    'tab-share': '學生與家長登入入口',
    'tab-upload-user': '成員資料批次上傳',
    'tab-edit-user': '成員資料檢視與編修',
    'tab-upload-score': '成績記錄批次上傳',
    'tab-edit-score': '成績記錄檢視與編修'
  };
  document.getElementById('page-header-title').textContent = titles[targetId] || '';
};

// 複製連結按鈕
document.getElementById('copy-login-url-btn').addEventListener('click', () => {
  const input = document.getElementById('login-url-input');
  input.select();
  document.execCommand('copy');
  alert("已成功複製登入連結！");
});

// 拖曳上傳與檔案處理互動
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'var(--primary)';
});
dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = '#cbd5e1';
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#cbd5e1';
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    alert(`已選擇檔案：${fileInput.files[0].name}`);
  }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    alert(`已選擇檔案：${fileInput.files[0].name}`);
  }
});
