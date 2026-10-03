const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseButton = document.getElementById('browseButton');
const preview = document.getElementById('imagePreview');
const emptyGuide = document.getElementById('emptyGuide');
const resultGuide = document.getElementById('resultGuide');
const analysisState = document.querySelector('.analysis-state');
const taxonSelect = document.getElementById('taxonSelect');
const analyzeButton = document.getElementById('analyzeButton');
const uploadStatus = document.getElementById('uploadStatus');
const selectedGroup = document.getElementById('selectedGroup');
const groupTip = document.getElementById('groupTip');
const analysisSummary = document.getElementById('analysisSummary');
const loadedImage = new Image();
let photoReady = false;

const groupTips = {
  '관속식물': '잎맥과 잎 가장자리가 보이도록 그림자를 조금 밝게 해보세요.', '선태류': '작은 잎의 배열이 보이도록 선명도를 조금 높여보세요.',
  '포유류': '털의 무늬와 얼굴 윤곽이 드러나는 부분을 밝게 해보세요.', '조류': '눈, 부리, 깃의 무늬가 보이도록 하이라이트를 낮춰보세요.',
  '파충류': '비늘의 질감이 드러나도록 선명도를 조금 높여보세요.', '양서류': '피부 무늬가 남도록 색온도를 중립에 가깝게 조정해보세요.',
  '어류': '지느러미와 체색이 보이도록 푸른 기운을 줄여보세요.', '곤충': '날개맥과 더듬이가 보이도록 대비를 조금 높여보세요.',
  '거미류': '다리의 배열이 보이도록 배경 그림자를 밝게 해보세요.', '갑각류': '갑각의 무늬와 부속지가 보이도록 선명도를 높여보세요.',
  '연체동물': '패각의 무늬나 촉수가 보이도록 하이라이트를 낮춰보세요.', '기타동물': '형태적 특징이 잘 보이도록 피사체 주변을 가볍게 크롭해보세요.',
  '균류/지의류': '갓과 표면 질감이 보이도록 그림자를 조금 밝게 해보세요.', '조류(algae)': '몸체의 갈라짐과 색이 보이도록 대비를 조금 높여보세요.',
  '기타': '구분에 중요한 부분이 보이도록 그림자를 조금 밝게 해보세요.'
};

function updateButton() { analyzeButton.disabled = !(photoReady && taxonSelect.value); }

function loadPhoto(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (file.size > 20 * 1024 * 1024) { uploadStatus.textContent = '20MB 이하의 이미지를 선택해 주세요.'; return; }
  const reader = new FileReader();
  reader.onload = () => {
    loadedImage.onload = () => {
      preview.replaceChildren(loadedImage.cloneNode());
      photoReady = true;
      analysisState.textContent = '분석 준비 완료';
      uploadStatus.textContent = `${file.name} · 사진 준비 완료`;
      updateButton();
    };
    loadedImage.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function imageMetrics(image) {
  const size = 240;
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0; let sumSquares = 0; let shadows = 0; let highlights = 0; let saturationSum = 0; let count = 0;
  for (let index = 0; index < data.length; index += 16) {
    const red = data[index]; const green = data[index + 1]; const blue = data[index + 2];
    const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
    const maximum = Math.max(red, green, blue); const minimum = Math.min(red, green, blue);
    sum += luminance; sumSquares += luminance ** 2; shadows += luminance < 0.22 ? 1 : 0;
    highlights += luminance > 0.85 ? 1 : 0; saturationSum += maximum ? (maximum - minimum) / maximum : 0; count += 1;
  }
  const brightness = sum / count;
  return { brightness, contrast: Math.sqrt(sumSquares / count - brightness ** 2), shadows: shadows / count, highlights: highlights / count, saturation: saturationSum / count };
}

function formatAdjustment(value, decimals = 0) { return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}`; }
function setMeter(id, value) { document.getElementById(id).style.width = `${Math.round(Math.max(8, Math.min(100, value * 100)))}%`; }

function analyzePhoto() {
  if (!photoReady || !taxonSelect.value) return;
  analysisState.textContent = '사진 분석 중';
  analyzeButton.disabled = true;
  window.setTimeout(() => {
    const metrics = imageMetrics(loadedImage);
    const exposureAdjustment = (0.53 - metrics.brightness) * 2.1;
    const contrastAdjustment = (0.2 - metrics.contrast) * 115;
    const highlightAdjustment = -metrics.highlights * 90;
    const shadowAdjustment = (0.18 - metrics.shadows) * 80;
    const textureAdjustment = Math.max(5, Math.min(35, (0.23 - metrics.contrast) * 120));
    const vibranceAdjustment = Math.max(-15, Math.min(25, (0.42 - metrics.saturation) * 75));
    selectedGroup.textContent = taxonSelect.value;
    groupTip.textContent = `01  ${groupTips[taxonSelect.value]}`;
    analysisSummary.innerHTML = metrics.brightness < 0.38
      ? '<b>조금 어두운 사진이에요.</b><br />Lightroom의 노출과 그림자를 올려 관찰 특징을 더 드러내 보세요.'
      : metrics.brightness > 0.72
        ? '<b>밝은 영역이 많은 사진이에요.</b><br />Lightroom의 하이라이트를 낮추면 표면의 색과 결을 지킬 수 있어요.'
        : '<b>밝기의 균형이 좋은 사진이에요.</b><br />Lightroom의 대비와 텍스처를 조절해 관찰 기록을 더 선명하게 남겨보세요.';
    setMeter('brightnessMeter', (exposureAdjustment + 2) / 4); setMeter('contrastMeter', (contrastAdjustment + 100) / 200);
    setMeter('highlightMeter', (highlightAdjustment + 100) / 200); setMeter('shadowMeter', (shadowAdjustment + 100) / 200);
    setMeter('textureMeter', (textureAdjustment + 100) / 200); setMeter('vibranceMeter', (vibranceAdjustment + 100) / 200);
    document.getElementById('brightnessValue').textContent = formatAdjustment(exposureAdjustment, 1);
    document.getElementById('contrastValue').textContent = formatAdjustment(contrastAdjustment);
    document.getElementById('highlightValue').textContent = formatAdjustment(highlightAdjustment);
    document.getElementById('shadowValue').textContent = formatAdjustment(shadowAdjustment);
    document.getElementById('textureValue').textContent = formatAdjustment(textureAdjustment);
    document.getElementById('vibranceValue').textContent = formatAdjustment(vibranceAdjustment);
    emptyGuide.hidden = true; resultGuide.hidden = false;
    analysisState.textContent = '분석 완료'; updateButton();
  }, 350);
}

function openFilePicker(event) { event?.stopPropagation(); fileInput.click(); }
dropZone.addEventListener('click', openFilePicker);
dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFilePicker(event); } });
browseButton.addEventListener('click', openFilePicker);
fileInput.addEventListener('change', event => loadPhoto(event.target.files[0]));
taxonSelect.addEventListener('change', updateButton);
analyzeButton.addEventListener('click', analyzePhoto);
['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone.addEventListener('drop', event => loadPhoto(event.dataTransfer.files[0]));
