let handPose;
let video;
let hands = [];
let okDetected = false;
let drawingLayer;
let lastPoints = []; // 각 손의 마지막 좌표를 저장하기 위한 배열
let shaking = false;
let blueCircles = [];
let redCircles = [];

function preload() { handPose = ml5.handPose({ flipped: true }); } // 모델 로드

function setup() {
  createCanvas(windowWidth, windowHeight); // 전체 화면 크기로 설정
  video = createCapture(VIDEO, { flipped: true }); // 비디오 캡처 생성 및 거울
  video.size(windowWidth, windowHeight); // 비디오 크기를 전체 화면 크기로 설정
  video.hide(); 
  handPose.detectStart(video, gotHands);
  
  drawingLayer = createGraphics(windowWidth, windowHeight);
  drawingLayer.clear();
}

function draw() {
  let threeFingersCount = 0; 
  let allFingersCount = 0; 
  let thumbIndexExtendedInRedSquare = false;
  let thumbIndexExtendedInBlueSquare = false;

  for (let i = 0; i < hands.length; i++) {
    // OK 제스처를 인식하기 전에 제스처 위치가 상자 내부인지 확인합니다.
    if (isOkSign(hands[i])) drawOkSign(hands[i], i);

    if (isShakaSign(hands[i])) {
      drawingLayer.clear(); // 오프스크린 레이어를 지워서 모든 선 삭제
      lastPoints = []; // 모든 손의 lastPoint 초기화
    }

    if (isThreeFingersExtended(hands[i])) threeFingersCount++; // 세 손가락이 펴진 손의 개수 세기
    if (areAllFingersExtended(hands[i])) allFingersCount++; // 다섯 손가락이 펴진 손의 개수 세기
   
    // 상자 안에 있는 손이고 엄지와 검지 손가락이 펴진 손인지 확인
    if (isThumbIndexExtended(hands[i]) && isHandInRedSquare(hands[i])) thumbIndexExtendedInRedSquare = true;
    if (isThumbIndexExtended(hands[i]) && isHandInBlueSquare(hands[i])) thumbIndexExtendedInBlueSquare = true;
  }
  
  if (threeFingersCount >= 2) shaking = true; // 세 손가락이 펴진 손이 두 개 이상이면 흔들림 상태로 설정
  
  if (allFingersCount >= 2) { // 모든 손가락이 펴진 손이 두 개 이상이면
    shaking = false; // 흔들림 상태 해제
    blueCircles = []; // 파란 원 초기화
    redCircles = []; // 빨간 원 초기화
  }

  if (shaking) { // 흔들기
    let shakeAmount = 20;
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
  }
  image(video, 0, 0, width, height); // 비디오 이미지 그리기
  
  drawHandKeypointsAndConnections(hands); // 손의 키포인트와 연결 그리기

  image(drawingLayer, 0, 0, width, height); // 오프스크린 레이어 그리기
  
  // 빨간 사각형 그리기
  fill(255, 0, 0, 122);
  let squareSize = height / 2;
  rect(0, height - squareSize, squareSize, squareSize);
  
  // 파란 사각형 그리기
  fill(0, 0, 255, 122);
  rect(width - squareSize, height - squareSize, squareSize, squareSize);
  
  // OK 제스처가 인식 중이 아니면 해당 손의 lastPoint를 초기화하여 새로운 선이 기존 선과 연결되지 않도록 함
  for (let i = 0; i < hands.length; i++) if (!isOkSign(hands[i])) lastPoints[i] = undefined;

  if (thumbIndexExtendedInRedSquare) { // 엄지와 검지 손가락이 펴진 손이 빨간 상자 안에 있으면
    let circleSize = random(10, 50);
    let x = random(0, width);
    let y = random(0, height);
    redCircles.push({ x, y, size: circleSize }); // 빨간 원 추가
  }

  for (let circle of redCircles) { // 빨간 원 그리기
    fill(255, 0, 0, 122);
    ellipse(circle.x, circle.y, circle.size);
  }

  if (thumbIndexExtendedInBlueSquare) { // 엄지와 검지 손가락이 펴진 손이 파란 상자 안에 있으면
    let circleSize = random(10, 50);
    let x = random(0, width);
    let y = random(0, height);
    blueCircles.push({ x, y, size: circleSize }); // 파란 원 추가
  }

  for (let circle of blueCircles) { // 파란 원 그리기
    fill(0, 0, 255, 122);
    ellipse(circle.x, circle.y, circle.size); 
  }
}

