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

// 앞뒤 공백·따옴표·줄바꿈 제거 (붙여넣기 사고 방지)
const clean = v => String(v || '').trim().replace(/^['"]|['"]$/g, '').trim();
const URL = clean(process.env.SUPABASE_URL).replace(/\/+$/, '');
const KEY = clean(process.env.SUPABASE_KEY);

function fail(msg, how) {
  console.error('::error::' + msg);
  if (how) console.error('[해결] ' + how);
  process.exit(1);
}

if (!URL || !KEY) {
  fail('SUPABASE_URL / SUPABASE_KEY 가 비어 있습니다.',
       'GitHub 저장소 Settings > Secrets and variables > Actions 에서 두 값을 등록하세요.');
}

// 값이 서로 바뀐 경우
if (URL.startsWith('sb_') || URL.startsWith('eyJ')) {
  fail('SUPABASE_URL 자리에 API 키가 들어가 있습니다.',
       'SUPABASE_URL 에는 https://<프로젝트ID>.supabase.co 주소를, SUPABASE_KEY 에는 sb_publishable_ 로 시작하는 키를 넣으세요.');
}
if (KEY.startsWith('http')) {
  fail('SUPABASE_KEY 자리에 주소가 들어가 있습니다.',
       'SUPABASE_KEY 에는 sb_publishable_ 로 시작하는 키를 넣으세요.');
}

// 절대 클라이언트에 노출하면 안 되는 키
if (KEY.startsWith('sb_secret_') || KEY.includes('service_role')) {
  fail('SUPABASE_KEY 에 secret key(service_role)가 들어갔습니다. 이 키는 공개되면 DB 전체가 노출됩니다.',
       'Supabase > Settings > API Keys 의 Publishable key(sb_publishable_...)로 교체하세요.');
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(URL)) {
  fail('SUPABASE_URL 형식이 올바르지 않습니다. (길이 ' + URL.length + '자, https:// 로 시작: ' + URL.startsWith('https://') + ')',
       '형식은 https://<프로젝트ID>.supabase.co 입니다. 앞뒤 공백이나 끝의 / 가 없는지 확인하세요.');
}

const target = path.join(__dirname, 'report', 'index.html');
let html = fs.readFileSync(target, 'utf8');

const re = /const\s+AUTH\s*=\s*\{\s*url\s*:\s*'[^']*'\s*,\s*key\s*:\s*'[^']*'\s*,/;
if (!re.test(html)) {
  fail('report/index.html 에서 AUTH 설정 줄을 찾지 못했습니다.',
       "const AUTH={url:'', key:'', ... 형태의 줄이 있는지 확인하세요.");
}

html = html.replace(re, "const AUTH={url:'" + URL + "', key:'" + KEY + "',");
fs.writeFileSync(target, html, 'utf8');

console.log('[build] 주입 완료');
console.log('[build] URL 호스트:', URL.replace('https://', '').split('.')[0]);
console.log('[build] KEY 종류:', KEY.startsWith('sb_publishable_') ? 'publishable (정상)' : '기타');
