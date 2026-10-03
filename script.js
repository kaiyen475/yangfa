const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseButton = document.getElementById('browseButton');
const preview = document.getElementById('imagePreview');
const emptyGuide = document.getElementById('emptyGuide');
const resultGuide = document.getElementById('resultGuide');
const analysisState = document.querySelector('.analysis-state');
const taxonSelect = document.getElementById('taxonSelect');
const selectedGroup = document.getElementById('selectedGroup');
const groupTip = document.getElementById('groupTip');

const groupTips = {
  '관속식물': '01  잎맥과 잎 가장자리가 보이도록 그림자를 조금 밝게 해보세요.',
  '선태류': '01  작은 잎의 배열이 보이도록 선명도를 조금 높여보세요.',
  '포유류': '01  털의 무늬와 얼굴 윤곽이 드러나는 부분을 밝게 해보세요.',
  '조류': '01  눈, 부리, 깃의 무늬가 보이도록 하이라이트를 낮춰보세요.',
  '파충류': '01  비늘의 질감이 드러나도록 선명도를 조금 높여보세요.',
  '양서류': '01  피부 무늬가 남도록 색온도를 중립에 가깝게 조정해보세요.',
  '어류': '01  지느러미와 체색이 보이도록 푸른 기운을 줄여보세요.',
  '곤충': '01  날개맥과 더듬이가 보이도록 대비를 조금 높여보세요.',
  '거미류': '01  다리의 배열이 보이도록 배경 그림자를 밝게 해보세요.',
  '갑각류': '01  갑각의 무늬와 부속지가 보이도록 선명도를 높여보세요.',
  '연체동물': '01  패각의 무늬나 촉수가 보이도록 하이라이트를 낮춰보세요.',
  '기타동물': '01  형태적 특징이 잘 보이도록 피사체 주변을 가볍게 크롭해보세요.',
  '균류/지의류': '01  갓과 표면 질감이 보이도록 그림자를 조금 밝게 해보세요.',
  '조류(algae)': '01  몸체의 갈라짐과 색이 보이도록 대비를 조금 높여보세요.',
  '기타': '01  구분에 중요한 부분이 보이도록 그림자를 조금 밝게 해보세요.'
};

function updateGroup() {
  const group = taxonSelect.value;
  selectedGroup.textContent = group;
  groupTip.innerHTML = groupTips[group];
}

function analyze(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}" alt="업로드한 생물 사진 미리보기">`;
    analysisState.textContent = '분석 완료';
    emptyGuide.hidden = true;
    resultGuide.hidden = false;
    if (!taxonSelect.value) taxonSelect.focus();
  };
  reader.readAsDataURL(file);
}

function openFilePicker(event) {
  event?.stopPropagation();
  fileInput.click();
}

dropZone.addEventListener('click', openFilePicker);
dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') openFilePicker(event); });
browseButton.addEventListener('click', openFilePicker);
fileInput.addEventListener('change', event => analyze(event.target.files[0]));
taxonSelect.addEventListener('change', updateGroup);
['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone.addEventListener('drop', event => analyze(event.dataTransfer.files[0]));
