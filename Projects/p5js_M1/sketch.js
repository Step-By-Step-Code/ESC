let serialPort;
let writer;
let reader;
let modeText = "N/A";
let redSlider, yellowSlider, greenSlider;
let redState = 0, yellowState = 0, greenState = 0, Brightness=255; // 신호등 상태 변수

function setup() {
  createCanvas(500, 300);

  // Connect 버튼 생성
  let connectButton = createButton("Connect to Arduino");
  connectButton.position(10, 10);
  connectButton.mousePressed(connectToArduino); // 누를 시 함수실행


  // Slider 생성
  redSlider = createSlider(500, 3500, 2000, 100);
  redSlider.position(10, 100);
  yellowSlider = createSlider(500, 3500, 500, 100);
  yellowSlider.position(10, 130);
  greenSlider = createSlider(500, 3500, 2000, 100);
  greenSlider.position(10, 160);

  // Slider 이벤트 발생 시 sendData 함수 실행
  redSlider.input(sendData);
  yellowSlider.input(sendData);
  greenSlider.input(sendData);
}

// 프레임마다 실행
function draw() {
  background(220);
  textSize(16);

  fill('black'); 
  text("빨강 시간: " + redSlider.value() + " ms", 200, 115);
  text("노랑 시간: " + yellowSlider.value() + " ms", 200, 145);
  text("초록 시간: " + greenSlider.value() + " ms", 200, 175);
  text("현재 모드: " + modeText, 10, 250);
  text("현재 밝기: " + Brightness, 10, 270);

  drawTrafficLight();
}

// 신호등 그리기
function drawTrafficLight() {
  let size = 30;  // 원 크기
  let spacing = 50; // 원 간격

  fill(redState ? 'red' : 'gray');
  ellipse(180, 240, size, size);

  fill(yellowState ? 'yellow' : 'gray');
  ellipse(180 + spacing, 240, size, size);

  fill(greenState ? 'green' : 'gray');
  ellipse(180 + spacing * 2, 240, size, size);
}
// 아두이노 연결
async function connectToArduino() {
  try {
    serialPort = await navigator.serial.requestPort(); // 시리얼 포트 요청
    await serialPort.open({ baudRate: 9600 });
    writer = serialPort.writable.getWriter(); // writer 객체 생성
    reader = serialPort.readable.getReader(); // reader 객체 생성
    console.log("Connected to Arduino!");
    readData();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

// arduino로 데이터 전송
async function sendData() {
  if (writer) {
    let data = `${redSlider.value()},${yellowSlider.value()},${greenSlider.value()}\n`;
    const dataArray = new TextEncoder().encode(data); // 바이너리 데이터로 변환
    await writer.write(dataArray); // 아두이노로 전송
    console.log("Sent:", data);
  } else {
    console.log("Serial connection not established.");
  }
}
// arduino 데이터 읽기
async function readData() {
    let dataBuffer = "";  // 임시저장 버퍼

    while (serialPort.readable) { // 시리얼 통신 열려있는 동안 읽음
        try {
            const { value, done } = await reader.read(); // 한 덩어리씩 읽음
            if (done) break; // 읽을 데이터 없으면 종료

            let chunk = new TextDecoder().decode(value); // 문자열로 변환
            dataBuffer += chunk;  // 버퍼에 추가

            let lines = dataBuffer.split("\n"); // 개행 문자 기준

            while (lines.length > 1) {
                let completeLine = lines.shift().trim(); // 첫 번째 완전한 줄 꺼내기
                processData(completeLine); // 처리 함수로 전달
            }

            dataBuffer = lines[0]; // 남은 데이터 보관
        } catch (err) {
            console.error("Read error:", err);
        }
    }
}

// data 처리하고 변수 할당
function processData(data) {
  if (data) {
    console.log("Received:", data);

    let parts = data.split(",");
    if (parts.length === 5) {
      modeText = parts[0];
      redState = parseInt(parts[1]); 
      yellowState = parseInt(parts[2]); 
      greenState = parseInt(parts[3]);
      Brightness = parseInt(parts[4]);
      console.log(`Mode: ${modeText}, Red: ${redState}, Yellow: ${yellowState}, Green: ${greenState}, Brightness: ${Brightness}`);
    }
  }
}