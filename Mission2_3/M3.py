from gpiozero import Button, LED
from signal import pause
import time

# 사용하는 GPIO 핀 번호 설정
SW_PIN = 25
GPIO_PINS = [8, 7, 16, 20]    

# 버튼과 LED 초기화
button = Button(SW_PIN, pull_up=True)
leds = [LED(pin) for pin in GPIO_PINS]

def domino_sequence():
    button.when_pressed = None   # 콜백 해제
    try:
        print("Button pressed, executing domino sequence...")
        for led in leds:
            led.on()
            time.sleep(1)
            led.off()
        print("Domino sequence completed. you can press the button again.")
    finally:
        button.when_pressed = domino_sequence  # 콜백 복원


# Assign the domino sequence to the button press event
button.when_pressed = domino_sequence

# Keep the program running to listen for button presses
if __name__ == "__main__":
    print("Waiting for button press...")
    pause() # infinite loop can keep the program running
