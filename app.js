'use strict';
(() => {
const seed = window.P329_SEED;
if (!seed) { document.querySelector('#view').textContent='Planen kunde inte laddas.'; return; }
const KEY='project329-tracker-v1';
const DAYS=['Sön','Mån','Tis','Ons','Tor','Fre','Lör'];
const KINDS={easy:'Lugn löpning',recovery:'Återhämtning',quality:'Kvalitet',long:'Långpass',prehab:'Prehab',rest:'Vila',race:'Tävling',unplanned:'Inte fastställt'};
const SLEEP=['Bra','Blandad','Dålig'];
const PAIN=['Inga känningar','Lätta känningar','Tydlig smärta'];
const A=[['Bulgarian split squat','2 × 8/ben'],['Enbens rumänska marklyft','2 × 8/ben'],['Enbens vadpress','2 × 12/ben'],['Sidoplanka','2 × 30 sek/sida']];
const B=[['Step-down från lågt steg','2 × 8/ben'],['Vadpress med böjt knä','2 × 12/ben'],['Höftlyft','2 × 12'],['Tibialis raises mot vägg','2 × 15'],['Dead bug','2 × 8/sida']];
const def=()=>({logs:{},edits:{},reviews:{},prehab:{}});
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function load() {
  const data = def();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    for (const section of Object.keys(data)) {
      if (isRecord(saved?.[section])) data[section] = saved[section];
    }
  } catch {}
  return data;
}
let state=load(), tab='today', expanded='', editing='', toastTimer;
let planDraft = null, expectedPlanWeek = null, offlineStatus = 'Förbereder offlineläge …';
const dt=(s)=>new Date(s+'T12:00:00');
const iso=(d)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const today=()=>iso(new Date());
const shortDate=(s)=>new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short'}).format(dt(s));
const fullDate=(s)=>new Intl.DateTimeFormat('sv-SE',{weekday:'long',day:'numeric',month:'long'}).format(dt(s));
const svnum=(n)=>Number(n||0).toLocaleString('sv-SE',{maximumFractionDigits:2});
const escape=(x)=>String(x??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
function defaultWeek(){const t=today();let n=seed.weeks.find(x=>t>=x.monday && t<=x.sunday);return n?n.week:(t<seed.startDate?1:29);}
let selectedWeek=defaultWeek();
const current=()=>seed.weeks[selectedWeek-1];
const workout=(d)=>({...d,...(state.edits[d.date]||{})});
const log=(date)=>state.logs[date]||{};
function persist(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    state = next;
    return true;
  } catch {
    notify('Ändringen kunde inte sparas på enheten.');
    return false;
  }
}
function saveEntries(section, entries) {
  const next = load();
  next[section] = { ...next[section], ...entries };
  return persist(next);
}
function notify(msg){const node=document.querySelector('#toast');node.textContent=msg;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),3500);}
const planned=(w)=>w.days.reduce((t,d)=>t+(workout(d).confirmed?Number(workout(d).km||0):0),0);
const actual=(w)=>w.days.reduce((t,d)=>t+(log(d.date).status==='done'?Number(log(d.date).km||0):0),0);
const doneCount=(w)=>w.days.filter(d=>log(d.date).status==='done').length;
const plannedCount=(w)=>w.days.filter(d=>workout(d).confirmed).length;
const dayByDate = date => seed.weeks.flatMap(week => week.days).find(day => day.date === date);
const hasReview = review => /^(?:[1-9]|10)$/.test(review?.effort) &&
  SLEEP.includes(review.sleep) && PAIN.includes(review.pain);
