# feeddiary

이번 주 저장한 영상들이 어떤 그림인지 카드로 보여드려요.

YouTube URL 여러 개를 붙여넣으면 취향 분석 카드를 만들어주는 웹앱입니다. 카테고리 분포, 갓생 지수 vs 도파민 지수, 한 줄 하이라이트가 들어간 카드를 만들어주고 공개 단축 URL로 공유할 수 있어요. 로그인 없음.

## 스택

Next.js 15 App Router · TypeScript · Tailwind · Supabase Postgres · Anthropic Claude Sonnet 4.6 · Satori (`next/og` 경유) · Vitest · Vercel

## 로컬 개발 (빠른 시작)

```bash
cp .env.local.example .env.local
# .env.local 안에 ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY 채우기
npm install
npm run dev
```

첫 실행 전에 Supabase 마이그레이션 돌리기:

```bash
# Supabase SQL editor 에서 supabase/migrations/0001_init.sql 내용 그대로 붙여넣고 Run
```

## 스크립트

- `npm run dev` — 개발 서버 시작
- `npm run build` — 프로덕션 빌드
- `npm test` — 단위 테스트 실행
- `npm run typecheck` — TypeScript 타입 검사만 (출력 없음)

## 상태

v0 스프린트. 스펙은 `~/.gstack/projects/feeddiary/test-unknown-eng-spec-20260515-142459.md`. 디자인 레퍼런스는 `mockups/warm.html`.

## 처음부터 따라하기 (클론 후 실행까지)

새로운 머신에서 feeddiary를 처음부터 띄우는 전체 가이드입니다.

### 사전 준비

- **Node.js 18.18+** (Next.js 15 요구사항). 확인: `node -v`
- **npm** (Node 설치하면 같이 깔림)
- **Anthropic API 키** — https://console.anthropic.com 에서 가입
- **Supabase 프로젝트** — https://supabase.com 가입 후 프로젝트 생성 (한국 사용자는 Seoul/Tokyo 리전 권장)

### 1. 레포 클론

```bash
git clone https://github.com/dandanyoou/feeddiary.git
cd feeddiary
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 열어서 채우기:

```
ANTHROPIC_API_KEY=sk-ant-...           # https://console.anthropic.com/settings/keys
SUPABASE_URL=https://xxx.supabase.co   # Supabase → Settings → API → Project URL
SUPABASE_SERVICE_KEY=eyJ...            # Supabase → Settings → API → service_role secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # 로컬 개발은 그대로 둠
```

> **보안 주의:** `SUPABASE_SERVICE_KEY`는 Row Level Security를 우회합니다. 절대 클라이언트에 노출하거나 커밋하지 마세요.

### 4. DB 마이그레이션 돌리기

Supabase 대시보드 → **SQL Editor** → `supabase/migrations/0001_init.sql` 내용 복사해서 붙여넣고 **Run** 클릭. `cards`와 `card_items` 테이블이 생성됩니다.

### 5. 개발 서버 시작

```bash
npm run dev
```

http://localhost:3000 열기.

### 6. 동작 확인

```bash
npm test            # 48개 단위 테스트 통과해야 함
npm run typecheck   # TypeScript strict, 에러 없음
npm run build       # 프로덕션 빌드 성공해야 함
```

### Vercel 배포

```bash
# 옵션 A: GitHub 연동 (권장)
# GitHub에 푸시 → Vercel → New Project → Import from GitHub
# Vercel → Settings → Environment Variables 에 .env.local 의 세 키 등록

# 옵션 B: Vercel CLI
npx vercel
npx vercel --prod
```

첫 프로덕션 배포 전에 Vercel에 `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` 세 개 다 등록되어 있는지 꼭 확인하세요.

### 자주 겪는 문제

- **`npm install` 후 `Module not found` 에러** — `node_modules`와 `package-lock.json` 지우고 `npm install` 다시
- **첫 실행에서 Supabase 에러** — 마이그레이션이 정상적으로 돌았는지 확인. `cards` 테이블이 있어야 함
- **Claude가 JSON 아닌 응답을 반환** — 파서에 fallback 있음 (모두 "Other" 태그 처리). 자꾸 발생하면 `ANTHROPIC_API_KEY`가 유효하고 결제 활성화돼 있는지 확인
- **Vercel에서 Satori 출력의 한글이 깨짐** — 로컬 Mac은 시스템 폰트 덕분에 잘 나오지만, Vercel은 Noto Sans KR을 명시적으로 로딩해야 함 (`lib/card-template.tsx` 참조)
