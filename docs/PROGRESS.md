# StoryVital — 진행 현황 (ITTO 기반)

> 마지막 업데이트: 2026-08-01
> **정리 방식**: PMBOK의 ITTO(Inputs → Tools & Techniques → Outputs) 프레임으로 각 작업 단위를 정리했다. 각 작업이 **무엇을 받아서(I), 무엇으로(T&T), 무엇을 만들었는지(O)**가 한눈에 보이고, Output이 다음 작업의 Input으로 이어지는 흐름이 드러난다. 다만 ITTO에는 "진행 상태" 개념이 없어서, 문서 맨 위에 상태 대시보드를 추가로 뒀다.

---

## 📊 상태 대시보드

| # | 작업 단위 (Work Package) | 상태 | 완료일 |
|---|---|---|---|
| WP-1 | 제품 기획 (PRD) | ✅ 완료 (v3까지) | 2026-08-01 |
| WP-2 | 디자인 시스템 & 시안 | ✅ 완료 | 2026-04-06 |
| WP-3 | 프로토타입 v1 구현 | 🔄 진행 중 (~60%) | — |
| WP-4 | 프로젝트 구조 정리 | ✅ 완료 | 2026-08-01 |
| WP-5 | 관계도·타임라인·친밀도 시각화 | 🔄 진행 중 — 관계도+친밀도 완료, 타임라인 남음 | — |
| WP-6 | Firebase 연동 & 배포 | ⬜ 미착수 | — |
| WP-7 | 사용자 검증 (10명) | ⬜ 미착수 | — |

---

## ✅ WP-1. 제품 기획 (PRD)

| | 내용 |
|---|---|
| **Inputs** | 창작자 본인의 Pain Point 경험, 기존 도구(노션·Scrivener·AI 생성툴) 한계 분석, 웹소설/웹툰 시장 조사 |
| **Tools & Techniques** | 5W1H 분석, SWOT 분석 + SO/WO/ST/WT 전략 도출, 3-Tier BM 설계, Phase별 예산 분해(10만원) |
| **Outputs** | ① [StoryVital_PRD_v2.docx](./StoryVital_PRD_v2.docx) — 프로세스 가이드 컨셉<br>② [PRD.md (v3)](./PRD.md) — **"연재물 설정·인물 관리 도구"로 방향 재정의**, 아하 모먼트·궁극 가치 정의 추가 |

## ✅ WP-2. 디자인 시스템 & 시안

