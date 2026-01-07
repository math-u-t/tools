// PGPbrowser - PGP暗号化ツール
// openpgp.jsを使用したPGP公開鍵暗号実装

// グローバル変数
let currentKeyPair = null;

// openpgp.jsが読み込まれるまで待機
let openpgp = window.openpgp;
let openpgpReady = !!openpgp;

// 初期化
function initializeApp() {
    if (!openpgpReady || !openpgp) {
        console.warn('openpgp.jsはまだ読み込まれていません');
        setTimeout(initializeApp, 100);
        return;
    }

    // openpgp.jsの設定
    try {
        openpgp.config.show_comment = false;
        openpgp.config.show_version = false;
    } catch (e) {
        console.warn('openpgp設定エラー:', e);
    }

    setupEventListeners();
    loadStoredKeys();
}

// イベントリスナー設定
function setupEventListeners() {
    // タブ切り替え
    document.querySelectorAll('.pgp-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // 鍵生成
    document.getElementById('generate-key-btn').addEventListener('click', generateKeyPair);
    document.getElementById('save-keys-btn').addEventListener('click', saveKeysToStorage);
    document.getElementById('download-public-btn').addEventListener('click', () => downloadKey('public-key-output', 'public-key.asc'));
    document.getElementById('download-secret-btn').addEventListener('click', () => downloadKey('secret-key-output', 'secret-key.asc'));

    // 暗号化
    document.getElementById('encrypt-btn').addEventListener('click', encryptMessage);
    document.getElementById('public-key-file-input').addEventListener('change', (e) => loadFileToTextarea(e, 'recipient-public-key'));
    document.getElementById('encrypt-file-input').addEventListener('change', (e) => loadFileContent(e, 'encrypt-file'));

    // 暗号化ドラッグ&ドロップ
    setupDragDrop('encrypt-file-area', 'encrypt-file-input');

    // 復号化
    document.getElementById('decrypt-btn').addEventListener('click', decryptMessage);
    document.getElementById('secret-key-file-input').addEventListener('change', (e) => loadFileToTextarea(e, 'secret-key-input'));
    document.getElementById('decrypt-file-input').addEventListener('change', (e) => loadFileContent(e, 'decrypt-file'));

    // 復号化ドラッグ&ドロップ
    setupDragDrop('decrypt-file-area', 'decrypt-file-input');

    // 鍵管理
    document.getElementById('clear-storage-btn').addEventListener('click', clearAllStorage);
}

// タブ切り替え
function switchTab(tabName) {
    // タブボタン更新
    document.querySelectorAll('.pgp-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // セクション表示
    document.querySelectorAll('.pgp-section').forEach(section => {
        section.classList.toggle('active', section.id === `${tabName}-tab`);
    });
}

// ========== 鍵生成 ==========

async function generateKeyPair() {
    const name = document.getElementById('key-name').value || 'My PGP Key';
    const email = document.getElementById('key-email').value || 'user@example.com';
    const passphrase = document.getElementById('key-passphrase').value;
    const keyType = document.getElementById('key-type').value;

    const statusEl = document.getElementById('keygen-status');
    const resultEl = document.getElementById('keygen-result');

    try {
        statusEl.textContent = '🔄 鍵を生成中...（数秒かかる場合があります）';
        statusEl.className = 'status-text loading';

        // RSAの場合
        let rsaBits = 4096;
        if (keyType === 'rsa2048') rsaBits = 2048;

        const keyOptions = {
            type: 'ecc',
            curve: 'curve25519',
            userIDs: [{ name, email }],
            passphrase
        };

        if (keyType !== 'ecc') {
            keyOptions.type = 'rsa';
            keyOptions.rsaBits = rsaBits;
            delete keyOptions.curve;
        }

        const { key: publicKey, privateKey: secretKey } = await openpgp.generateKey(keyOptions);

        currentKeyPair = {
            publicKey: publicKey,
            secretKey: secretKey,
            name: name,
            email: email,
            created: new Date().toLocaleString('ja-JP')
        };

        // 公開鍵をテキスト形式に変換
        const publicKeyArmored = await openpgp.readKey({ armoredKey: publicKey });
        const publicKeyText = publicKey;

        // 秘密鍵をテキスト形式に変換
        const secretKeyText = secretKey;

        // テキストエリアに表示
        document.getElementById('public-key-output').value = publicKeyText;
        document.getElementById('secret-key-output').value = secretKeyText;

        resultEl.style.display = 'block';

        statusEl.textContent = '✅ 鍵ペアを生成しました！';
        statusEl.className = 'status-text success';

        // スクロール
        resultEl.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        statusEl.textContent = `❌ エラー: ${error.message}`;
        statusEl.className = 'status-text error';
        console.error('Key generation error:', error);
    }
}

function saveKeysToStorage() {
    if (!currentKeyPair) {
        alert('先に鍵ペアを生成してください');
        return;
    }

    try {
        const storageData = {
            name: currentKeyPair.name,
            email: currentKeyPair.email,
            created: currentKeyPair.created,
            publicKey: document.getElementById('public-key-output').value,
            secretKey: document.getElementById('secret-key-output').value
        };

        const keyId = `pgp_key_${Date.now()}`;
        localStorage.setItem(keyId, JSON.stringify(storageData));

        alert('✅ 鍵ペアをLocalStorageに保存しました');
        loadStoredKeys();

    } catch (error) {
        alert(`❌ 保存エラー: ${error.message}`);
    }
}

// ========== 暗号化 ==========

async function encryptMessage() {
    const publicKeyText = document.getElementById('recipient-public-key').value.trim();
    const plainText = document.getElementById('encrypt-text').value.trim();

    const statusEl = document.getElementById('encrypt-status');
    const resultEl = document.getElementById('encrypt-result');

    if (!publicKeyText) {
        statusEl.textContent = '❌ 受取人の公開鍵を入力してください';
        statusEl.className = 'status-text error';
        return;
    }

    if (!plainText) {
        statusEl.textContent = '❌ 暗号化するテキストを入力してください';
        statusEl.className = 'status-text error';
        return;
    }

    try {
        statusEl.textContent = '🔒 暗号化中...';
        statusEl.className = 'status-text loading';

        // 公開鍵を読み込む
        const publicKey = await openpgp.readKey({ armoredKey: publicKeyText });

        // メッセージを暗号化
        const message = await openpgp.createMessage({ text: plainText });
        const encrypted = await openpgp.encrypt({
            message,
            encryptionKeys: publicKey
        });

        document.getElementById('encrypted-output').value = encrypted;
        resultEl.style.display = 'block';

        statusEl.textContent = '✅ 暗号化が完了しました';
        statusEl.className = 'status-text success';

        resultEl.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        statusEl.textContent = `❌ エラー: ${error.message}`;
        statusEl.className = 'status-text error';
        console.error('Encryption error:', error);
    }
}

// ========== 復号化 ==========

async function decryptMessage() {
    const secretKeyText = document.getElementById('secret-key-input').value.trim();
    const encryptedText = document.getElementById('decrypt-text').value.trim();
    const passphrase = document.getElementById('decrypt-passphrase').value;

    const statusEl = document.getElementById('decrypt-status');
    const resultEl = document.getElementById('decrypt-result');

    if (!secretKeyText) {
        statusEl.textContent = '❌ 秘密鍵を入力してください';
        statusEl.className = 'status-text error';
        return;
    }

    if (!encryptedText) {
        statusEl.textContent = '❌ 暗号化されたテキストを入力してください';
        statusEl.className = 'status-text error';
        return;
    }

    try {
        statusEl.textContent = '🔓 復号化中...';
        statusEl.className = 'status-text loading';

        // 秘密鍵を読み込む
        const secretKey = await openpgp.readPrivateKey({ armoredKey: secretKeyText });

        // パスフレーズで秘密鍵をアンロック
        if (passphrase) {
            await openpgp.decryptKey({
                privateKey: secretKey,
                passphrase
            });
        }

        // メッセージを復号化
        const message = await openpgp.readMessage({
            armoredMessage: encryptedText
        });

        const { data: decrypted } = await openpgp.decrypt({
            message,
            decryptionKeys: secretKey
        });

        document.getElementById('decrypted-output').value = decrypted;
        resultEl.style.display = 'block';

        statusEl.textContent = '✅ 復号化が完了しました';
        statusEl.className = 'status-text success';

        resultEl.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        statusEl.textContent = `❌ エラー: ${error.message}`;
        statusEl.className = 'status-text error';
        console.error('Decryption error:', error);
    }
}

// ========== 鍵管理 ==========

function loadStoredKeys() {
    const listEl = document.getElementById('storage-list');
    const clearBtn = document.getElementById('clear-storage-btn');
    const keys = [];

    // LocalStorageから鍵を取得
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('pgp_key_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                keys.push({ id: key, ...data });
            } catch (e) {
                console.error('Error parsing key:', e);
            }
        }
    }

    if (keys.length === 0) {
        listEl.innerHTML = '<div class="no-data">保存済みの鍵がありません</div>';
        clearBtn.style.display = 'none';
        return;
    }

    listEl.innerHTML = keys.map(key => `
        <div class="storage-item">
            <div class="storage-item-header">
                <div>
                    <div class="storage-item-name">${escapeHtml(key.name)}</div>
                    <div class="storage-item-email">${escapeHtml(key.email)}</div>
                </div>
                <div class="storage-item-date">${key.created}</div>
            </div>
            <div class="storage-item-actions">
                <button class="btn btn-secondary" onclick="loadStoredKey('${key.id}')">読み込み</button>
                <button class="btn btn-secondary" onclick="copyStoredPublicKey('${key.id}')">公開鍵</button>
                <button class="btn btn-secondary" onclick="deleteStoredKey('${key.id}')">削除</button>
            </div>
        </div>
    `).join('');

    clearBtn.style.display = 'block';
}

