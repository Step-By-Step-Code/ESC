#include <Arduino.h>
#include "PinChangeInterrupt.h"
#include <TaskScheduler.h>
// -------------------- 핀 정의 --------------------
#define RED_LED 9
#define YELLOW_LED 10
#define GREEN_LED 11
#define BUTTON_B1 2
#define BUTTON_B2 3
#define BUTTON_B3 4
#define POTENTIOMETER A0
// ------------------ 변수 정의 -------------------
int mode = 0;
int redTime = 2000, yellowTime = 500, greenTime = 2000;
int ledBrightness = 255;  // LED 밝기 기본값
int red = 0, yellow = 0, green = 0; // LED 상태 (켜짐:1, 꺼짐:0)

// ----------------- TaskScheduler ---------------
Scheduler runner;
// 공용 함수 선언
void disableAllTasks();
void readBrightness();
void CheckSerial();
// --- default 모드용 5단계 Task 함수 선언 ---
void taskRedLED();
void taskYellowLED();
void taskGreenLED();
void taskGreenBlink();
void taskYellowLED2();

// 모드 1 전용 Task (Red LED의 밝기를 실시간 갱신)
void taskMode1();
// 모드 2용 (모든 LED 깜빡이기) Task
void taskAllLED();

// ----------------- Task 객체 생성 --------------
// 기본 Task들은 10ms 간격으로 실행 (비차단 방식)
Task tRedLED       (10, TASK_FOREVER, &taskRedLED,       &runner, false);
Task tYellowLED    (10, TASK_FOREVER, &taskYellowLED,    &runner, false);
Task tGreenLED     (10, TASK_FOREVER, &taskGreenLED,     &runner, false);
Task tGreenBlink   (10, TASK_FOREVER, &taskGreenBlink,   &runner, false);
Task tYellowLED2   (10, TASK_FOREVER, &taskYellowLED2,   &runner, false);
Task tBlinkAllLED  (10, TASK_FOREVER, &taskAllLED,       &runner, false);
Task tCheckSerial  (100, TASK_FOREVER, &CheckSerial,      &runner, true);

// 모드 1 전용 Task (10ms 주기로 Red LED 밝기 갱신)
Task tMode1        (10, TASK_FOREVER, &taskMode1,        &runner, false);

// ----------------- 인터럽트 핸들러 -------------
void handleInterrupt1() {
  // B1 버튼(FALLING): 첫 누름 -> mode=1 (Red LED 단독, 실시간 갱신)
  // 다시 누르면 기본 모드(mode=0)로 복귀하여 Default 시퀀스 시작
  if (mode != 1) {
    mode = 1;
    disableAllTasks();
    tMode1.enable();  // 모드 1 전용 Task 활성화
  } else {
    mode = 0;
    disableAllTasks();
    tRedLED.enable(); // 기본 시퀀스 (Red부터) 시작
  }
}

void handleInterrupt2() {
  // B2 버튼(FALLING): 첫 누름 -> mode=2 (모든 LED 깜빡임, 실시간 밝기 갱신)
  // 다시 누르면 기본 모드(mode=0)로 복귀
  if (mode != 2) {
    mode = 2;
    disableAllTasks();
    tBlinkAllLED.enable();
  } else {
    mode = 0;
    disableAllTasks();
    tRedLED.enable();
  }
}

void handleInterrupt3() {
  // B3 버튼(FALLING): 첫 누름 -> mode=3 (모든 LED OFF)
  // 다시 누르면 기본 모드(mode=0)로 복귀
  mode = (mode == 3) ? 0 : 3;
  disableAllTasks();
  if (mode == 0) {
    tRedLED.enable();
  }
}
// -------------------- setup --------------------
void setup() {
  Serial.begin(9600);
  
  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BUTTON_B1, INPUT_PULLUP);
  pinMode(BUTTON_B2, INPUT_PULLUP);
  pinMode(BUTTON_B3, INPUT_PULLUP);
  pinMode(POTENTIOMETER, INPUT);
  //인터럽트 설정
  attachPCINT(digitalPinToPCINT(BUTTON_B1), handleInterrupt1, FALLING);
  attachPCINT(digitalPinToPCINT(BUTTON_B2), handleInterrupt2, FALLING);  // 또는 digitalPinToPCINT(BUTTON_B2)
  attachPCINT(digitalPinToPCINT(BUTTON_B3), handleInterrupt3, FALLING);  // 또는 digitalPinToPCINT(BUTTON_B3)
  // 초기 기본 모드 시퀀스 시작
  tRedLED.enable();
}

