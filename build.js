/* 나다움 설계 리포트 · 빌드 스크립트
   환경변수(SUPABASE_URL, SUPABASE_KEY)를 report/index.html의 AUTH 설정에 주입한다.
   저장소에는 빈 값으로 유지되고, 빌드 시점에만 실제 값이 들어간다. */
const fs = require('fs');
const path = require('path');

// 로컬 개발용 .env 로드 (있을 때만)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

const URL = process.env.SUPABASE_URL || '';
const KEY = process.env.SUPABASE_KEY || '';

if (!URL || !KEY) {
  console.error('[build] SUPABASE_URL / SUPABASE_KEY 가 없습니다.');
  console.error('[build] 로컬: .env 파일 생성 / GitHub: Settings > Secrets 등록');
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(URL)) {
  console.error('[build] SUPABASE_URL 형식이 올바르지 않습니다:', URL);
  process.exit(1);
}

const target = path.join(__dirname, 'report', 'index.html');
let html = fs.readFileSync(target, 'utf8');

const re = /const\s+AUTH\s*=\s*\{\s*url\s*:\s*'[^']*'\s*,\s*key\s*:\s*'[^']*'\s*,/;
if (!re.test(html)) {
  console.error('[build] AUTH 설정 줄을 찾지 못했습니다. report/index.html 구조를 확인하세요.');
  process.exit(1);
}

html = html.replace(re, "const AUTH={url:'" + URL.replace(/\/$/, '') + "', key:'" + KEY + "',");
fs.writeFileSync(target, html, 'utf8');

console.log('[build] 주입 완료');
console.log('[build] URL:', URL);
console.log('[build] KEY:', KEY.slice(0, 12) + '…(' + KEY.length + '자)');
