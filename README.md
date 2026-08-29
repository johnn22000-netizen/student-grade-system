# 班級成績與管理系統 (Student Grade System)

本專案為針對中學教育現場設計的輕量化班級管理與成績查詢平台，採用前端靜態網頁架構並串接 Firebase 雲端資料庫。

## 系統特色
* **模組化架構**：導師後台主框架採用 iframe 獨立呼叫各項子工具（批次上傳與檢視編修）。
* **身分權分流**：支援導師端管理（成員匯入、成績維護、登入連結分享）與學生/家長端成績查詢。
* **統一外觀樣式**：全站共用 `style.css`，確保介面簡潔流暢。

## 專案檔案結構
* `index.html`：系統首頁入口
* `apply.html`：導師申請建立班級平台
* `teacher_dashboard.html`：導師管理後台主控介面
* `UploadUserData.html`：成員資料批次上傳
* `EditUserData.html`：成員資料檢視、編修與單筆新增
* `UploadScore.html`：成績記錄批次上傳
* `EditScore.html`：成績記錄檢視、編修與單筆新增
* `dashboard.html`：學生/家長成績查詢儀表板
* `uploadJson2Firebase.html`：後台資料庫遷移工具
* `style.css`：全站共用樣式表
