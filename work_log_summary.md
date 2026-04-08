# StoryVital 작업 기록 요약

작성일: 2026-04-07

## 1) 프로젝트 정리 및 구조 정돈

- 핵심 페이지 기준으로 작업 진행:
  - `index.html`
  - `characters.html`
  - `chapters.html`
  - `export.html`
- 링크 연결 점검:
  - 상단/사이드 메뉴가 4개 핵심 페이지를 가리키도록 정리
- 백엔드 규칙 점검:
  - 루트 컬렉션 사용(`projects`, `characters`, `timeline_events`) 기준 확인
  - 캐릭터 이름 필드 매핑(`name` <-> `fullName`) 반영 확인
  - `import.meta.env` 직접 참조 제거 상태 점검

## 2) 백엔드 연동 보정

- `characters.html`에서 조회/저장 로직 보정:
  - 조회 시 `userId`, `projectId` 필터 적용
  - 저장 시 `userId` 포함
  - `fullName` 필드 기준으로 읽기/쓰기 매핑
- 저장 가드 강화:
  - `if (!uid || !activeWorkId) return;` 형태 검증 및 적용

## 3) 외부 소스 반영

- `C:\Users\최하경\OneDrive\바탕 화면\files (1)` 기준으로
  - `index.html`
  - `characters.html`
  - `chapters.html`
  - `export.html`
  를 대상 작업 폴더에 덮어써 반영

## 4) API 키/보안 처리

- 요구사항에 따라 기존 Firebase 키를 동작 가능하게 유지
- 단, GitHub 노출 방지를 위해 로컬 전용 설정으로 분리:
  - 실제 키: `firebase-config.local.js`
  - 공개용 플레이스홀더: `firebase-config.js`
- `.gitignore`에 아래 항목 추가:
  - `firebase-config.local.js`
- 주요 페이지 import 경로를 로컬 전용 설정으로 변경:
  - `./firebase-config.local.js`

## 5) 현재 상태 요약

- 실사용 키는 로컬 파일에만 존재하고 Git 추적에서 제외됨
- 핵심 페이지는 유지되며 백엔드 연동/보안 조건을 함께 충족하도록 조정됨
- 필요 시 다음 단계:
  - Firebase 키 회전(이미 외부 노출 이력 있을 경우 권장)
  - Cloudflare Pages 배포용 환경 변수 방식으로 전환 점검
