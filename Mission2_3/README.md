# 버튼을 누르면 LED 도미노 시퀀스 실행
- GPIO Zero 라이브러리를 사용해 버튼 입력이 발생할 때 LED 배열을 순차적으로 켜고 끄는 도미노(domino) 시퀀스를 실행합니다.

## M2_3 Youtube Link CLICK [Here](https://www.youtube.com/watch?v=j405hTMxNnY)

## 사용 방법

1. 본 README에 설명된 핀 배선을 완료합니다.
2. 스크립트를 실행합니다
```bash
python M3.py
```
3. 터미널에 안내 메시지가 출력됩니다. 버튼을 누르고 있으면 LED가 켜집니다.

## 핀맵 설명
| **GPIO 핀 번호** | **모드 설정** | **설명**                     |
|------------------|-------------|------------------------------|
| GPIO 25          | 입력 (버튼)   | 풀업(pull_up) 사용, 버튼 연결        |
| GPIO 12        | 출력 (LED1)     | 도미노 시퀀스 첫 번째 LED        |
| GPIO 16        | 출력 (LED2)     | 도미노 시퀀스 두 번째 LED        |
| GPIO 20        | 출력 (LED3)     | 도미노 시퀀스 세 번째 LED        |
| GPIO 21       | 출력 (LED4)     | 도미노 시퀀스 네 번째 LED        |





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
```
- GPIO25를 입력으로 설정, 내부 풀업 저항 활성화
- 지정된 GPIO 핀에 LED 객체 생성

### 도미노 시퀀스 함수
```python
def domino_sequence():
    button.when_pressed = None  # 시퀀스 실행 중 중복 호출 방지
    try:
        print("Button pressed, executing domino sequence...")
        for led in leds:
            led.on()
            time.sleep(1)
            led.off()
        print("Domino sequence completed. You can press the button again.")
    finally:
        button.when_pressed = domino_sequence  # 콜백 복원
```

- 버튼을 누르면 domino_sequence가 실행되며, 각 LED를 1초 간격으로 켜고 끕니다.
- 실행 중 버튼 이벤트를 일시 해제했다가, 완료 후 다시 복원해 재호출 가능하도록 처리합니다.

### 이벤트 바인딩
```python
# 버튼 누름 이벤트에 도미노 시퀀스 등록
button.when_pressed = domino_sequence
```
- 버튼을 누를 때마다 domino_sequence 함수가 호출됩니다.

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
    print("Waiting for button press...")
    pause()  # 프로그램이 종료되지 않도록 블록 상태로 대기
```
- pause()는 메인 스레드를 블록 상태로 유지하여, 버튼 이벤트 감지가 계속 이루어지게 합니다.

