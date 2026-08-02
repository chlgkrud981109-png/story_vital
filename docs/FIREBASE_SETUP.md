# Firebase 연동 가이드 (Google 로그인 활성화)

> **현재 상태**: Firebase 미연동. 필명 로그인 + 브라우저 저장(localStorage)으로 모든 기능이 동작합니다.
> Google 로그인·클라우드 동기화를 켜려면 아래 절차대로 **본인 계정으로 Firebase 프로젝트를 만들고 키를 발급**받아야 합니다. (무료 Spark 플랜으로 충분)

## 1. Firebase 프로젝트 만들기 (약 5분)

1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 프로젝트 이름: `storyvital` (아무거나 OK) → Google 애널리틱스는 꺼도 됨 → 만들기

## 2. Google 로그인 켜기

1. 왼쪽 메뉴 **빌드 > Authentication** → **시작하기**
2. **Sign-in method** 탭 → **Google** 선택 → **사용 설정** → 프로젝트 지원 이메일 선택 → 저장

## 3. 웹 앱 등록 & 키 복사

1. 프로젝트 개요 옆 ⚙️ → **프로젝트 설정** → 아래 "내 앱" → **웹 아이콘 `</>`** 클릭
2. 앱 닉네임 `storyvital-web` → 앱 등록 (호스팅 체크 불필요)
3. 나오는 `firebaseConfig` 값을 복사

## 4. 키 붙여넣기 — **딱 한 곳**

[prototype/firebase.js](../prototype/firebase.js)의 `firebaseConfig`(24행 부근)를 복사한 값으로 교체:

```js
const firebaseConfig = {
  apiKey:            "AIza....",           // ← 복사한 값
  authDomain:        "storyvital.firebaseapp.com",
  projectId:         "storyvital",
  storageBucket:     "storyvital.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234:web:abcd"
};
```

다른 파일은 건드릴 필요 없음 — 모든 페이지가 firebase.js 한 곳을 바라봅니다. 키를 넣으면 `isConfigured`가 자동으로 true가 되어 Google 버튼이 활성화됩니다.

## 5. Firestore 데이터베이스 만들기

1. **빌드 > Firestore Database** → **데이터베이스 만들기** → 프로덕션 모드 → 위치 `asia-northeast3`(서울)
2. **규칙** 탭에 아래 붙여넣고 게시 (본인 데이터만 읽고 쓸 수 있게):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 6. ⚠️ 반드시 로컬 서버로 실행

**html 파일을 더블클릭(file://)으로 열면 Google 로그인 팝업이 차단됩니다.** (필명 로그인은 file://에서도 동작)

```powershell
cd "prototype 폴더 경로"
python -m http.server 8000
```
→ 브라우저에서 **http://localhost:8000** 접속. (또는 VS Code의 Live Server 확장 사용)

`localhost`는 Firebase 승인 도메인에 기본 포함되어 있어 추가 설정 불필요. 나중에 Cloudflare Pages 등에 배포하면 **Authentication > Settings > 승인된 도메인**에 배포 도메인을 추가해야 합니다.

## 7. 확인

1. http://localhost:8000 접속 → 로그인 화면에서 **Google로 계속하기** 버튼이 선명해져 있으면 연동 인식 성공 (미연동이면 반투명 + 안내 툴팁)
2. 클릭 → Google 계정 선택 팝업 → 로그인되면 성공

## 알아둘 것

- **로컬 데이터와의 관계**: 현재 필명으로 기록한 데이터는 이 브라우저의 localStorage에 있습니다. Google 로그인 후 Firestore와의 자동 병합은 아직 미구현이므로, 필요하면 내보내기 페이지의 **JSON 백업**으로 옮겨두세요. (승계 플로우는 UX_FLOWS.md 남은 항목)
- 키(`apiKey`)는 공개되어도 규칙(5번)이 데이터를 보호하지만, 저장소를 공개 배포할 계획이면 별도 관리 권장.