function drawHandKeypointsAndConnections(hands) {
  // 손가락 연결 인덱스 배열 (엄지, 검지, 중지, 약지, 새끼손가락)
  const fingerConnections = [
    [0, 1, 2, 3, 4],    // 엄지
    [0, 5, 6, 7, 8],    // 검지
    [0, 9, 10, 11, 12], // 중지
    [0, 13, 14, 15, 16],// 약지
    [0, 17, 18, 19, 20] // 새끼손가락
  ];

  // 각 손에 대해 작업 진행
  for (let i = 0; i < hands.length; i++) {
    // 손의 각 손가락 연결 부분에 초록색 선 그리기
    stroke(0, 255, 0);
    strokeWeight(3);
    for (let finger of fingerConnections) {
      for (let k = 0; k < finger.length - 1; k++) {
        let pointA = hands[i].keypoints[finger[k]];
        let pointB = hands[i].keypoints[finger[k + 1]];
        line(pointA.x, pointA.y, pointB.x, pointB.y);
      }
    }

    // 각 키포인트에 대해 초록색 글로우 효과와 빨간색 마커 추가
    for (let j = 0; j < hands[i].keypoints.length; j++) {
      let keypoint = hands[i].keypoints[j];

      // 초록색 키포인트 그리기 (내부 원)
      noStroke();
      fill(0, 255, 0);
      ellipse(keypoint.x, keypoint.y, 12, 12);

      // 초록색 글로우 효과 (원형 그림자)
      for (let r = 16; r <= 30; r += 4) {
        fill(0, 255, 0, map(r, 16, 30, 150, 0));
        ellipse(keypoint.x, keypoint.y, r, r);
      }

      // 초록색 외곽선 하이라이트
      noFill();
      stroke(0, 255, 0, 200);
      strokeWeight(2);
      ellipse(keypoint.x, keypoint.y, 32, 32);

      // 빨간색 키포인트 마커 (더 작은 원)
      noStroke();
      fill(255, 0, 0);
      ellipse(keypoint.x, keypoint.y, 8, 8);
    }
  }
}

