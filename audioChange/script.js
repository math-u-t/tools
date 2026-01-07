let mediaRecorder;
let audioContext;
let analyser;
let recordedChunks = [];
let recordingStartTime = 0;
let timerInterval;
let audioBlob;
let savedRecordings = [];

// 初期化
async function initAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      recordedChunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
      displayRecording();
      loadSavedRecordings();
    };
    
    startVisualizer();
    loadSavedRecordings();
  } catch (error) {
    alert('マイクへのアクセスが許可されていません\n\nマイクを有効にしてください');
    console.error('Audio initialization error:', error);
  }
}

function startVisualizer() {
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  
  function draw() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / dataArray.length * 2.5;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      ctx.fillStyle = `hsl(${(i / dataArray.length) * 360}, 100%, 50%)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    
    requestAnimationFrame(draw);
  }
  
  draw();
}

function updateVolumeMeter() {
  if (!analyser) return;
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
  const volume = Math.min(100, (average / 255) * 200);
  
  document.getElementById('volume-fill').style.width = volume + '%';
}

function startRecording() {
  if (mediaRecorder.state === 'recording') return;
  
  recordedChunks = [];
  recordingStartTime = Date.now();
  mediaRecorder.start();
  
  document.getElementById('record-btn').disabled = true;
  document.getElementById('stop-btn').disabled = false;
  document.getElementById('status-indicator').classList.add('recording');
  document.getElementById('status-text').textContent = '録音中...';
  
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent = 
      String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    
    updateVolumeMeter();
  }, 100);
}

function stopRecording() {
  mediaRecorder.stop();
  clearInterval(timerInterval);
  
  document.getElementById('record-btn').disabled = false;
  document.getElementById('stop-btn').disabled = true;
  document.getElementById('status-indicator').classList.remove('recording');
  document.getElementById('status-text').textContent = '準備完了';
  document.getElementById('timer').textContent = '00:00';
}

function resetRecording() {
  recordedChunks = [];
  audioBlob = null;
  document.getElementById('no-recording').style.display = 'block';
  document.getElementById('recording-info').style.display = 'none';
  clearInterval(timerInterval);
}

function displayRecording() {
  const duration = audioBlob.size > 0 ? audioBlob.duration || 0 : 0;
  
  document.getElementById('no-recording').style.display = 'none';
  document.getElementById('recording-info').style.display = 'block';
  
  const fileSize = (audioBlob.size / 1024).toFixed(2) + ' KB';
  document.getElementById('file-size').textContent = fileSize;
  document.getElementById('filename').value = 'recording_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  const audioUrl = URL.createObjectURL(audioBlob);
  const audioPlayer = document.getElementById('audio-player');
  audioPlayer.src = audioUrl;
  
  audioPlayer.addEventListener('loadedmetadata', () => {
    const totalSeconds = Math.floor(audioPlayer.duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    document.getElementById('duration-display').textContent = timeStr;
    document.getElementById('total-time').textContent = timeStr;
  });
  
  audioPlayer.addEventListener('timeupdate', () => {
    const currentSeconds = Math.floor(audioPlayer.currentTime);
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    document.getElementById('current-time').textContent = 
      String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progress-fill').style.width = percent + '%';
  });
  
  audioPlayer.addEventListener('ended', () => {
    document.getElementById('play-btn').style.display = 'block';
    document.getElementById('pause-btn').style.display = 'none';
  });
  
  document.querySelector('.progress-bar').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
  });
}

function playAudio() {
  const audioPlayer = document.getElementById('audio-player');
  audioPlayer.play();
  document.getElementById('play-btn').style.display = 'none';
  document.getElementById('pause-btn').style.display = 'block';
}

function pauseAudio() {
  const audioPlayer = document.getElementById('audio-player');
  audioPlayer.pause();
  document.getElementById('play-btn').style.display = 'block';
  document.getElementById('pause-btn').style.display = 'none';
}

function downloadAudio() {
  if (!audioBlob) return;
  
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = document.getElementById('filename').value + '.webm';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyAudioUrl() {
  if (!audioBlob) return;
  
  const url = URL.createObjectURL(audioBlob);
  navigator.clipboard.writeText(url).then(() => {
    alert('URLをコピーしました');
  });
}

function saveToLocalStorage() {
  const filename = document.getElementById('filename').value;
  if (!filename || !audioBlob) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
    recordings.push({
      name: filename,
      data: e.target.result,
      timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('audioRecordings', JSON.stringify(recordings));
    loadSavedRecordings();
  };
  reader.readAsDataURL(audioBlob);
}

function loadSavedRecordings() {
  const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
  const savedList = document.getElementById('saved-list');
  
  if (recordings.length === 0) {
    savedList.innerHTML = '<p class="empty-message">保存された音声がありません</p>';
    return;
  }
  
  savedList.innerHTML = recordings.map((rec, idx) => `
    <div class="saved-item">
      <div class="saved-item-info">
        <div class="saved-item-name">${rec.name}</div>
        <div class="saved-item-time">${rec.timestamp}</div>
      </div>
      <div class="saved-item-buttons">
        <button onclick="playSavedAudio(${idx})">再生</button>
        <button onclick="deleteSavedAudio(${idx})">削除</button>
      </div>
    </div>
  `).join('');
}

function playSavedAudio(idx) {
  const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
  const recording = recordings[idx];
  
  const player = new Audio(recording.data);
  player.play();
}

function deleteSavedAudio(idx) {
  if (!confirm('削除しますか？')) return;
  
  const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
  recordings.splice(idx, 1);
  localStorage.setItem('audioRecordings', JSON.stringify(recordings));
  loadSavedRecordings();
}

window.addEventListener('load', initAudio);
