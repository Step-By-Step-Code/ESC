// ----- 전역 변수 설정 -----
let serialPort, writer, reader;
let modeText = "N/A";
let redSlider, yellowSlider, greenSlider;
let redState = 0, yellowState = 0, greenState = 0, Brightness = 255;
let gestureSignal = 0; // 제스처 신호 저장 (0~5)

let handPose, video, hands = [];

// UI 영역과 카메라 영역의 크기 설정
const uiWidth = 500;
const videoWidth = 640;
const canvasHeight = 480;
const canvasWidth = uiWidth + videoWidth; // 500 + 640 = 1140

const OK_THRESHOLD = 40; // "OK 사인" 인식 시, 엄지-검지 tip 사이가 이 값보다 작으면 OK로 간주

// ----- ml5 HandPose 프리로드 -----
function preload() {handPose = ml5.handPose();}

function setup() {
  createCanvas(canvasWidth, canvasHeight);

  // 아두이노 연결 UI (DOM 요소)
  let connectButton = createButton("Connect to Arduino");
  connectButton.position(10, 10);
  connectButton.mousePressed(connectToArduino);

  // 슬라이더 생성 (범위: 500 ~ 3500, 기본값 및 증감 단위)
  redSlider = createSlider(500, 3500, 2000, 100);
  redSlider.position(10, 100);
  yellowSlider = createSlider(500, 3500, 500, 100);
  yellowSlider.position(10, 130);
  greenSlider = createSlider(500, 3500, 2000, 100);
  greenSlider.position(10, 160);

  // 슬라이더가 변경될 때마다 데이터 전송
  redSlider.input(sendData);
  yellowSlider.input(sendData);
  greenSlider.input(sendData);

  // 카메라 캡쳐 및 handPose 초기화
  video = createCapture(VIDEO, { flipped: true });
  video.size(videoWidth, canvasHeight);
  video.hide();
  handPose.detectStart(video, gotHands); // 손 인식 시작

  // 1초마다 제스처 확인
  setInterval(checkGesture, 1000);
}

// ----- draw() -----
// 캔버스를 좌우 영역으로 나누어 왼쪽은 UI, 오른쪽은 카메라 영상 및 손 인식 결과 표시
function draw() {
  background(220);
  // 왼쪽 UI 영역 그리기
  push();
  drawUI();
  pop();
  // 오른쪽 카메라 영역 그리기
  push();
  translate(uiWidth, 0); // 오른쪽 영역으로 이동
  drawCamera();
  pop();
}

// UI 관련 그리기 함수
function drawUI() {
  textSize(16);
  fill('black');
  text("빨강 시간: " + redSlider.value() + " ms", 150, 115);
  text("노랑 시간: " + yellowSlider.value() + " ms", 150, 145);
  text("초록 시간: " + greenSlider.value() + " ms", 150, 175);
  text("현재 모드: " + modeText, 10, 250);
  text("현재 밝기: " + Brightness, 10, 270);
  drawTrafficLight();
}

// 신호등 그리기 함수 (UI 영역 내에서)
function drawTrafficLight() {
  let size = 30;    // 원 크기
  let spacing = 50; // 원 간격
  
  fill(redState ? 'red' : 'gray');
  ellipse(180, 240, size, size);
  
  fill(yellowState ? 'yellow' : 'gray');
  ellipse(180 + spacing, 240, size, size);
  
  fill(greenState ? 'green' : 'gray');
  ellipse(180 + spacing * 2, 240, size, size);
}

// 카메라 영상 및 손 인식 결과 그리기 함수 (오른쪽 영역)
function drawCamera() {
  image(video, 0, 0, videoWidth, canvasHeight);
  
  // 손의 각 keypoint를 원으로 표시 (x좌표는 좌우 반전)
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill(255, 0, 0); // 빨간색
      noStroke(); // 테두리 없앰
      circle(videoWidth - keypoint.x, keypoint.y, 10); // 원 그리기
    }
  }
  
  // (참고용) 인식된 제스처를 화면에 표시
  if (hands.length > 0) {
    let hand = hands[0];
    let gestureCode = determineGesture(hand); // 제스처 결정 함수
    if (gestureCode !== null) {
      textSize(32);
      fill(0, 255, 0);
      text("Gesture: " + gestureCode, 10, 30);
    }
  }
}

// 1초마다 호출되어 제스처를 확인하는 함수
function checkGesture() {
  if (hands.length > 0) {
    let hand = hands[0];
    let gestureCode = determineGesture(hand);
    if (gestureCode == 0 || gestureCode == 3 || gestureCode == 1 || gestureCode == 2) {
      gestureSignal = gestureCode;
      sendData();
    }
    else if(gestureCode == 4){
      redSlider.value(Math.min(redSlider.value() + 100, 3500));
      yellowSlider.value(Math.min(yellowSlider.value() + 100, 3500));
      greenSlider.value(Math.min(greenSlider.value() + 100, 3500));
      sendData();
    }
    else if(gestureCode == 5){
      redSlider.value(Math.max(redSlider.value() - 100, 500));
      yellowSlider.value(Math.max(yellowSlider.value() - 100, 500));
      greenSlider.value(Math.max(greenSlider.value() - 100, 500));
      sendData();
    }
  }
}