// --------------------- loop --------------------
void loop() {
  runner.execute();
  readBrightness();
  Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness)); // p5.js에게 데이터 전송
}

// 모든 Task를 비활성화하고 모든 LED를 끔
void disableAllTasks() {
  tRedLED.disable();
  tYellowLED.disable();
  tGreenLED.disable();
  tGreenBlink.disable();
  tYellowLED2.disable();
  tBlinkAllLED.disable();
  tMode1.disable();
  
  analogWrite(RED_LED, 0);
  analogWrite(YELLOW_LED, 0);
  analogWrite(GREEN_LED, 0);
  
  red = yellow = green = 0;
}
// 가변저항 값을 읽어 ledBrightness 갱신
void readBrightness() {
  int potValue = analogRead(POTENTIOMETER);  // 0~1023
  ledBrightness = map(potValue, 0, 1023, 0, 255);
}
// Serial 통신을 통해 redTime, yellowTime, greenTime 변경
void CheckSerial() {
  if (Serial.available()) {
    String data = Serial.readStringUntil('\n');
    int newRed, newYellow, newGreen;
    if (sscanf(data.c_str(), "%d,%d,%d", &newRed, &newYellow, &newGreen) == 3) {
      redTime = newRed;
      yellowTime = newYellow;
      greenTime = newGreen;
    }
  }
}
// ------------------- Default 모드 시퀀스 -------------------
/*
  기본 모드는 아래 순서로 진행됩니다.
  1) tRedLED:   Red LED 켜고 redTime 동안 유지 → 끄고
  2) tYellowLED: Yellow LED 켜고 yellowTime 동안 유지 → 끄고
  3) tGreenLED:  Green LED 켜고 greenTime 동안 유지 → 끄고
  4) tGreenBlink: Green LED를 3회 깜빡임
  5) tYellowLED2: Yellow LED 켜고 yellowTime 동안 유지 후 다시 1)로 복귀
  
  각 Task는 10ms마다 호출되며, LED가 켜진 동안 매번 가변저항 값을 읽어 밝기를 즉시 갱신합니다.
*/

// 1) tRedLED (Default 모드)
void taskRedLED() {
  static unsigned long startTime = 0;
  static bool isOn = false; // 한 번만 실행하여 반복 실행해도 한 번만 실행됨
  if (mode != 0) { isOn = false; return;}
  
  if (!isOn) {
    analogWrite(RED_LED, ledBrightness);
    red = 1;
    startTime = millis();
    isOn = true;
  }
  else {
    analogWrite(RED_LED, ledBrightness);
    if (millis() - startTime >= (unsigned long)redTime) { // 시간이 지나면 다음 Task로 넘어감
      analogWrite(RED_LED, 0);
      red = 0;
      isOn = false;
      tRedLED.disable();
      tYellowLED.enable();
    }
  }
}

// 2) tYellowLED (Default 모드)
void taskYellowLED() {
  static unsigned long startTime = 0;
  static bool isOn = false;
  if (mode != 0) { isOn = false; return; }
  
  if (!isOn) {
    analogWrite(YELLOW_LED, ledBrightness);
    yellow = 1;
    startTime = millis();
    isOn = true;
  }
  else {
    analogWrite(YELLOW_LED, ledBrightness);
    if (millis() - startTime >= (unsigned long)yellowTime) { // 시간이 지나면 다음 Task로 넘어감
      analogWrite(YELLOW_LED, 0);
      yellow = 0;
      isOn = false;
      tYellowLED.disable();
      tGreenLED.enable();
    }
  }
}

