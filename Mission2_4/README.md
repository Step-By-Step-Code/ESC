# 버튼이 눌릴 때마다 4-bit 카운터 값 증가시키기
- GPIO Zero 라이브러리를 사용해 버튼을 누를 때마다 4비트 LED에 이진 카운트를 표시합니다.

## M2_4 Youtube Link CLICK [Here](https://www.youtube.com/watch?v=ujHqZhecUhc)

## 사용 방법

1. 본 README에 설명된 핀 배선을 완료합니다.
2. 스크립트를 실행합니다
```bash
python M4.py
```
3. 터미널에 안내 메시지가 출력되면 버튼을 눌러 카운트를 증가시킵니다.

## 핀맵 설명

| **GPIO 핀 번호** | **모드 설정** | **설명**                     |
|------------------|-------------|------------------------------|
| GPIO 25          | 입력 (버튼)   | 풀업(pull_up) 사용, 버튼 연결        |
| GPIO 12      | 출력 (LED1)     | 카운트 비트0 (LSB) 표시       |
| GPIO 16        | 출력 (LED2)     | 카운트 비트1 표시       |
| GPIO 20        | 출력 (LED3)     | 카운트 비트2 표시       |
| GPIO 21       | 출력 (LED4)     | 카운트 비트3 (MSB) 표시       |





## 회로 구성
```
[3.3V]----[버튼]----GPIO25
GPIO GND---[저항]---LED1----GPIO12
GPIO GND---[저항]---LED2----GPIO16
GPIO GND---[저항]---LED3----GPIO20
GPIO GND---[저항]---LED4----GPIO21
```

## 코드 구성과 설명

### 초기 설정
```python
from gpiozero import Button, LED
from signal import pause
import time

# 사용할 GPIO 핀 번호 설정
SW_PIN = 25
GPIO_PINS = [12, 16, 20, 21]

# 버튼과 LED 리스트 초기화
button = Button(SW_PIN, pull_up=True)
leds = [LED(pin) for pin in GPIO_PINS]

# 4비트 카운터용 전역 변수
count = 0
```
- GPIO25를 입력으로 설정, 내부 풀업 저항 활성화
- 지정된 GPIO 핀에 LED 객체 생성
- 초기 카운트 값 설정

### update_leds 함수
```python
def update_leds(value):
    for i, led in enumerate(leds):
        if (value >> i) & 1:
            led.on()
        else:
            led.off()
```

- value >> i로 i번째 비트를 LSB 위치로 시프트 후 & 1로 해당 비트가 1인지 확인
- 비트가 1일 때 led.on(), 0일 때 led.off() 호출

### increment_count 함수
```python
def increment_count():
    global count  # Declare count as global to modify the global variable
    count = (count + 1) % 16
    update_leds(count)
```

- count를 0~15 범위로 증가시키고, update_leds로 LED 업데이트

### 이벤트 바인딩
```python
button.when_pressed = increment_count
```
- 버튼을 누를 때마다 increment_count 함수 호출

### 종료 처리
```python
# 종료 시 모든 LED를 끄는 함수
def cleanup():
    for led in leds:
        led.off()
    print("LED reset to OFF. Exiting.")

# 종료 시 cleanup 함수 호출
atexit.register(cleanup)
```
- cleanup() 함수에서 LED를 OFF 상태로 설정하고 종료 메시지 출력

- atexit.register(cleanup) 호출로 스크립트가 종료될 때 항상 cleanup() 실행

### 프로그램 유지 (대기)
```python
if __name__ == "__main__":
    # 시작 시 초기 상태 표시
    update_leds(count)
    print("Waiting for button press...")
    pause()  # 무한 대기
```
- pause()는 메인 스레드를 블록 상태로 유지하여, 버튼 이벤트 감지가 계속 이루어지게 합니다.

