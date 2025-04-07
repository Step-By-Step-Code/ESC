# Counter8 Homework explanation
이 스크립트는 3개의 GPIO 핀을 이용하여 0부터 7(총 8가지 상태)까지 3비트 이진 카운트를 구현합니다.  
각 카운트 값에 따라 해당 비트가 1이면 핀을 HIGH(`dh`)로, 0이면 LOW(`dl`)로 설정해 순차적으로 LED를 제어합니다.

## Counter8 Youtube Link CLICK [Here](https://www.youtube.com/watch?v=ocRj36vOyU8)

## 사용방법


## 핀맵 설명
![alt text](image1.png)
| **GPIO 핀 번호** | **모드 설정** | **초기 상태** | **설명**                     |
|------------------|---------------|---------------|------------------------------|
| GPIO 14          | 출력 (op)     | LOW (dl)    | 제어 순서의 첫 번째 핀         |
| GPIO 15          | 출력 (op)     | LOW (dl)    | 제어 순서의 두 번째 핀         |
| GPIO 18          | 출력 (op)     | LOW (dl)    | 제어 순서의 세 번째 핀         |

## 회로 구성
- GPIO 14 : 빨강색 케이블
- GPIO 15 : 주황색 케이블
- GPIO 18 : 노란색 케이블

![alt text](image.png)

## 코드 구성과 설명

### 초기 설정
- 정의된 각 pin에 대해 pinctrl set "핀번호" op 명령어로 해당 핀을 출력 모드(op)로 설정합니다.
-  pinctrl set "핀번호" dl 명령어로 LOW 상태(dl)로 초기화합니다
```bash
for pin in "${pins[@]}"; do
    pinctrl set "$pin" op
    pinctrl set "$pin" dl
done
```
### 종료 처리
- cleanup() 함수 내부에서 pins 배열에 포함된 모든 핀을 LOW 상태(dl)로 되돌립니다.
- trap cleanup EXIT 구문을 통해 스크립트가 종료될 때(정상 종료 또는 Ctrl+C 등 신호를 받을 때) cleanup() 함수가 자동으로 호출됩니다.

- 스크립트가 어떻게 종료되더라도 모든 핀을 LOW 상태로 안전하게 되돌려 줍니다.
```bash
cleanup() {
    for pin in "${pins[@]}"; do
        pinctrl set "$pin" dl
    done
    echo "Pins reset to LOW. Exiting."
}
trap cleanup EXIT
```

### 메인 루프
- 스크립트는 무한 루프를 통해 0부터 7까지의 값을 순차적으로 생성하며, 이를 3비트 이진수로 변환하여 LED를 제어합니다.
- i번째 비트에 따라 핀을 HIGH(dh) 또는 LOW(dl)로 설정 3개의 GPIO 핀이 이진수 형태로 ON(HIGH) 또는 OFF(LOW) 상태를 나타냅니다.
- LED는 0~7까지의 상태를 1초 간격으로 순차적으로 표시하며, 이 과정을 반복합니다.
- 0->1->2->3->4->5->6->7->0->반복
```bash
while true; do
    for ((count=0; count<8; count++)); do
        for i in 0 1 2; do
            # i번째 비트를 확인하여 핀을 HIGH(dh) 또는 LOW(dl)로 설정
            (( (count >> i) & 1 )) && pinctrl set "${pins[i]}" dh || pinctrl set "${pins[i]}" dl
        done
        sleep 1
    done
done
```