// 3) tGreenLED (Default 모드)
void taskGreenLED() {
  static unsigned long startTime = 0;
  static bool isOn = false;
  
  if (mode != 0) { isOn = false; return; }
  
  if (!isOn) {
    analogWrite(GREEN_LED, ledBrightness);
    green = 1;
    startTime = millis();
    isOn = true;
  }
  else {
    analogWrite(GREEN_LED, ledBrightness);
    if (millis() - startTime >= (unsigned long)greenTime) { // 시간이 지나면 다음 Task로 넘어감
      analogWrite(GREEN_LED, 0);
      green = 0;
      isOn = false;
      tGreenLED.disable();
      tGreenBlink.enable();
    }
  }
}

// 4) tGreenBlink (Default 모드: Green LED 1초 동안 아래 패턴으로 깜빡)
// 패턴: 꺼짐 → 켜짐 → 꺼짐 → 켜짐 → 꺼짐 → 켜짐 → 꺼짐
void taskGreenBlink() {
    static int toggleCount = 0;
    static unsigned long lastToggleTime = 0;
    const unsigned long interval = 143UL;  // 약 1초/7번 = 143ms
  
    if (mode != 0) { toggleCount = 0; return; }
  
    if (millis() - lastToggleTime >= interval) {
      lastToggleTime = millis();
  
      if (toggleCount % 2 == 0) { 
        analogWrite(GREEN_LED, 0);
        green = 0;
      } 
      else {  
        analogWrite(GREEN_LED, ledBrightness);
        green = 1;
      }
      toggleCount++;
    }
    if (toggleCount >= 7) {  // 7번 토글 후 (꺼짐으로 끝남)
      analogWrite(GREEN_LED, 0); // LED OFF
      green = 0;
      toggleCount = 0;
      tGreenBlink.disable();    // Task 종료
      tYellowLED2.enable();     // 다음 Task로 전환
    }
  }
  
  

// 5) tYellowLED2 (Default 모드: Yellow LED 켜고 yellowTime 후 다시 Red)
void taskYellowLED2() {
  static unsigned long startTime = 0;
  static bool isOn = false;
  
  if (mode != 0) { isOn = false; return; }
  
  if (!isOn) {
    analogWrite(YELLOW_LED, ledBrightness);
    yellow = 1;
    startTime = millis();
    isOn = true;
  }
  else {
    analogWrite(YELLOW_LED, ledBrightness);
    if (millis() - startTime >= (unsigned long)yellowTime) {
      analogWrite(YELLOW_LED, 0);
      yellow = 0;
      isOn = false;
      tYellowLED2.disable();
      tRedLED.enable();
    }
  }
}

// -------------------- 모드 1 전용 Task --------------------
// 모드 1에서는 Red LED를 계속 켠 상태에서 10ms마다 POT 값을 읽어 실시간으로 밝기를 갱신합니다.
void taskMode1() {
  if (mode == 1) {
    analogWrite(RED_LED, ledBrightness);
    red = 1;
  }
}

// -------------------- 모드 2 (깜빡임) --------------------
// 모든 LED가 500ms 간격으로 토글됩니다. LED ON 상태에서는 토글 사이에도 매 10ms마다 POT 값을 읽어 밝기를 업데이트합니다.
void taskAllLED() {
  static unsigned long toggleTimer = 0;
  static bool ledOn = false;
  
  if (mode != 2) { ledOn = false; return; }
  
  // 500ms마다 LED 상태 토글
  if (millis() - toggleTimer >= 500UL) {
    toggleTimer = millis();
    ledOn = !ledOn;
    if (ledOn) {
      // 토글 시점에 POT 값을 읽어 LED를 켭니다.
      analogWrite(RED_LED, ledBrightness);
      analogWrite(YELLOW_LED, ledBrightness);
      analogWrite(GREEN_LED, ledBrightness);
      red = yellow = green = 1;
    }
    else {
      analogWrite(RED_LED, 0);
      analogWrite(YELLOW_LED, 0);
      analogWrite(GREEN_LED, 0);
      red = yellow = green = 0;
    }
  }
  else {
    if (ledOn) {
      analogWrite(RED_LED, ledBrightness);
      analogWrite(YELLOW_LED, ledBrightness);
      analogWrite(GREEN_LED, ledBrightness);
    }
  }
}