// 거리 계산 함수
function dist2D(p1, p2) {
  return sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// 손바닥(앞면) / 손등(뒷면)을 판별하는 함수
// Mediapipe HandPose 기준 keypoints: 0-손목, 5-검지 뿌리, 17-새끼 뿌리
function isPalmFacing(hand) {
  let kp = hand.keypoints;
  let v1 = { x: kp[5].x - kp[0].x, y: kp[5].y - kp[0].y };
  let v2 = { x: kp[17].x - kp[0].x, y: kp[17].y - kp[0].y };
  let cross = v1.x * v2.y - v1.y * v2.x;
  return cross < 0;  // cross > 0 → 손바닥, cross < 0 → 손등
}

// "OK 사인" 확인 함수
// 엄지 tip(4)와 검지 tip(8) 사이 거리가 OK_THRESHOLD 이하이며,
// 중지(12), 약지(16), 새끼(20)는 펴진 상태여야 함
function isOkSign(kp) {
  let thumbIndexDist = dist2D(kp[4], kp[8]);
  let middleExtended = kp[12].y < kp[10].y;
  let ringExtended   = kp[16].y < kp[14].y;
  let pinkyExtended  = kp[20].y < kp[18].y;
  return (
    thumbIndexDist < OK_THRESHOLD &&
    middleExtended && ringExtended && pinkyExtended
  );
}

// "엄지만 핀 상태" 확인 함수 (오직 엄지만 펴짐)
function isOnlyThumb(kp) {
  let wrist = kp[0];
  let thumbExtended  = dist2D(kp[4], wrist) > dist2D(kp[2], wrist);
  let indexExtended  = kp[8].y  < kp[6].y;
  let middleExtended = kp[12].y < kp[10].y;
  let ringExtended   = kp[16].y < kp[14].y;
  let pinkyExtended  = kp[20].y < kp[18].y;
  return (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended);
}

// 제스처 판단 함수
// 반환 값:  
//   0: 샤카 (손바닥 보임), 3: 샤카 (손등 보임) || 1: 오픈핸드 (손바닥), 2: 오픈핸드 (손등)
//   4: OK 사인  || 5: 엄지만 펴고 아래로 향함
function determineGesture(hand) {
  let kp = hand.keypoints;
  let wrist = kp[0];

  let thumbExtended  = dist2D(kp[4], wrist) > dist2D(kp[2], wrist);
  let indexExtended  = kp[8].y  < kp[6].y; // 검지 tip이 검지 관절보다 위에 있을 경우 (index up)
  let middleExtended = kp[12].y < kp[10].y; // 중지 tip이 중지 관절보다 위에 있을 경우 (middle up)
  let ringExtended   = kp[16].y < kp[14].y; // 약지 tip이 약지 관절보다 위에 있을 경우 (ring up)
  let pinkyExtended  = kp[20].y < kp[18].y; // 새끼 tip이 새끼 관절보다 위에 있을 경우 (pinky up)

  let isShaka = (thumbExtended && pinkyExtended && !indexExtended && !middleExtended && !ringExtended); // 샤카: 엄지와 새끼만 펴짐
  let isOpenHand = (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended); // 오픈핸드: 모든 손가락 펴짐
  let okSign = isOkSign(kp); // OK 사인
  let onlyThumb = isOnlyThumb(kp); // 엄지만 펴진 상태
  let thumbDown = (kp[4].y > kp[2].y); // 엄지 tip이 엄지 관절(2)보다 아래에 있을 경우 (thumb down)

  if (isShaka) return isPalmFacing(hand) ? 3 : 0;
  else if (isOpenHand) return isPalmFacing(hand) ? 1 : 2;
  else if (okSign) return 4;
  else if (onlyThumb && thumbDown) return 5;
  return null;
}

// ----- 아두이노와의 시리얼 통신 관련 함수 -----
async function connectToArduino() {
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    writer = serialPort.writable.getWriter();
    reader = serialPort.readable.getReader();
    console.log("Connected to Arduino!");
    readData();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

// 슬라이더 값과 제스처 신호를 함께 전송하는 함수
async function sendData() {
  if (writer) {
    let data = `${redSlider.value()},${yellowSlider.value()},${greenSlider.value()},${gestureSignal}\n`;
    const dataArray = new TextEncoder().encode(data);
    await writer.write(dataArray);
    console.log("Sent:", data);
  } else {
    console.log("Serial connection not established.");
  }
}

async function readData() {
  let dataBuffer = "";
  while (serialPort.readable) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      let chunk = new TextDecoder().decode(value);
      dataBuffer += chunk;
      let lines = dataBuffer.split("\n");
      while (lines.length > 1) {
        let completeLine = lines.shift().trim();
        processData(completeLine);
      }
      dataBuffer = lines[0];
    } catch (err) {
      console.error("Read error:", err);
    }
  }
}

function processData(data) {
  if (data) {
    let parts = data.split(",");
    if (parts.length === 5) {
      modeText = parts[0];
      redState = parseInt(parts[1]);
      yellowState = parseInt(parts[2]);
      greenState = parseInt(parts[3]);
      Brightness = parseInt(parts[4]);
    }
  }
}
// ----- ml5 handPose 결과 콜백 -----
function gotHands(results) {
  hands = results;
}