function loadStoredKey(keyId) {
    try {
        const data = JSON.parse(localStorage.getItem(keyId));
        if (data) {
            document.getElementById('secret-key-input').value = data.secretKey;
            switchTab('decrypt');
            document.getElementById('secret-key-input').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        alert(`❌ 鍵の読み込みエラー: ${error.message}`);
    }
}

function copyStoredPublicKey(keyId) {
    try {
        const data = JSON.parse(localStorage.getItem(keyId));
        if (data) {
            navigator.clipboard.writeText(data.publicKey).then(() => {
                alert('✅ 公開鍵をコピーしました');
            });
        }
    } catch (error) {
        alert(`❌ エラー: ${error.message}`);
    }
}

function deleteStoredKey(keyId) {
    if (confirm('本当にこの鍵を削除しますか？')) {
        localStorage.removeItem(keyId);
        loadStoredKeys();
    }
}

function clearAllStorage() {
    if (confirm('すべての保存済み鍵を削除しますか？この操作は取り消せません。')) {
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('pgp_key_')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key));
        loadStoredKeys();
        alert('✅ すべての鍵が削除されました');
    }
}

// ========== ユーティリティ ==========

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    navigator.clipboard.writeText(element.value).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ コピーしました';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert(`コピーエラー: ${err.message}`);
    });
}