function drawOkSign(hand, handIndex) {
  // 엄지와 검지 끝의 중간 지점 계산
  let midX = (hand.keypoints[4].x + hand.keypoints[8].x) / 2;
  let midY = (hand.keypoints[4].y + hand.keypoints[8].y) / 2;
  let currentPoint = { x: midX, y: midY }; // 중간 지점을 현재 점으로 설정
  
  // lastPoint가 존재하면 두 점을 연결하여 선 그리기
  if (lastPoints[handIndex]) {
    drawingLayer.stroke(255); // 기본 흰색
    drawingLayer.strokeWeight(20); // 글씨 두께
    drawingLayer.line(lastPoints[handIndex].x, lastPoints[handIndex].y, currentPoint.x, currentPoint.y);
  }
  // 현재 점을 lastPoint로 업데이트
  lastPoints[handIndex] = currentPoint;
}
/* 
  isOkSign, isShakaSign, isThreeFingersExtended, areAllFingersExtended, isThumbIndexExtended 함수 구현
  dist를 활용하여 두 점 사이의 거리를 계산하는 함수
  dist(x1, y1, x2, y2) => (x1, y1)과 (x2, y2) 사이의 거리를 반환
  방향과 상관없이 인식할 수 있게 구현
*/
function isOkSign(hand) { // OK 제스처를 인식하는 함수
  let thumbTip = hand.keypoints[4];
  let indexTip = hand.keypoints[8];
  let d = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y); // 엄지 끝과 검지 끝 사이의 거리 계산
  let okThreshold = 70;

  let wrist = hand.keypoints[0];
  // 중지, 약지, 소지 손가락이 펴져 있는지 확인
  let middleExtended = dist(hand.keypoints[12].x, hand.keypoints[12].y, wrist.x, wrist.y) > 
                       dist(hand.keypoints[10].x, hand.keypoints[10].y, wrist.x, wrist.y);
  let ringExtended   = dist(hand.keypoints[16].x, hand.keypoints[16].y, wrist.x, wrist.y) > 
                       dist(hand.keypoints[14].x, hand.keypoints[14].y, wrist.x, wrist.y);
  let pinkyExtended  = dist(hand.keypoints[20].x, hand.keypoints[20].y, wrist.x, wrist.y) > 
                       dist(hand.keypoints[18].x, hand.keypoints[18].y, wrist.x, wrist.y);
  
  return (d < okThreshold && middleExtended && ringExtended && pinkyExtended);
}
function isShakaSign(hand) { // 샤카 제스처를 인식하는 함수
  let wrist = hand.keypoints[0];

  // 엄지, 새끼 손가락이 펴져 있는지 확인
  let thumbExtended = dist(hand.keypoints[4].x, hand.keypoints[4].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[3].x, hand.keypoints[3].y, wrist.x, wrist.y);
  let pinkyExtended = dist(hand.keypoints[20].x, hand.keypoints[20].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[19].x, hand.keypoints[19].y, wrist.x, wrist.y);
  // 검지, 중지, 약지 손가락이 접혀 있는지 확인
  let indexFolded = dist(hand.keypoints[8].x, hand.keypoints[8].y, wrist.x, wrist.y) < 
                    dist(hand.keypoints[7].x, hand.keypoints[7].y, wrist.x, wrist.y);
  let middleFolded = dist(hand.keypoints[12].x, hand.keypoints[12].y, wrist.x, wrist.y) < 
                     dist(hand.keypoints[11].x, hand.keypoints[11].y, wrist.x, wrist.y);
  let ringFolded = dist(hand.keypoints[16].x, hand.keypoints[16].y, wrist.x, wrist.y) < 
                   dist(hand.keypoints[15].x, hand.keypoints[15].y, wrist.x, wrist.y);
  
  return (thumbExtended && pinkyExtended && indexFolded && middleFolded && ringFolded);
}
function isThreeFingersExtended(hand) { // 일리네어 제스처를 인식하는 함수
  let wrist = hand.keypoints[0];
  // 엄지, 검지, 중지 손가락이 펴져 있는지 확인
  let thumbExtended = dist(hand.keypoints[4].x, hand.keypoints[4].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[3].x, hand.keypoints[3].y, wrist.x, wrist.y);
  let indexExtended = dist(hand.keypoints[8].x, hand.keypoints[8].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[7].x, hand.keypoints[7].y, wrist.x, wrist.y);
  let middleExtended = dist(hand.keypoints[12].x, hand.keypoints[12].y, wrist.x, wrist.y) > 
                       dist(hand.keypoints[11].x, hand.keypoints[11].y, wrist.x, wrist.y);
  let ringFolded = dist(hand.keypoints[16].x, hand.keypoints[16].y, wrist.x, wrist.y) < 
                   dist(hand.keypoints[15].x, hand.keypoints[15].y, wrist.x, wrist.y);
  let pinkyFolded = dist(hand.keypoints[20].x, hand.keypoints[20].y, wrist.x, wrist.y) < 
                    dist(hand.keypoints[19].x, hand.keypoints[19].y, wrist.x, wrist.y);
  
  return (thumbExtended && indexExtended && middleExtended && ringFolded && pinkyFolded);
}
function areAllFingersExtended(hand) { // Open hand gesture를 인식하는 함수
  let wrist = hand.keypoints[0];
  // 모든 손가락이 펴져 있는지 확인
  let thumbExtended = dist(hand.keypoints[4].x, hand.keypoints[4].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[3].x, hand.keypoints[3].y, wrist.x, wrist.y);
  let indexExtended = dist(hand.keypoints[8].x, hand.keypoints[8].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[7].x, hand.keypoints[7].y, wrist.x, wrist.y);
  let middleExtended = dist(hand.keypoints[12].x, hand.keypoints[12].y, wrist.x, wrist.y) > 
                       dist(hand.keypoints[11].x, hand.keypoints[11].y, wrist.x, wrist.y);
  let ringExtended = dist(hand.keypoints[16].x, hand.keypoints[16].y, wrist.x, wrist.y) > 
                     dist(hand.keypoints[15].x, hand.keypoints[15].y, wrist.x, wrist.y);
  let pinkyExtended = dist(hand.keypoints[20].x, hand.keypoints[20].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[19].x, hand.keypoints[19].y, wrist.x, wrist.y);
  
  return (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended);
}

