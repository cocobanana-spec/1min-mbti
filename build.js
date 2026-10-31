// 유형별 공유 결과 페이지(r/TYPE/index.html)와 미리보기 이미지(og/TYPE.png)를 생성하는 빌드 스크립트. node build.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const SITE = 'https://cocobanana-spec.github.io/1min-mbti/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = __dirname;

// index.html에서 TAGLINE을 그대로 읽어와 문구 중복 관리를 피함
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const TAGLINE = eval('(' + index.slice(index.indexOf('const TAGLINE = {') + 'const TAGLINE = '.length, index.indexOf('};', index.indexOf('const TAGLINE'))) + '})');
const TYPES = Object.keys(TAGLINE);
if (TYPES.length !== 16) throw new Error('TAGLINE 16개가 아님: ' + TYPES.length);

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@700;900&display=swap">';

// 미리보기 이미지 템플릿 (1200x630)
function ogCard({ type, tagline, isDefault }) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">${FONTS}<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:#FFD400;color:#000;font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;justify-content:space-between;padding:56px 64px;box-sizing:border-box}
  .mark{font-weight:900;font-size:30px;display:flex;justify-content:space-between;align-items:center}
  .mark span:last-child{font-size:24px;color:#6E5F00}
  .type{font-family:'Black Han Sans',sans-serif;font-size:${isDefault ? 150 : 300}px;line-height:${isDefault ? 1 : .9};letter-spacing:-.03em;margin:0;transform:rotate(-2deg);transform-origin:left bottom}
  .tag{font-weight:700;font-size:40px;line-height:1.3;word-break:keep-all;max-width:1000px;margin:0}
  </style></head><body>
  <div class="mark"><span>1분 MBTI</span><span>${isDefault ? '질문 최대 6개, 문제당 10초' : '너도 1분 안에 해봐'}</span></div>
  <h1 class="type">${isDefault ? '1분 안에<br>끝내는 MBTI' : type}</h1>
  <p class="tag">${esc(tagline)}</p>
  </body></html>`;
}

// 공유 결과 페이지 템플릿
function resultPage({ type, tagline }) {
  const title = `나 ${type} 나옴 (1분 MBTI)`;
  const url = `${SITE}r/${type}/`;
  const img = `${SITE}og/${type}.png`;
  return `<!DOCTYPE html>
<!-- ${type} 공유용 결과 페이지. build.js가 생성하므로 직접 수정하지 말 것 -->
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(tagline)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="1분 MBTI">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(tagline)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(tagline)}">
<meta name="twitter:image" content="${img}">
${FONTS}
<style>
  :root{--bg:#000;--fg:#FFD400;--display:'Black Han Sans','Noto Sans KR',system-ui,sans-serif;--body:'Noto Sans KR',system-ui,sans-serif;color-scheme:dark}
  *{box-sizing:border-box}html,body{height:100%;margin:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--body);font-weight:700;line-height:1.4;-webkit-font-smoothing:antialiased}
  .screen{min-height:100%;max-width:560px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:28px;display:flex;flex-direction:column;justify-content:center;gap:24px}
  .verdict{font-size:16px;margin:0;opacity:.8}
  .type{font-family:var(--display);font-size:clamp(110px,34vw,190px);line-height:.85;margin:0;letter-spacing:-.03em}
  .tagline{font-size:22px;margin:0;word-break:keep-all;text-wrap:balance}
  .btn{font-family:var(--display);font-size:30px;line-height:1;padding:20px 24px;border:4px solid var(--fg);background:var(--fg);color:var(--bg);text-decoration:none;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:8px 8px 0 0 #3a3200;margin-top:8px}
  .btn:active{transform:translate(6px,6px);box-shadow:2px 2px 0 0 #3a3200}
  .btn:focus-visible{outline:4px dashed var(--fg);outline-offset:4px}
  .small{font-size:14px;margin:0;opacity:.7}
</style>
</head>
<body>
<main class="screen">
  <p class="verdict" id="verdict">친구의 1분 MBTI 결과</p>
  <h1 class="type">${type}</h1>
  <p class="tagline">${esc(tagline)}</p>
  <a class="btn" href="../../"><span>나도 1분 안에 해보기</span><span aria-hidden="true">→</span></a>
  <p class="small">질문 최대 6개, 문제당 10초. 고민하는 순간 끝난다.</p>
</main>
<script>
  // ?s=초 가 있으면 소요 시간을 보여줌
  const s = parseInt(new URLSearchParams(location.search).get('s'), 10);
  if (s > 0 && s < 600) document.getElementById('verdict').textContent = '친구는 ' + s + '초 만에 ' + '${type}' + ' 판정';
</script>
</body>
</html>
`;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mbti-og-'));
fs.mkdirSync(path.join(ROOT, 'og'), { recursive: true });

const cards = [{ type: 'default', tagline: '고민하는 순간 끝난다. 첫 느낌이 정답이야.', isDefault: true },
  ...TYPES.map(type => ({ type, tagline: TAGLINE[type], isDefault: false }))];

for (const card of cards) {
  const html = path.join(tmp, card.type + '.html');
  fs.writeFileSync(html, ogCard(card));
  const out = path.join(ROOT, 'og', card.type + '.png');
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,630',
    '--virtual-time-budget=2500', `--screenshot=${out}`, 'file://' + html], { stdio: 'ignore' });
  process.stdout.write(`og/${card.type}.png `);
}
console.log();

for (const type of TYPES) {
  const dir = path.join(ROOT, 'r', type);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), resultPage({ type, tagline: TAGLINE[type] }));
}
console.log(`r/ 결과 페이지 ${TYPES.length}개 생성`);
