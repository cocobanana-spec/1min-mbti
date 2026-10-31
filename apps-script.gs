// 1분 MBTI 통계 수집용 Google Apps Script. 스프레드시트의 확장 프로그램 > Apps Script에 붙여넣고 웹 앱으로 배포
const SHEET_NAME = 'events';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['created_at', 'session', 'type', 'mbti', 'seconds']);
  }
  return sh;
}

// 랜딩페이지가 보내는 기록을 한 줄씩 추가
function doPost(e) {
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    const type = String(d.type || '');
    if (['visit', 'result', 'timeout'].indexOf(type) < 0) return out_({ ok: false, error: 'bad type' });
    const mbti = /^[EI][NS][TF][JP]$/.test(String(d.mbti || '')) ? d.mbti : '';
    if (type === 'result' && !mbti) return out_({ ok: false, error: 'bad mbti' });
    const seconds = Number(d.seconds);
    const lock = LockService.getScriptLock();
    lock.tryLock(5000);
    sheet_().appendRow([new Date(), String(d.session || '').slice(0, 64), type, mbti, seconds >= 1 && seconds <= 600 ? seconds : '']);
    lock.releaseLock();
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

// 관리자 페이지가 읽어가는 집계
function doGet(e) {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const visitors = {};
  let pageviews = 0, results = 0, timeouts = 0, secSum = 0, since = null;
  const by = {};
  for (let i = 0; i < rows.length; i++) {
    const created = rows[i][0], session = rows[i][1], type = rows[i][2], mbti = rows[i][3], seconds = rows[i][4];
    if (created && (!since || created < since)) since = created;
    if (type === 'visit') { pageviews++; visitors[session] = 1; }
    else if (type === 'result') { results++; secSum += Number(seconds) || 0; if (mbti) by[mbti] = (by[mbti] || 0) + 1; }
    else if (type === 'timeout') timeouts++;
  }
  return out_({
    visitors: Object.keys(visitors).length,
    pageviews: pageviews,
    results: results,
    timeouts: timeouts,
    avg_seconds: results ? Math.round(secSum / results * 10) / 10 : null,
    by_type: by,
    since: since ? new Date(since).toISOString() : null,
  });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
