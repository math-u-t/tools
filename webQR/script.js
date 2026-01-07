// webQR - QRコード読み取りツール
// jsQR ライブラリを使用してQRコード読み取りを実装

let currentMode = 'camera';
let videoStream = null;
let audioContext = null;
let isReading = false;
const readHistory = [];

// DOM要素
const modeBtns = document.querySelectorAll('.mode-btn');
const modeSections = document.querySelectorAll('.mode-section');
const videoElement = document.getElementById('video-element');
const canvasElement = document.getElementById('canvas-element');
const startCameraBtn = document.getElementById('start-camera-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const cameraStatus = document.getElementById('camera-status');
const fileInputBtn = document.getElementById('file-input-btn');
const fileInput = document.getElementById('file-input');
const uploadPreview = document.getElementById('upload-preview');
const previewImage = document.getElementById('preview-image');
const uploadStatus = document.getElementById('upload-status');
const captureScreenBtn = document.getElementById('capture-screen-btn');
const screenPreview = document.getElementById('screen-preview');
const screenImage = document.getElementById('screen-image');
const screenStatus = document.getElementById('screen-status');
const resultContainer = document.getElementById('result-container');
const resultActions = document.getElementById('result-actions');
const copyResultBtn = document.getElementById('copy-result-btn');
const openResultBtn = document.getElementById('open-result-btn');
const clearResultBtn = document.getElementById('clear-result-btn');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupEventListeners();
});

// イベントリスナー設定
function setupEventListeners() {
    // モード切り替え
    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchMode(e.target.dataset.mode);
        });
    });

    // カメラ制御
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);

    // ファイルアップロード
    fileInputBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // ドラッグ&ドロップ
    const uploadArea = document.querySelector('.file-upload-area');
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'var(--primary)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = '';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = '';
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // スクリーンキャプチャ
    captureScreenBtn.addEventListener('click', captureScreen);

    // 結果アクション
    copyResultBtn.addEventListener('click', copyResultToClipboard);
    openResultBtn.addEventListener('click', openResult);
    clearResultBtn.addEventListener('click', clearResult);

    // 履歴
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// モード切り替え
function switchMode(mode) {
    currentMode = mode;

    // ボタン更新
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // セクション表示
    modeSections.forEach(section => {
        section.classList.toggle('active', section.id === `${mode}-mode`);
    });

    // カメラ停止
    if (mode !== 'camera' && videoStream) {
        stopCamera();
    }
}

// ========== カメラモード ==========

async function startCamera() {
    try {
        cameraStatus.textContent = '📷 カメラ起動中...';
        cameraStatus.className = 'status-text loading';

        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });

        videoElement.srcObject = videoStream;
        videoElement.play();

        startCameraBtn.style.display = 'none';
        stopCameraBtn.style.display = 'inline-block';

        cameraStatus.textContent = '✅ カメラ起動完了。QRコードをフレーム内に収めてください';
        cameraStatus.className = 'status-text success';

        isReading = true;
        readQRFromCamera();
    } catch (error) {
        cameraStatus.textContent = `❌ エラー: ${error.message}`;
        cameraStatus.className = 'status-text error';
        console.error('Camera error:', error);
    }
}

function stopCamera() {
    isReading = false;

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    videoElement.srcObject = null;
    startCameraBtn.style.display = 'inline-block';
    stopCameraBtn.style.display = 'none';
    cameraStatus.textContent = '';
}

function readQRFromCamera() {
    if (!isReading) return;

    const canvas = canvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    ctx.drawImage(videoElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
        displayResult(code.data);
        isReading = false;
        stopCamera();
        return;
    }

    requestAnimationFrame(readQRFromCamera);
}

// ========== ファイルアップロードモード ==========

function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    uploadStatus.textContent = '📂 画像を読み込み中...';
    uploadStatus.className = 'status-text loading';

    const reader = new FileReader();

    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadPreview.style.display = 'block';

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                displayResult(code.data);
                uploadStatus.textContent = '✅ QRコード読み取り成功';
                uploadStatus.className = 'status-text success';
            } else {
                uploadStatus.textContent = '❌ QRコードが見つかりません';
                uploadStatus.className = 'status-text error';
            }
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// ========== スクリーンキャプチャモード ==========

