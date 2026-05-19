# feeddiary

이번 주 저장한 영상들이 어떤 그림인지 카드로 보여드려요.

### 👉 [feeddiary.vercel.app](https://feeddiary.vercel.app) 에서 바로 써보기

설치, 회원가입, API 키 같은 거 없습니다. 브라우저에서 바로 됩니다.

---

## 이렇게 써요

1. 이번 주 본 YouTube 영상 링크를 **10~50개** 복사해서 붙여넣으세요
2. 5초쯤 기다리면 카드가 만들어져요
3. 이미지 저장하거나 공유 링크 복사해서 인스타 스토리, 트위터, 카톡 어디든 올려보세요

링크는 한 줄에 하나씩, 어디서 가져오든 (YouTube 보관함, 좋아요한 영상, 시청 기록 등) 상관없어요.

## 받게 되는 것

한 장짜리 카드 안에 이런 게 들어있어요:

- **이번 주 저장한 콘텐츠 수** (예: "47 things this week")
- **취향 분포** — Tech, Self-dev, Fitness, Comedy, Cooking, Finance 등 카테고리별 비율
- **갓생 지수** (0~100) — 자기계발/운동/요리/공부 비율
- **도파민 지수** (0~100) — 코미디/밈/숏폼/논쟁 비율
- **한 줄 하이라이트** — 본인 취향에 대한 짧은 농담 한 마디 (예: "8 hours of Rust content this week. You're embracing the borrow checker era.")

세로형 1080×1350 카드라서 인스타 스토리에 그대로 올라가요.

## 프라이버시

- **로그인 없음.** 누구인지 묻지 않아요.
- **저장하는 것:** 본인이 붙여넣은 URL과 영상 제목, AI가 분류한 카테고리 태그뿐.
- **저장 기간:** 마지막 활동 후 90일이 지나면 자동 삭제.
- **카드 공개 여부:** 기본 비공개. "공유" 버튼을 누를 때만 추측 불가능한 단축 URL로 공개됩니다.
- **분석 도구:** 없음. 광고 픽셀 없음. 데이터를 어디에도 팔지 않아요.

## 만든 사람

대부분의 사람들은 콘텐츠를 저장만 하고 다시 보지 않아요. 저장 버튼은 가득 차 있지만 한 번도 안 돌아가요. feeddiary는 그 저장 버튼 안에 뭐가 들었는지 한 장의 카드로 돌려드리는 도구예요.

