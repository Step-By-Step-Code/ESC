#!/usr/bin/bash

# 제어할 핀들을 배열로 정의
pins=(14 15 18 23)

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

# 핀을 순차적으로 HIGH(dh)로 설정하고 1초 대기 후 LOW(dl)로 설정
while true; do
    for pin in "${pins[@]}"; do
        pinctrl set "$pin" dh
        sleep 1
        pinctrl set "$pin" dl
    done
done