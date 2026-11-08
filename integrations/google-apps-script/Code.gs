/**
 * KOMI Towers — Google Sheets recruitment receiver.
 * Deploy as a Google Apps Script Web app:
 * Execute as: Me; Who has access: Anyone.
 * The spreadsheet stays private. The endpoint only accepts POSTs;
 * it never provides sheet data to visitors.
 *
 * Public endpoints can receive spam. Use a CAPTCHA/managed form backend
 * if abuse becomes an issue; the honeypot and rate-limiting here are basic.
 */
const SPREADSHEET_ID = '1Yahxmyxloy2PrQM0lZizHYk-l_tAAJ0XX53dk6TnUHo';
const SHEET_NAME = 'Jelentkezők';
const MAX = {full_name:120,email:254,phone:60,country:100,available_from:20,crew_size:4,details:2000};
const ALLOWED = {
  applicant_type: ['individual','crew','starter'],
  experience: ['tower','heights','none'],
  language: ['en','hu','sk']
};

function doGet() {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta charset="utf-8"></head><body><p>KOMI Towers recruitment submission endpoint. Use the application form at <a href="https://komitowers.com/work-with-us.html">komitowers.com</a>.</p></body></html>'
  );
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p['bot-field']) return result_('ok');
    const val = key => safe_(p[key], MAX[key] || 80);
    const name=val('full_name'), email=val('email'), phone=val('phone'), country=val('country');
    const type=val('applicant_type'), exp=val('experience'), lang=val('language') || 'en';
    const privacy=val('privacy_acknowledged');
    if (!name || !email || !phone || !country || privacy!=='yes' ||
        !ALLOWED.applicant_type.includes(type) ||
        !ALLOWED.experience.includes(exp) ||
        !ALLOWED.language.includes(lang) ||
        !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
        !/^\\+?[0-9 ()\\-]{6,60}$/.test(phone)) return result_('invalid',lang);
    const available=val('available_from'), team=val('crew_size'), details=val('details');
    if (available && !/^\\d{4}-\\d{2}$/.test(available)) return result_('invalid',lang);
    if (team && (!/^\\d{1,3}$/.test(team) || +team<1 || +team>100)) return result_('invalid',lang);

    const cache=CacheService.getScriptCache();
    const key='r:'+Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,email.toLowerCase())).slice(0,32);
    if (cache.get(key)) return result_('duplicate',lang);

    const lock=LockService.getScriptLock();
    if (!lock.tryLock(15000)) return result_('retry',lang);
    try {
      const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      if (!sheet) throw new Error('Sheet not found');
      sheet.appendRow([
        new Date(),name,email,phone,country,type,exp,available,team,
        details,lang,'yes','Új',''
      ]);
      cache.put(key,'1',60);
    } finally {
      lock.releaseLock();
    }
    return result_('ok',lang);
  } catch (error) {
    console.error('Recruitment form error: '+error);
    return result_('retry','en');
  }
}

// Avoid formula evaluation in Google Sheets for untrusted text.
function safe_(raw,maxlen) {
  let s=String(raw==null?'':raw).trim().slice(0,maxlen);
  if (/^[=+\\-@]/.test(s)) s="'"+s;
  return s;
}

function result_(status,lang) {
  const messages={
    en:{ok:['Thank you!','Your application was received.'],invalid:['Please check your details','Return to the form and fill in the required fields.'],duplicate:['Already received','Please wait a minute before submitting again.'],retry:['Please try again','Your application could not be saved. Please try again later.']},
    hu:{ok:['Köszönjük!','Jelentkezésed megérkezett.'],invalid:['Ellenőrizd az adatokat!','Lépj vissza, és töltsd ki a kötelező mezőket.'],duplicate:['Jelentkezésed már beérkezett','Újraküldés előtt várj egy percet.'],retry:['Próbáld újra!','Nem sikerült elmenteni a jelentkezésedet. Kérjük, próbáld újra később.']},
    sk:{ok:['Ďakujeme!','Vaša žiadosť bola prijatá.'],invalid:['Skontrolujte údaje','Vráťte sa a vyplňte povinné polia.'],duplicate:['Žiadosť už bola prijatá','Pred ďalším odoslaním počkajte minútu.'],retry:['Skúste to znova','Žiadosť sa nepodarilo uložiť. Skúste to neskôr.']}
  };
  lang=messages[lang]?lang:'en';
  const [title,message]=messages[lang][status]||messages[lang].retry;
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>KOMI Towers</title><style>body{background:#07131d;color:white;font:18px Arial;text-align:center;display:grid;place-items:center;min-height:90vh}h1,a{color:#f4b323}main{max-width:600px;padding:24px}</style></head>'+
    '<body><main><h1>'+title+'</h1><p>'+message+'</p><a href="https://komitowers.com/work-with-us.html?lang='+lang+'">KOMI Towers</a></main></body></html>'
  );
}
