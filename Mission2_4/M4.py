from gpiozero import Button, LED
from signal import pause
import time

# 사용하는 GPIO 핀 번호 설정
SW_PIN = 25
GPIO_PINS = [8, 7, 16, 20]    

# 버튼과 LED 초기화
button = Button(SW_PIN, pull_up=True)
leds = [LED(pin) for pin in GPIO_PINS]

# 4비트 카운터를 위한 변수
count = 0

# value에 따라 LED 상태 업데이트하는 함수
    # value를 2진수로 변환하여 각 비트 값에 따라 LED를 켜고 끔
def update_leds(value):
    for i, led in enumerate(leds):
        if (value >> i) & 1: # 비트 연산을 통해 LED 상태 결정
            led.on()
        else:
            led.off()

def increment_count():
    global count # 사전에 정의한 전역 변수 사용
    button.when_pressed = None # 콜백 해제하여 코드 안정성 확보
    try:
        count = (count + 1) % 16
        update_leds(count)
        print(f"Count: {count:04b} ({count})")
    finally:
        button.when_pressed = increment_count # 콜백 복원


button.when_pressed = increment_count

if __name__ == "__main__":
    # 시작 시 초기 상태 표시
    update_leds(count)
    print("Waiting for button press...")
    pause()  # 무한 대기
