# 버튼이 눌릴 때마다 LED 토글 시키기
- GPIO Zero 라이브러리를 사용해 버튼 입력이 발생할 때마다 LED 상태를 켜졌다 꺼졌다(toggle) 하도록 제어합니다.

## M2_2 Youtube Link CLICK [Here](https://www.youtube.com/shorts/m2OIx202eTc)

## 사용 방법

1. 본 README에 설명된 핀 배선을 완료합니다.
2. 스크립트를 실행합니다
```bash
python M2.py
```
3. 터미널에 안내 메시지가 출력됩니다. 버튼을 누르고 있으면 LED가 켜집니다.

## 핀맵 설명

![alt text](image1.png)
| **GPIO 핀 번호** | **모드 설정** | **설명**                     |
|------------------|-------------|------------------------------|
| GPIO 25          | 입력 (버튼)   | 풀업(pull_up) 사용, 버튼 연결        |
| GPIO 8        | 출력 (LED)  | 버튼 누름 상태 표시용 LED        |

## 회로 구성
```
GPIO GND----[버튼]------GPIO 25
GPIO GND----LED--------GPIO 8
```
## 코드 구성과 설명

### 초기 설정
```python
from gpiozero import Button, LED
from signal import pause

# 버튼과 LED 초기화
button = Button(25, pull_up=True)
led = LED(8)
```
- GPIO25를 입력으로 설정, 내부 풀업 저항 활성화

- GPIO8을 출력으로 설정하여 LED 제어 준비

### 이벤트 바인딩
```python
# 버튼이 눌릴 때마다 LED 상태를 토글
button.when_pressed = led.toggle
```
- when_pressed 콜백에 led.toggle을 등록하여, 버튼을 누를 때마다 LED가 켜졌다 꺼졌다 반복

### 프로그램 유지 (대기)
```python
if __name__ == "__main__":
    print("버튼을 누를 때마다 LED가 켜졌다 꺼졌다 합니다.")
    pause()  # 메인 스레드를 블록 상태로 유지하여 이벤트 감지가 계속되도록 함
```
- pause()는 메인 스레드를 블록 상태로 유지하여 이벤트 감지가 계속되도록 함