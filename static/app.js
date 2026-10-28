const images = [
  { src: '/static/images/slide-1.svg', title: 'Dawn Signal' },
  { src: '/static/images/slide-2.svg', title: 'Soft Horizon' },
  { src: '/static/images/slide-3.svg', title: 'Solar Field' },
  { src: '/static/images/slide-4.svg', title: 'Night Current' },
  { src: '/static/images/slide-5.svg', title: 'Final Light' },
];

const video = document.querySelector('#camera');
const canvas = document.querySelector('#landmarks');
const ctx = canvas.getContext('2d');
const cameraButton = document.querySelector('#camera-button');
const placeholder = document.querySelector('#camera-placeholder');
const status = document.querySelector('.status');
const statusText = document.querySelector('#status-text');
const gestureLabel = document.querySelector('#gesture-label');
const galleryImage = document.querySelector('#gallery-image');
const imageStage = document.querySelector('.image-stage');
const imageTitle = document.querySelector('#image-title');
const counter = document.querySelector('#counter');
let index = 0;
let stream;
let recognizer;
let lastPalmX = null;
let lastActionAt = 0;
let imageFlipped = false;

function showImage(nextIndex) {
  index = Math.max(0, Math.min(images.length - 1, nextIndex));
  galleryImage.src = images[index].src;
  imageTitle.textContent = images[index].title;
  counter.textContent = `${index + 1} / ${images.length}`;
}
function move(step) { showImage(index + step); }
document.querySelector('#prev-button').addEventListener('click', () => move(-1));
document.querySelector('#next-button').addEventListener('click', () => move(1));

function canAct() {
  const now = performance.now();
  if (now - lastActionAt < 900) return false;
  lastActionAt = now;
  return true;
}
function fingerUp(landmarks, tip, pip) { return landmarks[tip].y < landmarks[pip].y - 0.035; }
function palmOrBack(hand, handedness) {
  // MediaPipe hands are classified from the unmirrored camera frame. The
  // thumb's side relative to the index MCP distinguishes palm from back.
  const thumbX = hand[4].x;
  const indexMcpX = hand[5].x;
  const isRight = handedness.toLowerCase().includes('right');
  const palmFacingCamera = isRight ? thumbX < indexMcpX : thumbX > indexMcpX;
  return palmFacingCamera ? '手心' : '手背';
}
function updatePalmOrientation(result) {
  const orientations = result.landmarks.map((hand, handIndex) => {
    const handedness = result.handednesses?.[handIndex]?.[0]?.categoryName || 'Right';
    return palmOrBack(hand, handedness);
  });
  const hasBack = orientations.includes('手背');
  imageFlipped = hasBack;
  imageStage.classList.toggle('flipped', imageFlipped);
  if (orientations.length) {
    gestureLabel.textContent = `${orientations.length} 手 · ${orientations.join(' / ')}${imageFlipped ? ' · 圖片已翻轉' : ''}`;
  }
}
function handleGesture(result) {
  if (!result.landmarks?.length) { gestureLabel.textContent = '等待手勢'; lastPalmX = null; imageStage.classList.remove('flipped'); return; }
  updatePalmOrientation(result);
  const hand = result.landmarks[0];
  const palmX = hand[9].x;
  const dx = lastPalmX === null ? 0 : palmX - lastPalmX;
  lastPalmX = palmX;
  const indexUp = fingerUp(hand, 8, 6);
  const pinkyUp = fingerUp(hand, 20, 18);
  if (indexUp && !pinkyUp) { gestureLabel.textContent = '食指 → 第一張'; if (canAct()) showImage(0); return; }
  if (pinkyUp && !indexUp) { gestureLabel.textContent = '小指 → 最後一張'; if (canAct()) showImage(images.length - 1); return; }
  if (Math.abs(dx) > 0.018) { const direction = dx < 0 ? '左移 → 上一張' : '右移 → 下一張'; gestureLabel.textContent = direction; if (canAct()) move(dx < 0 ? -1 : 1); return; }
  gestureLabel.textContent = '手勢已辨識';
}

async function loadRecognizer() {
  const { FilesetResolver, GestureRecognizer } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
  const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm');
  recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task' },
    runningMode: 'VIDEO', numHands: 1,
  });
}
async function detectLoop() {
  if (video.readyState >= 2 && recognizer) {
    const result = recognizer.recognizeForVideo(video, performance.now());
    handleGesture(result);
    if (result.landmarks?.[0]) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight; ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e3f08b'; for (const point of result.landmarks[0]) { ctx.beginPath(); ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  requestAnimationFrame(detectLoop);
}
cameraButton.addEventListener('click', async () => {
  if (stream) { stream.getTracks().forEach((track) => track.stop()); stream = null; video.style.display = 'none'; placeholder.style.display = 'flex'; cameraButton.textContent = '啟用攝影機'; status.classList.remove('active'); statusText.textContent = '尚未啟用攝影機'; return; }
  try {
    cameraButton.disabled = true; cameraButton.textContent = '載入手勢模型…';
    await loadRecognizer();
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false });
    video.srcObject = stream; video.style.display = 'block'; placeholder.style.display = 'none';
    cameraButton.disabled = false; cameraButton.textContent = '關閉攝影機'; status.classList.add('active'); statusText.textContent = '攝影機運作中';
    detectLoop();
  } catch (error) { cameraButton.disabled = false; cameraButton.textContent = '啟用攝影機'; statusText.textContent = `無法啟用：${error.message}`; }
});