function downloadKey(elementId, filename) {
    const content = document.getElementById(elementId).value;
    downloadText(elementId, filename);
}

function downloadText(elementId, filename) {
    const content = document.getElementById(elementId).value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

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

function loadFileToTextarea(event, textareaId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById(textareaId).value = e.target.result;
    };
    reader.onerror = () => {
        alert(`ファイル読み込みエラー: ${reader.error}`);
    };
    reader.readAsText(file);
}

let encryptFileContent = '';
let decryptFileContent = '';

function loadFileContent(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        if (type === 'encrypt-file') {
            encryptFileContent = content;
            document.getElementById('encrypt-file-name').textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            document.getElementById('encrypt-text').value = content;
        } else if (type === 'decrypt-file') {
            decryptFileContent = content;
            document.getElementById('decrypt-file-name').textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            document.getElementById('decrypt-text').value = content;
        }
    };
    reader.onerror = () => {
        alert(`ファイル読み込みエラー: ${reader.error}`);
    };
    reader.readAsText(file);
}

function setupDragDrop(areaId, inputId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.style.background = 'var(--primary)';
    });

    area.addEventListener('dragleave', () => {
        area.style.background = '';
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.background = '';
        if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    });
}

// DOMContentLoadedで初期化開始
document.addEventListener('DOMContentLoaded', initializeApp);
// または直接呼び出し（スクリプトが遅延読み込みされた場合）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

