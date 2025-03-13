#include <Arduino.h>
#include "PinChangeInterrupt.h"
#include <TaskScheduler.h>

// Define Pins
#define RED_LED 9
#define YELLOW_LED 10
#define GREEN_LED 11
#define BUTTON_B1 2
#define BUTTON_B2 3
#define BUTTON_B3 4
#define POTENTIOMETER A0

// Define Variables
int mode = 0;
int redTime = 2000, yellowTime = 500, greenTime = 2000;
int ledBrightness = 255; // LED 밝기 (기본값 255)
int red = 0, yellow = 0, green = 0;

// Define TaskScheduler
Scheduler runner;

// Define Functions
void taskRedLED();
void taskYellowLED();
void taskGreenLED();
void taskGreenBlink();
void taskYellowLED2();
void taskallLED(); 
void disableAllTasks(); 
void readBrightness(); 
void CheckSerial();

// Default Tasks
Task tRedLED(0, TASK_ONCE, &taskRedLED, &runner, false);
Task tYellowLED(0, TASK_ONCE, &taskYellowLED, &runner, false);
Task tGreenLED(0, TASK_ONCE, &taskGreenLED, &runner, false);
Task tGreenBlink(0, TASK_ONCE, &taskGreenBlink, &runner, false);
Task tYellowLED2(0, TASK_ONCE, &taskYellowLED2, &runner, false);

// B2 Mode Task
Task tBlinkallLED(0, TASK_FOREVER, &taskallLED, &runner, false);

// Serial Task
Task tCheckSerial(100, TASK_FOREVER, &CheckSerial, &runner, true);

// FALLING -> RED LED ON -> FALLING -> Default Task start
void handleInterrupt1(){
  if (mode != 1) {
    mode = 1;
    disableAllTasks();
    readBrightness();
    analogWrite(RED_LED, ledBrightness);
    red = 1;
  }
  else if (mode == 1){
    mode = 0;
    disableAllTasks();
    tRedLED.restart();
    red = 0;
  }
  Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
}

// FALLING -> tBlinkallLED start -> FALLING -> Default Task start
void handleInterrupt2(){
  if (mode != 2) {
    mode = 2;
    disableAllTasks();
    tBlinkallLED.restart();
  }
  else if (mode == 2){
    mode = 0;
    tBlinkallLED.disable();
    tRedLED.restart();
  }
}

// FALLING -> ALL LED OFF -> FALLING -> Default Task start
void handleInterrupt3(){
  mode = (mode == 3) ? 0 : 3;
  disableAllTasks();
  if (mode == 0) tRedLED.restart();
}

void setup() {
    Serial.begin(9600);

    // PinMode 설정
    pinMode(RED_LED, OUTPUT);
    pinMode(YELLOW_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);
    pinMode(BUTTON_B1, INPUT_PULLUP);
    pinMode(BUTTON_B2, INPUT_PULLUP);
    pinMode(BUTTON_B3, INPUT_PULLUP);
    pinMode(POTENTIOMETER, INPUT);
    
    // Attach Interrupts to Buttons
    attachPCINT(digitalPinToPCINT(BUTTON_B1), handleInterrupt1, FALLING);
    attachPCINT(digitalPinToPCINT(BUTTON_B2), handleInterrupt2, FALLING);
    attachPCINT(digitalPinToPCINT(BUTTON_B3), handleInterrupt3, FALLING);
    // Default Task Start
    tRedLED.enable();
}

void loop() {
    runner.execute();
}

// 실시간 상태 출력
// Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");


// 모든 Task를 비활성화
void disableAllTasks() {
    // 모든 Task 비활성화
    tRedLED.disable();
    tYellowLED.disable();
    tGreenLED.disable();
    tGreenBlink.disable();
    tYellowLED2.disable();
    // B2 모드 Task 비활성화
    tBlinkallLED.disable();
    // LED 모두 끄기
    analogWrite(RED_LED, 0);
    analogWrite(YELLOW_LED, 0);
    analogWrite(GREEN_LED, 0);
    red=yellow=green=0;
    Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
}

// 가변저항 값 읽기
void readBrightness() {
    int potValue = analogRead(POTENTIOMETER);  // 가변저항 값 읽기 (0~1023)
    ledBrightness = map(potValue, 0, 1023, 0, 255);  // 0~255 범위로 변환
}
// Default Task
// RED LED ON -> redTime -> RED LED OFF -> tYellowLED start
void taskRedLED() {
    if(mode != 0) return;
    readBrightness();
    analogWrite(RED_LED, ledBrightness);
    red = 1;
    Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
    delay(redTime);
    analogWrite(RED_LED, 0);
    red = 0;
    Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
    tYellowLED.restart();
}
// YELLOW LED ON -> yellowTime -> YELLOW LED OFF -> tGreenLED start
void taskYellowLED() {
    if(mode != 0) return;
    readBrightness();
    analogWrite(YELLOW_LED, ledBrightness);
    yellow = 1;
    Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
    delay(yellowTime);
    analogWrite(YELLOW_LED, 0);
    yellow = 0;
    Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
    tGreenLED.restart();
}
// GREEN LED ON -> greenTime -> GREEN LED OFF -> tGreenBlink start
void taskGreenLED() {
    if(mode != 0) return;
        readBrightness();
        green = 1;
        analogWrite(GREEN_LED, ledBrightness);
        Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
        delay(greenTime);
        tGreenBlink.restart();
}
// Green LED 3회 깜빡이기 -> tYellowLED2 start
void taskGreenBlink() {
    if(mode != 0) return;
        readBrightness();
        for (int i = 0; i < 3; i++) {
            green = 0;
            Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
            analogWrite(GREEN_LED, 0);
            delay(166);
            analogWrite(GREEN_LED, ledBrightness);
            green = 1;
            Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
            delay(166);
        }
        analogWrite(GREEN_LED, 0);
        green = 0;
        Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
    tYellowLED2.restart();
}
// Yellow LED ON -> yellowTime -> YELLOW LED OFF -> Default Task start
void taskYellowLED2() {
    if(mode != 0) return;
        readBrightness();
        yellow = 1;
        Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
        analogWrite(YELLOW_LED, ledBrightness);
        delay(yellowTime);
        yellow = 0;
        Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
        analogWrite(YELLOW_LED, 0);
        tRedLED.restart();
}

// B2 모드: 모든 LED가 깜빡이는 TaskScheduler 방식
void taskallLED() {
    readBrightness();  // 깜빡이기 전에 밝기 설정
    yellow=green=red=1;
    analogWrite(RED_LED, !digitalRead(RED_LED) * ledBrightness);
    analogWrite(YELLOW_LED, !digitalRead(YELLOW_LED) * ledBrightness);
    analogWrite(GREEN_LED, !digitalRead(GREEN_LED) * ledBrightness);
    Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
    delay(500);
    yellow=green=red=0;
    analogWrite(RED_LED, 0);
    analogWrite(YELLOW_LED, 0);
    analogWrite(GREEN_LED, 0);
    Serial.println(String(mode) + "," + String(red) + "," + String(yellow) + "," + String(green) + "," + String(ledBrightness) + "\n");
    delay(500);
}
// 시리얼 통신을 통해 redTime, yellowTime, greenTime을 변경
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