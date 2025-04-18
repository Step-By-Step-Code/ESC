from gpiozero import Button, LED
from signal import pause
import time
import atexit

# 사용하는 GPIO 핀 번호 설정
SW_PIN = 25
GPIO_PINS = [12, 16, 20, 21]    

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
    global count  # Declare count as global to modify the global variable
    count = (count + 1) % 16
    update_leds(count)


button.when_pressed = increment_count

# 종료 시 모든 LED를 끄는 함수
def cleanup():
    for led in leds:
        led.off()
    print("LED reset to OFF. Exiting.")

# 종료 시 cleanup 함수 호출
atexit.register(cleanup)

if __name__ == "__main__":
    # 시작 시 초기 상태 표시
    update_leds(count)
    print("Waiting for button press...")
    pause()  # 무한 대기
