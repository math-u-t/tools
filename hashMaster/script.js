// ==================== タブ切り替え ====================
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab');
    
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  });
});

// ==================== ハッシュミキサー ====================
async function hashSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

async function hashSHA512(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return bufferToHex(hashBuffer);
}

function hashBase64(text) {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (e) {
    return 'エラー';
  }
}

function bufferToHex(buffer) {
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function updateHashes() {
  const inputText = document.getElementById('hash-input').value;

  if (inputText.length === 0) {
    document.getElementById('sha256-output').value = '';
    document.getElementById('sha512-output').value = '';
    document.getElementById('base64-output').value = '';
    return;
  }

  try {
    const sha256 = await hashSHA256(inputText);
    const sha512 = await hashSHA512(inputText);
    const base64 = hashBase64(inputText);

    document.getElementById('sha256-output').value = sha256;
    document.getElementById('sha512-output').value = sha512;
    document.getElementById('base64-output').value = base64;
  } catch (error) {
    console.error('Hash generation error:', error);
  }
}

function copyHash(elementId) {
  const element = document.getElementById(elementId);
  const text = element.value;

  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const statusEl = document.getElementById('hash-status');
    statusEl.textContent = 'コピーしました!';
    statusEl.classList.add('show');

    const button = event.target;
    button.classList.add('copied');
    button.textContent = '✓ コピー完了';

    setTimeout(() => {
      statusEl.classList.remove('show');
      button.classList.remove('copied');
      button.textContent = 'コピー';
    }, 2000);
  }).catch(err => {
    console.error('コピー失敗:', err);
  });
}

document.getElementById('hash-input').addEventListener('input', updateHashes);
document.getElementById('hash-input').addEventListener('paste', () => {
  setTimeout(updateHashes, 0);
});

// ==================== パスワード生成 ====================
function generatePassword() {
  const length = parseInt(document.getElementById('password-length').value);
  const useUppercase = document.getElementById('use-uppercase').checked;
  const useLowercase = document.getElementById('use-lowercase').checked;
  const useNumbers = document.getElementById('use-numbers').checked;
  const useSymbols = document.getElementById('use-symbols').checked;

  if (!useUppercase && !useLowercase && !useNumbers && !useSymbols) {
    alert('少なくとも1つのオプションを選択してください');
    return;
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let characters = '';
  if (useUppercase) characters += uppercase;
  if (useLowercase) characters += lowercase;
  if (useNumbers) characters += numbers;
  if (useSymbols) characters += symbols;

  let password = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += characters.charAt(randomValues[i] % characters.length);
  }

  document.getElementById('password-output').value = password;
  updatePasswordStrength(password);
}

function updatePasswordStrength(password) {
  let strength = 0;
  let strengthText = '弱い';
  let strengthClass = 'weak';

  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) strength += 15;

  if (strength >= 80) {
    strengthText = '強い';
    strengthClass = 'strong';
  } else if (strength >= 50) {
    strengthText = '中程度';
    strengthClass = 'medium';
  }

  const strengthFill = document.getElementById('strength-fill');
  const strengthTextEl = document.getElementById('strength-text');
  
  strengthFill.className = 'strength-fill ' + strengthClass;
  strengthTextEl.textContent = strengthText;
}

function copyPassword() {
  const password = document.getElementById('password-output').value;
  if (!password) return;

  navigator.clipboard.writeText(password).then(() => {
    const statusEl = document.getElementById('password-status');
    statusEl.textContent = 'パスワードをコピーしました!';
    statusEl.classList.add('show');

    const button = event.target;
    button.classList.add('copied');
    button.textContent = '✓ コピー完了';

    setTimeout(() => {
      statusEl.classList.remove('show');
      button.classList.remove('copied');
      button.textContent = 'コピー';
    }, 2000);
  }).catch(err => {
    console.error('コピー失敗:', err);
  });
}

window.addEventListener('load', () => {
  generatePassword();
});

document.getElementById('password-length').addEventListener('input', (e) => {
  document.getElementById('length-value').textContent = e.target.value;
});

document.getElementById('use-uppercase').addEventListener('change', generatePassword);
document.getElementById('use-lowercase').addEventListener('change', generatePassword);
document.getElementById('use-numbers').addEventListener('change', generatePassword);
document.getElementById('use-symbols').addEventListener('change', generatePassword);
document.getElementById('password-length').addEventListener('change', generatePassword);

// ==================== ランダムテキスト生成 ====================
function getCharacterSet(type) {
  const sets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    hex: '0123456789ABCDEF',
    custom: document.getElementById('custom-characters').value
  };
  return sets[type] || sets.alphanumeric;
}

function generateRandomString(length, charset) {
  if (!charset || charset.length === 0) {
    alert('文字セットが空です');
    return '';
  }

  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += charset.charAt(randomValues[i] % charset.length);
  }

  return result;
}

function generateRandomText() {
  const textType = document.getElementById('text-type').value;
  const textLength = parseInt(document.getElementById('text-length').value);
  const lineCount = parseInt(document.getElementById('line-count').value);
  const uppercaseOutput = document.getElementById('uppercase-output').checked;

  const charset = getCharacterSet(textType);

  if (!charset || charset.length === 0) {
    alert('カスタム文字セットを入力してください');
    return;
  }

  let output = '';
  for (let i = 0; i < lineCount; i++) {
    let line = generateRandomString(textLength, charset);
    if (uppercaseOutput) {
      line = line.toUpperCase();
    }
    output += line + (i < lineCount - 1 ? '\n' : '');
  }

  document.getElementById('text-output').value = output;
}

function copyText() {
  const text = document.getElementById('text-output').value;
  if (!text) {
    alert('コピーするテキストがありません');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    const statusEl = document.getElementById('random-status');
    statusEl.textContent = 'テキストをコピーしました!';
    statusEl.classList.add('show');

    const button = event.target;
    button.classList.add('copied');
    button.textContent = '✓ コピー完了';

    setTimeout(() => {
      statusEl.classList.remove('show');
      button.classList.remove('copied');
      button.textContent = 'コピー';
    }, 2000);
  }).catch(err => {
    console.error('コピー失敗:', err);
  });
}

document.getElementById('text-type').addEventListener('change', (e) => {
  const customGroup = document.getElementById('custom-chars-group');
  if (e.target.value === 'custom') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
  }
});

document.getElementById('text-length').addEventListener('input', (e) => {
  document.getElementById('text-length-value').textContent = e.target.value;
});

window.addEventListener('load', () => {
  generateRandomText();
});

document.getElementById('text-type').addEventListener('change', generateRandomText);
document.getElementById('text-length').addEventListener('change', generateRandomText);
document.getElementById('line-count').addEventListener('change', generateRandomText);
document.getElementById('uppercase-output').addEventListener('change', generateRandomText);
document.getElementById('custom-characters').addEventListener('input', generateRandomText);