function isThumbIndexExtended(hand) { // v 제스처를 인식하는 함수
  let wrist = hand.keypoints[0];
  // 엄지 손가락이 펴진지 확인
  let thumbExtended = dist(hand.keypoints[4].x, hand.keypoints[4].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[3].x, hand.keypoints[3].y, wrist.x, wrist.y);
  // 검지 손가락이 펴진지 확인
  let indexExtended = dist(hand.keypoints[8].x, hand.keypoints[8].y, wrist.x, wrist.y) > 
                      dist(hand.keypoints[7].x, hand.keypoints[7].y, wrist.x, wrist.y);
  // 중지 손가락이 접혀있는지 확인
  let middleFolded = dist(hand.keypoints[12].x, hand.keypoints[12].y, wrist.x, wrist.y) < 
                     dist(hand.keypoints[11].x, hand.keypoints[11].y, wrist.x, wrist.y);
  // 약지 손가락이 접혀있는지 확인
  let ringFolded = dist(hand.keypoints[16].x, hand.keypoints[16].y, wrist.x, wrist.y) < 
                   dist(hand.keypoints[15].x, hand.keypoints[15].y, wrist.x, wrist.y);
  // 소지 손가락이 접혀있는지 확인
  let pinkyFolded = dist(hand.keypoints[20].x, hand.keypoints[20].y, wrist.x, wrist.y) < 
                    dist(hand.keypoints[19].x, hand.keypoints[19].y, wrist.x, wrist.y);

  // 모든 조건이 충족되면 true 반환
  return (thumbExtended && indexExtended && middleFolded && ringFolded && pinkyFolded);
}

function isHandInRedSquare(hand) { // 손의 모든 키포인트가 빨간 상자 안에 있는지 확인
  let squareSize = height / 2;
  for (let i = 0; i < hand.keypoints.length; i++) {
    let keypoint = hand.keypoints[i];
    if (keypoint.x < 0 || keypoint.x > squareSize || keypoint.y < height - squareSize || keypoint.y > height) {
      return false;
    }
  }
  return true;
}

function isHandInBlueSquare(hand) {  // 손의 모든 키포인트가 파란 상자 안에 있는지 확인
  let squareSize = height / 2;
  for (let i = 0; i < hand.keypoints.length; i++) {
    let keypoint = hand.keypoints[i];
    if (keypoint.x < width - squareSize || keypoint.x > width || keypoint.y < height - squareSize || keypoint.y > height) {
      return false;
    }
  }
  return true;
}

function gotHands(results) { // 손 인식 결과를 hands 배열에 저장
  hands = results;
}
function windowResized() { // 창 크기가 변경 => 올바른 비율과 위치로 표시됩니다.
  resizeCanvas(windowWidth, windowHeight);
  drawingLayer.resizeCanvas(windowWidth, windowHeight);
}


