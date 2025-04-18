from gpiozero import Button, LED
from signal import pause

# 버튼과 LED 초기화 (예: SW_PIN=25, LED_PIN=8)
button = Button(25, pull_up=True)
led = LED(8)

# 버튼이 눌린 동안 LED를 켜고 떼면 끄는 함수
def light_while_pressed(button: Button, led: LED):
    button.when_pressed = led.on # 버튼 눌림 시 LED 켜기
    button.when_released = led.off # 버튼 떼면 LED 끄기

# 신호가 왔을 때 함수를 호출하도록 설정
light_while_pressed(button, led)

if __name__ == "__main__":
    print("Press and hold the button to light the LED.")
    pause() # 신호가 올 때까지 대기하고 프로그램을 종료하지 않음
