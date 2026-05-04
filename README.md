# 네트워크관리사 2급 CBT 연습

개인용 네트워크관리사 2급 CBT 연습 웹앱입니다.

공식 기출 원문은 저작권 문제를 피하기 위해 앱에 포함하지 않습니다. 앱에는 ICQA 2급 필기 출제 범위를 바탕으로 직접 작성한 유사문제 200문항이 들어 있습니다.

## 실행

```bash
npm install
npm run dev
```

## 배포

Vercel에서 GitHub 저장소를 연결하고 production branch를 `main`으로 둡니다.

이 프로젝트는 `main` push 후 최신 production 배포를 `network-manager-cbt.vercel.app`으로 동기화하는 GitHub Actions 워크플로를 포함합니다.

필요한 GitHub Secrets:

- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`
- `VERCEL_TEAM_ID` 팀 프로젝트일 때만 사용

필요한 Vercel 환경변수:

- `NEXT_PUBLIC_SITE_URL=https://network-manager-cbt.vercel.app`
- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` 카카오톡 공유를 사용할 때 설정

환경변수 예시는 `.env.example`에서 확인할 수 있습니다.

카카오톡 공유를 사용하려면 Kakao Developers에서 JavaScript 키를 발급하고 Web domain에 `https://network-manager-cbt.vercel.app`을 등록합니다.

## 테스트 명령어

### `npm run test`

Vitest로 순수 로직과 문제 데이터를 빠르게 검증합니다.

주요 확인 범위:

- 점수 계산과 합격 판정
- 과목 필터와 문항 랜덤 선택
- 선택지 랜덤 배치 후 정답 인덱스 유지
- `data/questions.json`의 200문항 구성과 필수 필드

문제 데이터를 수정하거나 퀴즈 로직을 바꾼 뒤 먼저 실행하세요.

```bash
npm run test
```

### `npm run test:e2e`

Playwright로 실제 브라우저에서 CBT 사용 흐름을 검증합니다.

주요 확인 범위:

- 첫 화면 렌더링
- CBT 시작
- 답안 선택
- 제출 후 결과 화면 표시
- 데스크톱/모바일 화면 동작

UI를 수정했거나 배포 전 전체 흐름을 확인할 때 실행하세요.

```bash
npm run test:e2e
```

## 기능

- 과목 선택: 전체, 네트워크 일반, TCP/IP, NOS, 네트워크 운용기기
- 문항 수 선택: 20, 30, 50문항
- 기본 CBT 기준: 50문항, 50분, 60점 이상 합격
- 결과 화면: 점수, 정답 수, 합격 여부, 전체 문항의 정답과 상세 해설
- 결과 공유: 카카오톡 공유, Web Share, 링크 복사 fallback
- 공유 페이지: `/share` 링크로 CBT 결과 요약 확인

## 문제 데이터 수정

문제/답/해설 데이터는 `data/questions.json`에서 관리합니다.

각 문항은 아래 필드를 가집니다.

- `id`: 고유 ID
- `subject`: `network-general`, `tcp-ip`, `nos`, `network-operation` 중 하나
- `prompt`: 문제
- `choices`: 선택지 4개
- `answerIndex`: 정답 선택지의 0부터 시작하는 인덱스
- `explanation`: 결과 화면에 표시할 상세 풀이
- `tags`: 검색/분류용 태그
