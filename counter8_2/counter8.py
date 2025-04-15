# 필요한 라이브러리
from gpiozero import LED
from signal import signal, SIGINT
from time import sleep
import sys

# 사용할 GPIO 핀 번호 리스트
pins = [14, 15, 18]

# LED 객체 생성
leds = [LED(pin) for pin in pins]

# 종료 시 실행되는 함수
def cleanup(signal_received, frame):
    for led in leds:
        led.off()
    print("Pins reset to LOW. Exiting.")
    sys.exit(0)

# SIGINT (Ctrl+C) 처리
signal(SIGINT, cleanup)

# 0~7까지 3비트 카운트
try:
    while True:
        for count in range(8):
            for i in range(3):
                if (count >> i) & 1:
                    leds[i].on()
                else:
                    leds[i].off()
            sleep(1)
except KeyboardInterrupt:
    cleanup(None, None)