async function captureScreen() {
    try {
        screenStatus.textContent = '🖥️ 画面選択中...';
        screenStatus.className = 'status-text loading';

        const canvas = await html2canvas(document.documentElement);
        const imageData = canvas.toDataURL('image/png');

        screenImage.src = imageData;
        screenPreview.style.display = 'block';

        const img = new Image();
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            const code = jsQR(imgData.data, imgData.width, imgData.height);

            if (code) {
                displayResult(code.data);
                screenStatus.textContent = '✅ QRコード読み取り成功';
                screenStatus.className = 'status-text success';
            } else {
                screenStatus.textContent = '❌ QRコードが見つかりません';
                screenStatus.className = 'status-text error';
            }
        };

        img.src = imageData;
    } catch (error) {
        screenStatus.textContent = `❌ エラー: ${error.message}`;
        screenStatus.className = 'status-text error';
        console.error('Screen capture error:', error);
    }
}

// ========== 結果表示 ==========

function displayResult(qrData) {
    const result = {
        text: qrData,
        timestamp: new Date().toLocaleString('ja-JP'),
        time: Date.now()
    };

    // 結果表示
    const isUrl = /^https?:\/\//.test(qrData);
    const resultHtml = `
        <div class="result-content">
            <div class="result-item">
                <div class="result-label">データ</div>
                <div class="result-value">${escapeHtml(qrData)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">タイプ</div>
                <div class="result-value">${isUrl ? 'URL' : 'テキスト'}</div>
            </div>
            <div class="result-item">
                <div class="result-label">読み取り時刻</div>
                <div class="result-value">${result.timestamp}</div>
            </div>
        </div>
    `;

    resultContainer.innerHTML = resultHtml;

    // アクションボタン表示
    resultActions.style.display = 'flex';
    openResultBtn.style.display = isUrl ? 'block' : 'none';

    // 履歴に追加
    readHistory.unshift(result);
    if (readHistory.length > 50) readHistory.pop();
    saveHistory();
    updateHistoryList();

    // スクロール
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

function copyResultToClipboard() {
    const resultText = resultContainer.querySelector('.result-value').textContent;
    navigator.clipboard.writeText(resultText).then(() => {
        copyResultBtn.textContent = '✅ コピーしました';
        setTimeout(() => {
            copyResultBtn.textContent = '📋 コピー';
        }, 2000);
    }).catch(err => {
        console.error('Copy error:', err);
    });
}

function openResult() {
    const resultText = resultContainer.querySelector('.result-value').textContent;
    if (/^https?:\/\//.test(resultText)) {
        window.open(resultText, '_blank');
    }
}

function clearResult() {
    resultContainer.innerHTML = '<div class="no-result"><p>QRコードを読み取ると結果がここに表示されます</p></div>';
    resultActions.style.display = 'none';
}

// ========== 履歴管理 ==========

function updateHistoryList() {
    if (readHistory.length === 0) {
        historyList.innerHTML = '<div class="no-history">履歴なし</div>';
        clearHistoryBtn.style.display = 'none';
        return;
    }

    historyList.innerHTML = readHistory.map((item, index) => {
        const isUrl = /^https?:\/\//.test(item.text);
        return `
            <div class="history-item" data-index="${index}">
                <div class="history-time">${item.timestamp}</div>
                <div class="history-text">${escapeHtml(item.text)}</div>
                <div class="history-actions">
                    <button class="history-btn" onclick="loadHistoryItem(${index})">読み込み</button>
                    <button class="history-btn" onclick="copyHistory(${index})">コピー</button>
                    ${isUrl ? `<button class="history-btn" onclick="openHistory(${index})">開く</button>` : ''}
                    <button class="history-btn" onclick="deleteHistoryItem(${index})">削除</button>
                </div>
            </div>
        `;
    }).join('');

    clearHistoryBtn.style.display = 'block';
}

function loadHistoryItem(index) {
    displayResult(readHistory[index].text);
}

function copyHistory(index) {
    navigator.clipboard.writeText(readHistory[index].text);
}

function openHistory(index) {
    const text = readHistory[index].text;
    if (/^https?:\/\//.test(text)) {
        window.open(text, '_blank');
    }
}

function deleteHistoryItem(index) {
    readHistory.splice(index, 1);
    saveHistory();
    updateHistoryList();
}

function clearHistory() {
    if (confirm('本当に履歴をすべて削除しますか？')) {
        readHistory.length = 0;
        saveHistory();
        updateHistoryList();
    }
}

function saveHistory() {
    localStorage.setItem('qr_history', JSON.stringify(readHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('qr_history');
    if (saved) {
        try {
            readHistory.push(...JSON.parse(saved));
            updateHistoryList();
        } catch (e) {
            console.error('Error loading history:', e);
        }
    }
}

// ========== ユーティリティ ==========

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// html2canvas ライブラリの使用（スクリーンキャプチャに必要）
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script> をindex.htmlに追加
