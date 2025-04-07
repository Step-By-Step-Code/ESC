#!/usr/bin/bash

# 제어할 핀들을 배열로 정의
pins=(14 15 18)

# 초기 설정
# 모든 핀을 출력 모드(op)로 설정하고 초기 LOW(dl)로 설정
for pin in "${pins[@]}"; do
    pinctrl set "$pin" op
    pinctrl set "$pin" dl
done

# 종료 시 핀을 LOW로 설정하는 함수
cleanup() {
    for pin in "${pins[@]}"; do
        pinctrl set "$pin" dl
    done
    echo "Pins reset to LOW. Exiting."
}

# SIGINT(Ctrl+C) 또는 종료 시 cleanup 함수 호출
# trap '실행할 명령어' 시그널 => 시그널을 감지하여 지정한 명령어 실행
trap cleanup EXIT

# 0~7까지 3비트 카운트
while true; do
    for ((count=0; count<8; count++)); do # 0~7까지 카운트
        for i in 0 1 2; do
            # 0~7까지 카운트의 i번째 비트를 확인하여 핀을 HIGH(dh) 또는 LOW(dl)로 설정
            # (count >> i) & 1 이 참이면 pinctrl set "${pins[i]}" dh 거짓이면 pinctrl set "${pins[i]}" dl
            (( (count >> i) & 1 )) && pinctrl set "${pins[i]}" dh || pinctrl set "${pins[i]}" dl
        done
        sleep 1
    done
done