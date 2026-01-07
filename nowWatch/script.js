/* ===== 時計 ===== */
const baseDate = Date.now();
const basePerf = performance.now();

function updateClock() {
  const nowMs = baseDate + (performance.now() - basePerf);
  const d = new Date(nowMs);

  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  const s = String(d.getSeconds()).padStart(2,'0');
  const ms = String(d.getMilliseconds()).padStart(3,'0');

  document.getElementById('clock').innerHTML =
    `${h}:${m}:${s}<span class="ms">.${ms}</span>`;
}

/* ===== タイマー ===== */
let t0 = null, p0 = null;
let running = false;
let frozen = 0;

function startTimer() {
  if (!running) {
    t0 = Date.now() - frozen;
    p0 = performance.now();
    running = true;
  }
}

function stopTimer() {
  if (running) {
    frozen = elapsed();
    running = false;
  }
}

function resetTimer() {
  running = false;
  frozen = 0;
  document.getElementById('timer').textContent = "0.000";
}

function elapsed() {
  if (!running) return frozen;
  return (Date.now() - t0) + (performance.now() - p0);
}

function updateTimer() {
  document.getElementById('timer').textContent =
    (elapsed() / 1000).toFixed(3);
}

/* ===== コピー（共通） ===== */
function copyText(id) {
  const el = document.getElementById(id);
  const status = document.getElementById(id + "-status");
  const button = event.target;

  const text = el.value ?? el.innerText;

  navigator.clipboard.writeText(text).then(() => {
    status.classList.add("show");
    button.classList.add("copied");
    const original = button.textContent;
    button.textContent = "コピー済";

    setTimeout(() => {
      status.classList.remove("show");
      button.classList.remove("copied");
      button.textContent = original;
    }, 1200);
  });
}

/* ===== メモ ===== */
const MEMO_KEY = "simple-memo";

function saveMemo() {
  localStorage.setItem(MEMO_KEY,
    document.getElementById('memo').value);
}

function clearMemo() {
  document.getElementById('memo').value = "";
  localStorage.removeItem(MEMO_KEY);
}

/* 復元 */
document.getElementById('memo').value =
  localStorage.getItem(MEMO_KEY) ?? "";

/* ===== ループ ===== */
function loop() {
  updateClock();
  updateTimer();
  requestAnimationFrame(loop);
}
loop();