만든 사람: [@dandanyoou](https://github.com/dandanyoou)
소스코드: [github.com/dandanyoou/feeddiary](https://github.com/dandanyoou/feeddiary) (MIT)

---

## 직접 돌려보기 (개발자용)

현재 v0 백엔드(인제스트 파이프라인 + 카드 PNG 렌더)는 완성됐고, 사용자 입력용 paste UI와 공유 페이지(`/c/[slug]`)는 다음 머지(T1~T11)로 들어옵니다. 그 사이에 로컬에서 돌려보고 싶으면 아래 순서대로 진행해주세요.

### 필요한 것

- Node 20+ 와 [Bun](https://bun.sh) (또는 npm/pnpm/yarn 아무거나)
- [Supabase](https://supabase.com) 프로젝트 — free tier로 충분
- [Anthropic API 키](https://console.anthropic.com) — Claude Sonnet 4.6 호출에 사용

### 1. 클론 + 의존성 설치

```bash
git clone https://github.com/dandanyoou/feeddiary
cd feeddiary
bun install
```

### 2. 환경변수 설정

`.env.local.example`을 `.env.local`로 복사하고 본인 키를 채워주세요.

```bash
cp .env.local.example .env.local
```

`.env.local` 내용:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_KEY`는 service role key입니다. **서버에서만 쓰이고, 절대 클라이언트에 노출되면 안 돼요.** Supabase 대시보드 → Project Settings → API → `service_role` 키.

### 3. Supabase 스키마 적용

Supabase 프로젝트의 SQL Editor를 열고 `supabase/migrations/0001_init.sql` 내용을 한 번 실행해주세요. `cards` + `items` 두 테이블이 생성됩니다.

### 4. 개발 서버 실행

```bash
bun run dev
```

http://localhost:3000 접속. (지금은 placeholder 페이지만 보입니다 — paste UI가 머지되기 전이라서요.)

### 5. 지금 상태에서 카드 만드는 법

paste UI가 들어오기 전까지는 API를 직접 호출해서 테스트해볼 수 있어요.

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "content-type: application/json" \
  -d '{
    "urls": [
      "https://www.youtube.com/watch?v=VIDEO_ID_1",
      "https://www.youtube.com/watch?v=VIDEO_ID_2",
      "https://www.youtube.com/watch?v=VIDEO_ID_3",
      "https://www.youtube.com/watch?v=VIDEO_ID_4",
      "https://www.youtube.com/watch?v=VIDEO_ID_5"
    ]
  }'
```

YouTube 영상 ID 5~50개가 필요해요. 응답으로 `{ "slug": "abc12345" }` 같은 8자 슬러그가 옵니다.

그러고 나서 카드 PNG는:

```
http://localhost:3000/api/og/<slug>
```

브라우저에서 열면 1080×1350 카드 이미지가 보여요. 그대로 다운받아서 인스타 스토리에 올려도 되고요.

샘플 데이터로 렌더만 미리 보고 싶으면:

```
http://localhost:3000/api/og/anyslug?preview=1
```

DB 안 거치고 mock 데이터로 카드만 그려줍니다.

### 테스트 + 타입 체크

```bash
bun run test         # vitest 한 번 실행
bun run test:watch   # 감시 모드
bun run typecheck    # tsc --noEmit
```

### 코드 구조

```
app/
  api/
    ingest/route.ts        POST — paste된 URL들을 카드 슬러그로 변환
    og/[slug]/route.tsx    GET — Satori로 1080×1350 PNG 렌더
  page.tsx                 (placeholder — paste UI 작업 중)
lib/
  claude.ts                Anthropic 호출 + 카테고리 분류
  youtube.ts               URL 파싱 + oEmbed 제목 가져오기
  metrics.ts               갓생/도파민 지수 계산
  card.ts                  Supabase 쓰기/읽기
  card-template.tsx        Satori 카드 JSX
  ratelimit.ts             IP 기반 슬라이딩 윈도우 (in-memory)
  slug.ts                  8-char base62 슬러그 생성
  __tests__/               각 모듈별 vitest 테스트
supabase/migrations/
  0001_init.sql            cards + items 테이블
mockups/
  warm.html                카드 HTML 시안
  satori-render.png        Satori 렌더 샘플
docs/planning/             설계 + 엔지니어링 문서 (아래 참고)
```

### 설계 문서

왜 이런 모습인지, 어떤 선택을 했는지는 `docs/planning/`에 다 적혀 있어요.

- [`design-v0-card-generator.md`](docs/planning/design-v0-card-generator.md) — 제품 설계 문서, Approach C "Legend-First" 채택 이유
- [`eng-plan-v0-paste-ui.md`](docs/planning/eng-plan-v0-paste-ui.md) — paste UI + 공유 페이지 엔지니어링 플랜 (5개 결정, 11개 태스크, 테스트 커버리지 다이어그램)
- [`test-plan-v0-paste-ui.md`](docs/planning/test-plan-v0-paste-ui.md) — QA용 테스트 플랜

### 다음 머지에 들어올 것 (T1~T11)

- `app/components/paste-form.tsx` — URL 붙여넣고 카드 만드는 폼 (검증, 로딩 타임라인, 에러 메시지)
- `app/c/[slug]/page.tsx` — 공유 페이지, OG 메타 태그로 트위터·디스코드 unfurl 지원
- `lib/error-messages.ts` — 서버 에러 코드를 한국어 메시지로 매핑
- Vitest + React Testing Library 셋업, 신규 컴포넌트 유닛 테스트
- Playwright e2e — paste→카드, 잘못된 슬러그(404), 입력 검증 3개 플로우

이게 들어오고 나면 위 5번 단계의 curl은 그냥 `/` 페이지에서 textarea에 붙여넣고 버튼 한 번 누르는 걸로 바뀝니다.

### 도움 / 이슈

뭔가 안 돌아가면 [GitHub Issues](https://github.com/dandanyoou/feeddiary/issues)에 알려주세요. 위 셋업 절차 따라하다 막힌 지점이 있으면 그것도 이슈로 환영합니다 — 문서 개선 포인트로 들어갑니다.
