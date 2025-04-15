from gpiozero import LED
from signal import signal, SIGINT
from time import sleep
import sys

# 제어할 핀 리스트
pin_numbers = [14, 15, 18, 23]
leds = [LED(pin) for pin in pin_numbers]

# 종료 시 모든 LED OFF
def cleanup(sig, frame):
    for led in leds:
        led.off()
    print("Pins reset to LOW. Exiting.")
    sys.exit(0)

# SIGINT(Ctrl+C) 처리
signal(SIGINT, cleanup)

# 무한 루프: 각 LED를 순차적으로 켜고 끄기
while True:
    for led in leds:
        led.on()
        sleep(1)
        led.off()
