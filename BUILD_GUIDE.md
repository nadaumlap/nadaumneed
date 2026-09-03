# 나다움 설계 리포트 · 빌드/배포 가이드

## 구조

- 저장소의 `report/index.html` 은 Supabase 자격증명이 **빈 값**으로 유지된다.
- 배포 시 GitHub Actions 가 `build.js` 를 실행해 Secrets 의 값을 주입한다.
- 자격증명은 저장소 어디에도 커밋되지 않는다.

배포 주소: **https://nadaumlap.github.io/nadaumneed/report/**

## 최초 1회 설정

### 1. GitHub Secrets

저장소 → Settings → Secrets and variables → Actions → New repository secret

| 이름 | 값 |
|------|-----|
| `SUPABASE_URL` | Supabase → Settings → API 의 Project URL |
| `SUPABASE_KEY` | 같은 화면의 anon public key |

### 2. GitHub Pages 소스

Settings → Pages → Source: **Deploy from a branch** → Branch: **gh-pages** / **/ (root)**

> `gh-pages` 브랜치는 첫 배포가 끝나야 목록에 나타난다.
> Custom domain 은 **비워 둘 것**. (nadaum.dev 는 현재 DNS 미등록 상태 — 값을 넣으면 사이트 전체가 접속 불가가 된다.)

### 3. Supabase 테이블 + 보안 정책

Supabase → SQL Editor 에서 `supabase/setup.sql` 전체를 붙여넣고 실행.
RLS(Row Level Security)가 켜져야 anon key 로 남의 데이터를 볼 수 없다. **생략 금지.**

### 4. Supabase 인증 주소 (회원가입 필수)

Authentication → URL Configuration

- **Site URL**: `https://nadaumlap.github.io/nadaumneed/report/`
- **Redirect URLs** 에 추가: `https://nadaumlap.github.io/nadaumneed/report/`

이 설정이 없으면 매직링크 메일은 발송되지만 링크를 눌러도 로그인되지 않는다.

## 이후 운영

`main` 에 푸시하면 자동으로 빌드 → `gh-pages` 배포된다. 별도 조작 없음.

```bash
git add .
git commit -m "내용 수정"
git push
```

Secrets 만 바꿨을 때는 빈 커밋으로 재배포한다.

```bash
git commit --allow-empty -m "redeploy"
git push
```

## 로컬 확인

```bash
cp .env.example .env     # 값 채우기
node build.js
python -m http.server 8000
```

`http://localhost:8000/report/` 에서 확인. **작업 후 `git checkout report/index.html` 로 되돌릴 것** (자격증명이 커밋되지 않도록).

## 자격증명 구분

- `anon public key` — 클라이언트 노출 전제. RLS 로 보호. 지금 쓰는 키.
- `service_role key` — 모든 권한. **절대 클라이언트/저장소에 넣지 않는다.**

## 점검

| 증상 | 확인할 것 |
|------|-----------|
| 가입 UI가 아예 안 보임 | AUTH 주입 실패 → Actions 로그의 "Verify injection" |
| 메일은 오는데 로그인 안 됨 | Supabase Redirect URLs |
| 로그인은 되는데 기록 동기화 안 됨 | `setup.sql` 실행 여부, RLS 정책 |
| 사이트 자체가 안 열림 | Pages Custom domain 이 비어 있는지 |
