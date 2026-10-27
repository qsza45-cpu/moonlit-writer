# Moonlit Writer 1.3 — macOS 수정·테스트 보고서 (2026-10-27)

## 오류 원인
1. **Windows에서 만든 Mac 앱이라 코드 서명이 전혀 없었음**(번들에 `_CodeSignature` 없음). macOS 서명 도구(`codesign`)는 Mac에서만 동작해서 Windows에서는 서명을 만들 수 없음. Apple Silicon은 서명이 맞지 않는 앱을 실행하지 않으므로 실행 불가의 가장 유력한 원인. 단, 사용자가 본 오류 메시지는 확인하지 못했음.
2. 프로젝트 루트의 예전 배포 ZIP 두 개(약 260MB)가 앱 안에 들어가 있었음(앱 555MB).
3. `foreground-mac.js`가 런루프 없이 sleep만 해서, 맨 앞 앱 이름이 처음 값에 고정될 수 있었음(자동 측정 오작동).
4. Mac 데이터 폴더 이름이 `moonlit-writer`로 Windows(`Moonlit Writer`)와 달랐음.

## 수정한 파일
| 파일 | 내용 |
|---|---|
| `build-mac.cjs` | macOS 전용 빌드. Universal(arm64+x64), 허용 목록으로 앱 내용 제한, 애드혹 서명 → `codesign --verify --deep --strict` → `ditto` 압축 |
| `foreground-mac.js` | 런루프로 앞 앱 갱신, 출력 파이프 끊기면 종료 |
| `package.json` | `productName: "Moonlit Writer"` (데이터 폴더 이름 통일) |
| `scripts/mac-smoke.sh` | 실제 macOS 실행 점검 스크립트 |
| `.github/workflows/mac-build.yml` | GitHub macOS 러너 빌드·점검 |
| `.gitignore`, `docs/` | 저장소 설정, 안내서·보고서 |

화면 디자인, 타이머 로직, Windows 빌드는 바꾸지 않았음.

## 빌드 결과
- `WritingTimer_macOS_Universal.zip` — 233,366,382 바이트(222.6MB)
- SHA-256 `345e44ec33c3ac5fb4572b4ea59a397bdc7f38937497912efcd660f5b1c8d1f3` (CI와 로컬 재계산 일치)
- 실행 파일 아키텍처: `x86_64 arm64`. 키 입력 모듈: arm64용/x86_64용 각각 포함
- 서명: 애드혹(`Signature=adhoc`, TeamIdentifier 없음). **Apple 개발자 서명·공증은 하지 않음**(계정·인증서 없음). `spctl` 평가는 거부(예상대로) → 첫 실행 시 경고 발생
- GitHub Actions 실행: https://github.com/qsza45-cpu/moonlit-writer/actions/runs/40453284946

## 실제 macOS 실행 점검 (GitHub 러너, macOS 15.7.9)
| 항목 | Apple Silicon | Intel |
|---|---|---|
| ZIP 압축 해제·번들 구조·심볼릭 링크 | 통과 | 통과 |
| codesign 무결성 | 통과 | 통과 |
| 앱 실행·15초 유지·창 1개 | 통과 | 통과 |
| 위젯·한글 표시(스크린샷) | 통과 | 통과 |
| 기록 파일 저장 | 통과 | 통과 |
| 정상 종료·재실행 | 통과 | 통과 |
| 앞 앱 전환 감지(TextEdit→Finder) | 통과 | 통과 |
| 타이머 시작·일시정지·재개·초기화 로직 | 단위 테스트 3개 통과(`npm test`) | 같음 |

## 검증하지 못한 것 (실제 Mac에서 확인 필요)
- 사용자 맥의 첫 실행 경고 → '그래도 열기' 흐름 (러너는 다운로드 격리 속성이 없음)
- 손쉬운 사용/입력 모니터링 권한 허용 후 실제 타이핑으로 시간 누적
- 화면의 버튼을 직접 눌러 보는 조작(타이머 시작·정지, 설정 저장 후 재실행 복원, 최소화·복원)
- 한글 입력(숫자 입력칸만 있음), 화면 잠금·잠자기 후 복귀, 장시간 측정

## 절전 정책 (기존 코드 그대로)
- 자동 집필 시간: 잠자기·잠금 시 활동 기준을 초기화하고, 입력이 없으면 쌓이지 않음 → 절전 중 시간은 제외.
- 집중 타이머: 잠자기·잠금 신호를 앱 화면에 전달함. 바꾸지 않았음.