const volume = day => day.confirmed ? Number(day.km || 0) : 0;
const validKm = (value, max) => Number.isFinite(value) && value >= 0 && value <= max;
const validKind = kind => typeof kind === 'string' && Object.hasOwn(KINDS, kind);
const summary=(w)=>{let a=actual(w),p=planned(w);return `<div class="stat-grid"><div class="stat"><div class="val">${svnum(p)}</div><div class="label">Planerade km</div></div><div class="stat"><div class="val">${svnum(a)}</div><div class="label">Utförda km</div></div><div class="stat"><div class="val">${doneCount(w)}/${plannedCount(w)}</div><div class="label">Pass klara</div></div></div><div class="bar-header"><strong>Veckans framsteg</strong><span>${p?Math.round(Math.min(a/p,1)*100):0}% av planerat</span></div><div class="progress"><div class="progress-fill" style="width:${p?Math.min(100,Math.max(0,a/p*100)):0}%"></div></div>`;};
const controls=(w)=>`<div class="range-nav"><button data-action="week-prev" ${selectedWeek===1?'disabled':''} aria-label="Föregående vecka">←</button><div style="text-align:center"><strong>Vecka ${w.week} av 29</strong><div class="small">${shortDate(w.monday)} – ${shortDate(w.sunday)}</div></div><button data-action="week-next" ${selectedWeek===29?'disabled':''} aria-label="Nästa vecka">→</button></div>`;
function overview(){const w=current();return `<section class="hero"><div class="eyebrow">DIN VÄG TILL STOCKHOLM</div><h2>Sub <span class="goal">3:30</span> börjar här.</h2><p>Start 9 november · 29 veckor · Hög volym först när kroppen är redo.</p></section>${controls(w)}${summary(w)}<div class="card"><div class="bar-header"><strong>Målkurva för veckan</strong><span>${w.week<=4?'Fastställd':'Preliminär'}</span></div><div style="font-size:27px;font-weight:850;letter-spacing:-1px">${svnum(w.targetKm)} <span style="font-size:15px;color:var(--muted)">km</span></div><p class="subtle">${escape(w.phase)} ${w.week>4?'Lägg in dagspass först efter föregående veckas avstämning.':''}</p></div>`;}
function prehabType(d){let s=(workout(d).title||'').toLowerCase();if(s.includes('prehab a')) return 'A';if(s.includes('prehab b')) return 'B';return null;}
function prehabBlock(d){let t=prehabType(d);if(!t) return '';let list=t==='A'?A:B;let isDone=state.prehab[d.date]||{};return `<div class="divider"></div><h3 style="font-size:13px;margin:10px 0">Prehab ${t} · övningslista</h3>${list.map((x,i)=>`<label class="prehab-exercise"><input type="checkbox" data-prehab-date="${d.date}" data-prehab-ex="${i}" ${isDone[i]?'checked':''}><span>${escape(x[0])} · <span class="muted">${escape(x[1])}</span></span></label>`).join('')}<p class="data-note">Övningarna kan bockas var för sig. Du behöver inte köra till utmattning.</p>`;}
function detailBlock(d){const s=workout(d), l=log(d.date),isUnplanned=!s.confirmed,editNow=editing===d.date;
return `<div class="day-details" id="day-${d.date}"><p>${escape(s.description)}</p>${prehabBlock(d)}
<div class="divider"></div>
<div class="two-col"><div class="form-row"><label for="log-km">Utförd distans (km)</label><input id="log-km" inputmode="decimal" data-field="km" type="number" min="0" max="200" step="0.01" value="${escape(l.km??(s.km||0))}"></div><div class="form-row"><label for="log-rpe">RPE, ansträngning 1–10</label><select id="log-rpe" data-field="rpe"><option value="">Välj</option>${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${Number(l.rpe)===(i+1)?'selected':''}>${i+1}</option>`).join('')}</select></div></div>
<div class="form-row"><label for="log-note">Notering (valfritt)</label><textarea id="log-note" data-field="note" placeholder="Hur kändes passet? Tempo, puls, stelhet...">${escape(l.note||'')}</textarea></div>
<div class="btn-row"><button class="btn primary" data-action="save-done" data-date="${d.date}">${l.status==='done'?'Spara ändringar ✓':'Markera klart ✓'}</button><button class="btn" data-action="save-skipped" data-date="${d.date}">Hoppade över</button></div>
<div class="btn-row"><button class="btn ghost" data-action="toggle-edit" data-date="${d.date}">${editNow?'Stäng planredigering':'Redigera planerat pass'}</button></div>
${editNow?`<div class="card" style="margin:12px 0 0;background:var(--panel2)"><div class="form-row"><label for="day-plan-title">Passtitel</label><input id="day-plan-title" data-plan="title" value="${escape(s.title)}"></div><div class="two-col"><div class="form-row"><label for="day-plan-km">Planerade km</label><input id="day-plan-km" inputmode="decimal" data-plan="km" type="number" min="0" max="100" step="0.1" value="${escape(s.km)}"></div><div class="form-row"><label for="day-plan-kind">Passtyp</label><select id="day-plan-kind" data-plan="kind">${Object.entries(KINDS).map(([key,val])=>`<option value="${key}" ${s.kind===key?'selected':''}>${escape(val)}</option>`).join('')}</select></div></div><div class="form-row"><label for="day-plan-description">Instruktion</label><textarea id="day-plan-description" data-plan="description">${escape(s.description)}</textarea></div><button class="btn primary" data-action="save-plan" data-date="${d.date}">Spara dagsplan</button></div>`:''}
${isUnplanned?'<p class="data-note">Preliminärt pass. Spara föregående veckas veckocheck innan du lägger till kilometer.</p>':''}
</div>`;}
function dayCard(d){const s=workout(d),l=log(d.date),date=dt(d.date);let active=expanded===d.date,finished=l.status==='done',unplanned=!s.confirmed;return `<article class="daycard ${finished?'done':''}"><button class="daycard-head" data-action="expand" data-date="${d.date}" aria-expanded="${active}" aria-label="${active ? 'Stäng' : 'Öppna'} pass ${escape(d.date)} · ${escape(s.title)}"><div class="day-date"><span>${DAYS[date.getDay()]}</span>${date.getDate()}</div><div class="checkmark">✓</div><div style="min-width:0;flex:1"><div class="day-title">${escape(s.title)}</div><div class="day-meta">${escape(KINDS[s.kind]||s.kind)}${l.status==='skipped'?' · Överhoppat':''}${d.date===today()?' · IDAG':''}</div></div><div class="day-tag ${unplanned?'none':''}">${unplanned?(s.kind==='race'?'42,2 km':'—'):s.km?`${svnum(s.km)} km`:'–'}</div><div style="color:var(--muted)">${active?'⌃':'⌄'}</div></button>${active?detailBlock(d):''}</article>`;}
function todayView(){const t=today();const w=seed.weeks.find(x=>t>=x.monday&&t<=x.sunday),d=w?w.days.find(x=>x.date===t):null;
if(t<seed.startDate)return `<div class="hero"><div class="eyebrow">SÖNDAG 8 NOVEMBER</div><h2>En lugn start på bandet.</h2><p>20–30 min lätt löpning, plant eller cirka 0–1 % lutning, RPE 2–3/10. Ingen intervallträning. Officiell vecka 1 börjar imorgon.</p></div><div class="section-title"><h2>Imorgon startar planen</h2><span class="badge">9 november</span></div>${dayCard(seed.weeks[0].days[0])}<div class="btn-row"><button class="btn primary" data-action="go-schedule">Visa vecka 1 →</button></div>`;
if(!w)return `<section class="hero"><div class="eyebrow">MARATONPLANEN</div><h2>Tack för jobbet!</h2><p>Datumet ligger efter 29-veckorsplanen. Alla dina loggar och rapporter finns kvar under Schema och Veckocheck.</p></section>`;
return `<div class="hero"><div class="eyebrow">${escape(fullDate(t).toUpperCase())}</div><h2>En dag i taget.</h2><p>Vecka ${w.week} av 29 · målfart 4:58/km på tävlingsdagen, inte på dagens lugna pass.</p></div><div class="section-title"><h2>Dagens pass</h2><span class="badge ${workout(d).confirmed?'':'future'}">${workout(d).confirmed?'Planerat':'Ej fastställt'}</span></div>${dayCard(d)}<div class="section-title"><h2>Den här veckan</h2><button class="btn ghost" data-action="go-schedule">Visa schema</button></div>${summary(w)}${plannedCount(w) < w.days.length ? `<div class="notice">En del pass kan fortfarande vara preliminära. Kontrollera föregående veckas återhämtning innan du ökar träningsmängden.</div>`:''}<div class="card"><h2>Veckans prioritet</h2><p class="subtle">${escape(w.phase)}</p></div>`;}
function scheduleView(){const w=current(),count=plannedCount(w);return `${overview()}<div class="section-title"><h2>Dag för dag</h2><span class="badge ${count===w.days.length?'':'future'}">${count===w.days.length?'Fast plan':count?'Delvis fastställd':'Preliminär'}</span></div>${w.days.map(dayCard).join('')}<p class="foot">Kilometer i den preliminära målkurvan är inte en instruktion att öka oavsett hälsotillstånd. Justera efter veckorapport, sömn och återhämtning.</p>`;}
function reportText(w){const review=state.reviews[w.week]||{};let lines=[`PROJECT 3:29 – VECKOCHECK V${w.week} (${w.monday}–${w.sunday})`,`Målvolym: ${svnum(w.targetKm)} km. Planerat dag för dag: ${svnum(planned(w))} km. Utfört: ${svnum(actual(w))} km.`,`Genomförda pass: ${doneCount(w)} av ${plannedCount(w)} fastställda.`,'', 'Pass:'];
for(const d of w.days){let s=workout(d),l=log(d.date);if(!s.confirmed&&!l.status)continue;lines.push(`- ${d.date}: ${s.title} (${svnum(s.km)} km plan). ${l.status==='done'?`Gjort: ${svnum(l.km)} km${l.rpe?`, RPE ${l.rpe}/10`:''}`:l.status==='skipped'?'Hoppat över':'Inte loggat'}${l.note?`. Kommentar: ${l.note}`:''}`);}
lines.push('',`Veckans upplevda belastning: ${review.effort||'Ej angiven'}/10`,`Sömn: ${review.sleep||'Ej angivet'}`,`Smärta/känningar: ${review.pain||'Ej angivet'}`,`Övrigt: ${review.note||'Inget angivet'}`,'','Analysera återhämtning och skaderisk. Anpassa nästa veckas exakta dag-för-dag-pass, volym, långpass, ev. lugna dubbelpass och hemmaprehab. Utgå från sub 3:30 som offensivt mål men prioritera kontinuitet. Ge gärna nästa veckoplan i JSON-format som passar mobilappens import: {"week":'+(w.week+1)+',"days":[{"date":"ÅÅÅÅ-MM-DD","title":"...","km":0,"kind":"easy|recovery|quality|long|prehab|rest","description":"..."}]}.' );return lines.join('\n');}
function reviewView(){let w=current(),r=state.reviews[w.week]||{};let t=today(),finished=t>=w.sunday;
return `${controls(w)}<div class="hero"><div class="eyebrow">SÖNDAGSCHECK · VECKA ${w.week}</div><h2>Så gick veckan.</h2><p>Sammanfatta måndag till söndag. Kopiera rapporten till din ChatGPT-konversation så anpassar vi nästa vecka.</p></div>${summary(w)}${!finished?`<div class="notice cool">Denna vecka avslutas ${fullDate(w.sunday)}. Du kan fylla i rapporten redan nu, men den blir mest rättvisande efter söndagens pass.</div>`:''}<div class="card"><h2>Återhämtningsfrågor</h2><div class="form-row"><label for="review-effort">Hur belastande var hela veckan? (1–10)</label><select id="review-effort"><option value="">Välj</option>${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${String(r.effort)===(String(i+1))?'selected':''}>${i+1} / 10</option>`).join('')}</select></div><div class="form-row"><label for="review-sleep">Sömn</label><select id="review-sleep"><option value="">Välj</option>${SLEEP.map(x=>`<option ${r.sleep===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-row"><label for="review-pain">Smärta eller skadekänningar</label><select id="review-pain"><option value="">Välj</option>${PAIN.map(x=>`<option ${r.pain===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-row"><label for="review-note">Övrigt</label><textarea id="review-note" placeholder="Puls, väder, energinivå, arbete, fot/vad/höft...">${escape(r.note||'')}</textarea></div><div class="btn-row"><button class="btn primary" data-action="save-review">Spara veckocheck</button><button class="btn" data-action="copy-report">Kopiera rapport</button></div>${w.week < seed.weeks.length ? `<div class="btn-row"><button class="btn ghost" data-action="open-plan-import">Importera plan för vecka ${w.week + 1} →</button></div>` : ''}</div><div class="card"><h2 id="report-heading">Förhandsvisning rapport</h2><textarea id="report-preview" aria-labelledby="report-heading" readonly rows="9">${escape(reportText(w))}</textarea><p class="data-note">Data lagras endast på den här enheten. Kopiera rapporten och klistra in i samma ChatGPT-konversation.</p></div>`;}
function settingsView() {
  const heading = expectedPlanWeek ? 'Importera plan för vecka ' + expectedPlanWeek : 'Importera nästa veckas plan';
  return `<section class="hero"><div class="eyebrow">DIN TRÄNINGSDATA</div><h2>Enkelt. Privat. Offline.</h2><p>Träningsdata sparas lokalt på enheten. Exportera en backup om du byter mobil eller webbadress.</p></section>
    <section class="card" id="plan-card">
      <h2>${heading}</h2>
      <p class="subtle">Spara föregående veckas veckocheck. Klistra sedan in JSON-planen från ChatGPT eller välj en JSON-fil.</p>
      <div class="form-row">
        <label for="plan-import">Veckoplan (JSON)</label>
        <textarea id="plan-import" rows="5" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder='{"week":5,"days":[…]}'></textarea>
      </div>
      <div class="btn-row">
        <button class="btn primary" data-action="preview-plan">Förhandsgranska</button>
        <label class="btn file-btn">Välj planfil<input type="file" id="import-plan-file" accept="application/json,.json"></label>
      </div>
      <p class="data-note">Ange 1–7 pass för samma vecka. Bara de angivna dagarna uppdateras.</p>
      <div id="plan-feedback" role="status"></div>
      <div id="plan-preview"></div>
    </section>
    <section class="card"><h2>Backup</h2><p class="subtle">Exportera loggar, prehab, veckocheckar och dina planändringar till en JSON-fil. Import återställer uppgifterna från den valda filen.</p><div class="btn-row"><button class="btn primary" data-action="export">Exportera backup</button><label class="btn file-btn">Importera backup<input type="file" id="import-backup" accept="application/json,.json"></label></div></section>
    <section class="card"><h2>Installera på mobilen</h2><p class="subtle"><strong>iPhone</strong> · Safari → Dela → Lägg till på hemskärmen. Välj Öppna som webbapp om alternativet visas.</p><p class="subtle"><strong>Android</strong> · Chrome → ⋮ → Installera app eller Lägg till på startskärmen.</p><p id="offline-status" class="data-note" role="status">${offlineStatus}</p></section>
    <section class="card"><h2>Prehab A · ca 25 min</h2>${A.map(x=>`<p class="subtle">• ${escape(x[0])} — ${escape(x[1])}</p>`).join('')}</section>
    <section class="card"><h2>Prehab B · ca 20 min</h2>${B.map(x=>`<p class="subtle">• ${escape(x[0])} — ${escape(x[1])}</p>`).join('')}</section>`;
}
function render() {
  document.querySelector('#view').innerHTML = tab === 'today' ? todayView() :
    tab === 'schedule' ? scheduleView() : tab === 'review' ? reviewView() : settingsView();
  document.querySelectorAll('[data-tab]').forEach(button => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function navigate(target) {
  tab = target;
  editing = '';
  expanded = '';
  planDraft = null;
  expectedPlanWeek = null;
  if (tab === 'today' && dayByDate(today())) expanded = today();
  render();
  window.scrollTo(0, 0);
}

function getDetail(date) {
  return document.getElementById('day-' + date);
}
function getVal(node,name,area='field'){let el=node?.querySelector(`[data-${area}="${name}"]`);return el?el.value:'';}
function saveDay(date, status) {
  const panel = getDetail(date);
  const km = Number(getVal(panel, 'km'));
  if (status === 'done' && !validKm(km, 200)) {
    notify('Ange en distans mellan 0 och 200 km.');
    return;
  }
  const entry = {
    status,
    km: status === 'done' ? km : 0,
    rpe: status === 'done' ? getVal(panel, 'rpe') : '',
    note: getVal(panel, 'note')
  };
  if (!saveEntries('logs', { [date]: entry })) return;
  notify(status === 'done' ? 'Passet sparat ✓' : 'Passet markerat som överhoppat');
  render();
}

function savePlan(date) {
  const day = dayByDate(date);
  const week = seed.weeks.find(week => date >= week.monday && date <= week.sunday);
  if (!day) return;
  const panel = getDetail(date);
  const title = getVal(panel, 'title', 'plan').trim();
  const km = Number(getVal(panel, 'km', 'plan'));
  const kind = getVal(panel, 'kind', 'plan');
  const description = getVal(panel, 'description', 'plan').trim();
  if (!title || !validKm(km, 100) || !validKind(kind)) {
    notify('Kontrollera titel, distans och passtyp.');
    return;
  }
  state = load();
  if (date >= today() && km > volume(workout(day)) && week.week > 1 && !hasReview(state.reviews[week.week - 1])) {
    notify(`Spara en komplett veckocheck för vecka ${week.week - 1} först.`);
    return;
  }
  if (!saveEntries('edits', { [date]: { title, km, kind, description, confirmed: true } })) return;
  editing = '';
  notify('Dagsplan uppdaterad.');
  render();
}

function saveReview() {
  const entry = {
    effort: document.querySelector('#review-effort').value,
    sleep: document.querySelector('#review-sleep').value,
    pain: document.querySelector('#review-pain').value,
    note: document.querySelector('#review-note').value
  };
  if (!saveEntries('reviews', { [selectedWeek]: entry })) return false;
  notify('Veckocheck sparad.');
  render();
  return true;
}
async function copyText(s){try{if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(s);notify('Rapporten kopierad till urklipp.');return;}let ta=document.querySelector('#report-preview');if(ta){ta.value=s;ta.focus();ta.select();if(document.execCommand('copy')){notify('Rapporten kopierad.');return;}}notify('Markera rapporten och kopiera manuellt.');}catch(e){notify('Kopiering misslyckades. Markera texten och kopiera manuellt.');}}
function downloadJson(){let blob=new Blob([JSON.stringify({app:'project329',version:1,exportedAt:new Date().toISOString(),data:load()},null,2)],{type:'application/json'});let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='project329-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup exporterad.');}
function readPlan(text) {
  let data;
  try {
    data = JSON.parse(text.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1'));
  } catch {
    throw new Error('JSON-texten gick inte att läsa. Kontrollera att hela planen är med.');
  }
  if (!isRecord(data) || !Number.isInteger(data.week) || data.week < 1 || data.week > seed.weeks.length ||
      !Array.isArray(data.days) || data.days.length < 1 || data.days.length > 7) {
    throw new Error('Ange vecka 1–29 och 1–7 dagspass.');
  }
  if (expectedPlanWeek && data.week !== expectedPlanWeek) {
    throw new Error(`Den här veckochecken gäller import för vecka ${expectedPlanWeek}.`);
  }
  const week = seed.weeks[data.week - 1];
  const allowed = new Set(week.days.map(day => day.date));
  const edits = {};
  const now = today();
  for (const day of data.days) {
    if (!isRecord(day) || !allowed.has(day.date) || Object.hasOwn(edits, day.date) ||
        typeof day.title !== 'string' || !day.title.trim() ||
        typeof day.description !== 'string' || !validKind(day.kind) || day.kind === 'unplanned' ||
        (typeof day.km !== 'number' && !(typeof day.km === 'string' && day.km.trim())) ||
        !validKm(Number(day.km), 100)) {
      throw new Error('Kontrollera passfälten, distansen och att varje datum tillhör veckan och anges en gång.');
    }
    if (day.date < now || state.logs[day.date]?.status ||
        Object.values(state.prehab[day.date] || {}).some(Boolean)) {
      throw new Error(`${fullDate(day.date)} är passerad eller redan loggad. Ta bort den dagen ur importen.`);
    }
    edits[day.date] = { title: day.title.trim().slice(0, 120), km: Number(day.km), kind: day.kind,
      description: day.description.slice(0, 900), confirmed: true };
  }
  if (week.week > 1 && !hasReview(state.reviews[week.week - 1])) {
    throw new Error(`Spara belastning, sömn och smärta i veckochecken för vecka ${week.week - 1} först.`);
  }
  return { week, edits };
}

function clearPlanPreview() {
  planDraft = null;
  document.querySelector('#plan-feedback').textContent = '';
  document.querySelector('#plan-preview').replaceChildren();
}

function previewPlan(apply = false) {
  const text = document.querySelector('#plan-import').value;
  const previous = planDraft;
  clearPlanPreview();
  state = load();
  try {
    const { week, edits } = readPlan(text);
    const before = planned(week);
    const after = week.days.reduce((total, day) => total + volume(edits[day.date] || workout(day)), 0);
    const draft = { text, before, after };
    if (apply && previous?.text === text && previous.before === before && previous.after === after) {
      if (!saveEntries('edits', edits)) {
        document.querySelector('#plan-feedback').textContent = 'Planen kunde inte sparas. Förhandsgranska och försök igen.';
        return;
      }
      selectedWeek = week.week;
      navigate('schedule');
      notify(`Vecka ${week.week} uppdaterad. ${Object.keys(edits).length} dagspass sparade.`);
      return;
    }
    planDraft = draft;
    const days = Object.entries(edits).sort(([a], [b]) => a.localeCompare(b));
    const feedback = document.querySelector('#plan-feedback');
    feedback.textContent =
      `Vecka ${week.week} · planerad volym ${svnum(before)} → ${svnum(after)} km.`;
    document.querySelector('#plan-preview').innerHTML = `<ul class="plan-days">${days.map(([date, day]) =>
      `<li>${shortDate(date)} · ${escape(day.title)} · ${svnum(day.km)} km</li>`).join('')}</ul>
      <button class="btn primary" data-action="apply-plan">Spara ${days.length} dagspass i vecka ${week.week}</button>`;
    feedback.scrollIntoView({ block: 'nearest' });
  } catch (error) {
    const feedback = document.querySelector('#plan-feedback');
    feedback.textContent = error.message;
    feedback.scrollIntoView({ block: 'nearest' });
  }
}

async function restoreBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    const data = backup?.data;
    if (backup?.app !== 'project329' || !isRecord(data)) throw new Error('Ogiltig backup');
    const { logs, edits, reviews, prehab = {} } = data;
    const next = { logs, edits, reviews, prehab };
    if (Object.values(next).some(entries => !isRecord(entries) ||
        Object.values(entries).some(entry => !isRecord(entry)))) throw new Error('Ogiltig post');
    if (Object.values(edits).some(entry => typeof entry.title !== 'string' || !validKm(entry.km, 100)) ||
        Object.values(logs).some(entry => !validKm(entry.km, 200))) throw new Error('Ogiltig distans eller plan');
    if (!confirm('Ersätt enhetens loggar, prehab, veckocheckar och planändringar med backupfilens data?')) return;
    if (!persist(next)) return;
    planDraft = null;
    notify('Backup återställd.');
    render();
  } catch {
    notify('Kunde inte importera backupfilen.');
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action], [data-tab]');
  if (!button) return;
  if (button.dataset.tab) {
    navigate(button.dataset.tab);
    return;
  }
  const { action, date } = button.dataset;
  switch (action) {
    case 'week-prev':
    case 'week-next':
      selectedWeek += action === 'week-prev' ? -1 : 1;
      expanded = '';
      editing = '';
      render();
      break;
    case 'go-schedule': selectedWeek = defaultWeek(); navigate('schedule'); break;
    case 'expand':
      expanded = expanded === date ? '' : date;
      editing = '';
      render();
      break;
    case 'toggle-edit': editing = editing === date ? '' : date; render(); break;
    case 'save-done': saveDay(date, 'done'); break;
    case 'save-skipped': saveDay(date, 'skipped'); break;
    case 'save-plan': savePlan(date); break;
    case 'save-review': saveReview(); break;
    case 'copy-report': if (saveReview()) copyText(reportText(current())); break;
    case 'open-plan-import':
      navigate('settings');
      expectedPlanWeek = selectedWeek + 1;
      render();
      document.querySelector('#plan-card').scrollIntoView({ block: 'start' });
      break;
    case 'export': downloadJson(); break;
    case 'preview-plan': previewPlan(); break;
    case 'apply-plan': previewPlan(true); break;
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'plan-import') clearPlanPreview();
});

document.addEventListener('change', async event => {
  const input = event.target;
  if (input.matches('[data-prehab-date]')) {
    const { prehabDate, prehabEx } = input.dataset;
    const entry = { ...load().prehab[prehabDate], [prehabEx]: input.checked };
    if (!saveEntries('prehab', { [prehabDate]: entry })) input.checked = !input.checked;
    return;
  }
  if (input.id !== 'import-backup' && input.id !== 'import-plan-file') return;
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  if (input.id === 'import-backup') {
    await restoreBackup(file);
    return;
  }
  try {
    const text = await file.text();
    if (!input.isConnected) return;
    document.querySelector('#plan-import').value = text;
    previewPlan();
  } catch {
    notify('Planfilen kunde inte läsas.');
  }
});

function setOfflineStatus(message) {
  offlineStatus = message;
  const label = document.querySelector('#offline-status');
  if (label) label.textContent = message;
}

if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
  const worker = navigator.serviceWorker;
  const ready = () => setOfflineStatus('Redo för offline på den här enheten.');
  if (worker.controller) ready();
  worker.addEventListener('controllerchange', ready);
  worker.register('./sw.js').then(registration => {
    const installing = registration.installing;
    if (!installing || worker.controller) return;
    installing.addEventListener('statechange', () => {
      if (installing.state === 'redundant' && !worker.controller) {
        setOfflineStatus('Offlineläget kunde inte förberedas. Öppna appen igen när du är online.');
      }
    });
  }).catch(() => setOfflineStatus('Offlineläget kunde inte förberedas. Öppna appen igen när du är online.'));
} else {
  setOfflineStatus('Öppna appens HTTPS-adress för att aktivera offlineläget.');
}
render();
})();
