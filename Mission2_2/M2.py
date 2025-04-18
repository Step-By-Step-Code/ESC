from gpiozero import Button, LED
from signal import pause

# 버튼과 LED 초기화 (예: SW_PIN=25, LED_PIN=8)
button = Button(25, pull_up=True)
led = LED(8)

# 버튼이 눌릴 때마다 LED를 토글하도록 이벤트 바인딩
button.when_pressed = led.toggle

if __name__ == "__main__":
    print("버튼을 누를 때마다 LED가 켜졌다 꺼졌다 합니다.")
    pause()  # 프로그램이 종료되지 않고 이벤트를 계속 감지하도록 대기