| | 내용 |
|---|---|
| **Inputs** | PRD v2의 화면 요구사항, "다크·몰입형 작업 환경" 컨셉 방향 |
| **Tools & Techniques** | Google Stitch (AI 디자인 생성), 디자인 시스템 문서화 |
| **Outputs** | ① [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — "Digital Nocturne / Neon Scriptorium" (다크 테마, No-Line 룰, 글래스모피즘, 네온 퍼플 #7e51ff, Manrope+Inter)<br>② `design/stitch/` 페이지 시안 8종 — dashboard(2종), characters, chapters, library, worldbuilding, settings, help |

## 🔄 WP-3. 프로토타입 v1 구현 (진행 중)

| | 내용 |
|---|---|
| **Inputs** | WP-2의 Stitch 시안(code.html), DESIGN_SYSTEM.md 토큰 |
| **Tools & Techniques** | 바이브 코딩(AI 보조), 순수 HTML/CSS/JS 단일 파일 구조, localStorage 저장 |
| **Outputs** | `prototype/` 페이지 5종 + 공용 모듈 2종 (아래 상세) |

**Output 상세 — 페이지별 구현 상태**

| 파일 | 내용 | 상태 |
|---|---|---|
| index.html | 대시보드 — 필명 로그인(필수), 온보딩, 작품 목록, 기록 스트릭, 스프린트 | ✅ localStorage 실데이터 연동 |
| characters.html | 캐릭터 DB — 프로필(성격/배경/관계), 검색 하이라이트 | ✅ localStorage 동작 |
| chapters.html | 챕터(회차) 트래커 — 회차·복선 CRUD 완비 | ✅ localStorage 동작 |
| relations.html | 인물 관계도 — 친밀도 그래프, 아바타 노드 | ✅ localStorage 동작 |
| export.html | 내보내기 — 원고 변환 + 설정집 TXT + JSON 백업/복원 | ✅ 실데이터 연동 |
| pricing.html | 요금제 (Free/BYOK/Premium/Pro) | 🔄 초안 |
| sv-shared.css | 공용 스타일 | ✅ |
| firebase.js | Firestore/Auth 모듈 골격, 컬렉션 구조 설계 완료 | ⚠️ API 키 미입력·미연결 |

## ✅ WP-4. 프로젝트 구조 정리

| | 내용 |
|---|---|
| **Inputs** | 초기 바이브 코딩으로 흩어진 폴더 7개 (중복 파일 다수) |
| **Tools & Techniques** | MD5 해시 비교로 중복 검증 후 삭제, 역할별 폴더 재구성 |
| **Outputs** | `docs / prototype / design` 3분류 구조, [README.md](../README.md), 본 문서, 중복 파일 제거 (새 폴더·story vital_2·stitch.zip·DESIGN.md 사본 3개) |

---

## 🔄 WP-5. 관계도·타임라인·친밀도 시각화 ★ 최우선 (진행 중)

| | 내용 |
|---|---|
| **Inputs** | PRD v3의 아하 모먼트 정의("첫 관계도까지 5분"), characters.html의 관계 데이터 구조, DESIGN_SYSTEM.md의 데이터 시각화 규칙(Neon Pulse) |
| **Tools & Techniques** | 외부 라이브러리 없이 **자체 포스 시뮬레이션**(SVG + requestAnimationFrame)으로 구현 — 단일 파일 구조 유지, 친밀도 스키마는 0~100 수치로 확정 |
| **Outputs** | ✅ ① `relations.html` 관계도 그래프 — 친밀도가 높을수록 인물이 **가깝게** 배치, 선 굵기·밝기 = 친밀도, 적대 관계(30 미만)는 붉은 점선, 노드 클릭 시 이웃 하이라이트 + 관계 목록 패널, 드래그 배치, **미등록 인물 고스트 노드 경고**(개연성 가치와 직결)<br>✅ ② 친밀도 입력 UI — characters.html 관계 편집에 0~100 슬라이더 추가, 상세 패널에 친밀도 바 표시<br>✅ (부수) characters.html **localStorage 영속화** — 기존엔 새로고침 시 데이터가 소실됐음. `sv_chars_{workId}` 키로 저장, 관계도 페이지와 공유<br>⬜ ③ 사건 타임라인 뷰 (다음 작업)<br>⬜ ④ 회차 축 친밀도 변화 그래프 (타임라인 이후) |

## ⬜ WP-6. Firebase 연동 & 배포

| | 내용 |
|---|---|
| **Inputs** | firebase.js 골격, Firestore 컬렉션 설계(`users/{uid}/works/{workId}/...`) |
| **Tools & Techniques** | Firebase Console 프로젝트 생성, Google Auth 연동, Cloudflare Pages 배포 |
| **Outputs (목표)** | 로그인 가능한 배포 버전(공개 URL), localStorage → Firestore 마이그레이션 |

## ⬜ WP-7. 사용자 검증

| | 내용 |
|---|---|
| **Inputs** | WP-6의 배포 URL, PRD v2의 성공 지표 |
| **Tools & Techniques** | 지인·창작 커뮤니티(네이버 시리즈, 조아라 등) 대상 테스트, 피드백 인터뷰 |
| **Outputs (목표)** | 활성 사용자 10명, 완성 프로젝트 3개, 평균 세션 15분+, 개선 백로그 |

---

## 참고 메모
- **UX 플로우 전수 점검 완료 (2026-08-01)** — CRUD 누락·이탈 지점 분석과 조치 내역은 [UX_FLOWS.md](./UX_FLOWS.md) 참고. 아바타 시스템(샘플+사진 업로드) 추가됨. 남은 과제: index.html 작품 수정/삭제·통계 연동, export 실데이터 연동
- Stitch 시안 중 library, worldbuilding, help, settings는 아직 프로토타입 미구현
- PRD v2의 게이미피케이션(레벨/뱃지/streak)은 후순위 — WP-5 시각화가 아하 모먼트의 핵심이므로 먼저
