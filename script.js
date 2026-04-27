/* =============================================
   DAMIETTA SC — script.js v2
   All bugs fixed, Multi-Page ready
   ============================================= */

// ===== SAFE STORAGE (fix: Safari private mode) =====
const store = {
  get(k, fallback = null) {
    try { const v = localStorage.getItem(k); return v !== null ? v : fallback; }
    catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};

// ===== STATE =====
let currentLang  = store.get('dsc_lang', 'ar');
let currentTheme = store.get('dsc_theme', 'mixed');
if (currentTheme === 'dark') currentTheme = 'mixed'; // dark removed

// ===== ARIA LIVE ANNOUNCER =====
function announce(msg) {
  const el = document.getElementById('srAnnounce');
  if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); }
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme, false);
  applyLang(currentLang, false);

  initThemeSwitcher();
  initLangToggle();
  initNavbar();
  initHamburger();
  initActiveNav();
  initRevealAnimations();

  // Page-specific inits
  if (document.getElementById('particles'))      initParticles();
  if (document.getElementById('countdownTimer')) initCountdown();
  if (document.querySelector('.news-filter'))    initNewsFilter();
  if (document.querySelector('.position-filter'))initPlayerFilter();
  if (document.getElementById('contactForm'))    initContactForm();
  if (document.getElementById('pollOptions'))    initPoll();
  if (document.querySelector('.newsletter-form'))initNewsletter();
  if (document.querySelector('.reg-form'))       initRegForm();
});

// ===== THEME =====
function initThemeSwitcher() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
}

function applyTheme(theme, save = true) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  if (save) {
    store.set('dsc_theme', theme);
    const labels = { mixed: 'وضع مختلط', light: 'وضع فاتح' };
    announce(labels[theme] || theme);
  }
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === theme);
  });
}

// ===== LANGUAGE =====
function initLangToggle() {
  const btn = document.getElementById('langToggle');
  if (btn) btn.addEventListener('click', () => applyLang(currentLang === 'ar' ? 'en' : 'ar'));
}

function applyLang(lang, save = true) {
  currentLang = lang;
  if (save) store.set('dsc_lang', lang);

  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'ar' ? 'EN' : 'AR';

  // Translate text nodes
  document.querySelectorAll('[data-ar][data-en]').forEach(el => {
    const txt = el.getAttribute(`data-${lang}`);
    if (txt !== null) el.textContent = txt;
  });

  // Translate placeholders (fix: was missing data-en-placeholder in v1)
  document.querySelectorAll('[data-ar-placeholder][data-en-placeholder]').forEach(el => {
    el.setAttribute('placeholder', el.getAttribute(`data-${lang}-placeholder`));
  });

  // Update page title
  const titleAr = document.querySelector('meta[name="title-ar"]');
  const titleEn = document.querySelector('meta[name="title-en"]');
  if (titleAr && titleEn) {
    document.title = lang === 'ar' ? titleAr.content : titleEn.content;
  }

  if (save) announce(lang === 'ar' ? 'تم التحويل إلى العربية' : 'Switched to English');
}

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ===== HAMBURGER =====
function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);          // fix: aria-expanded
    const [s1, s2, s3] = btn.querySelectorAll('span');
    s1.style.transform = isOpen ? 'rotate(45deg) translate(5px,5px)'  : '';
    s2.style.opacity   = isOpen ? '0' : '';
    s3.style.transform = isOpen ? 'rotate(-45deg) translate(5px,-5px)': '';
  });

  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity=''; });
    });
  });

  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===== ACTIVE NAV (Multi-Page fix) =====
function initActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    link.classList.toggle('active', href === page);
  });
}

// ===== COUNTDOWN (fix: respects language) =====
function initCountdown(matchDate = window.MATCH_DATE_OVERRIDE) {
  // Edit this date to set next match — format: YYYY-MM-DDTHH:MM:SS
  if (window.__countdownInterval) clearInterval(window.__countdownInterval);
  const MATCH_DATE = new Date(matchDate || '2026-05-10T19:30:00');

  const toNum = n => {
    const s = n.toString().padStart(2, '0');
    // fix: only convert to Arabic digits when lang is Arabic
    return currentLang === 'ar'
      ? s.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
      : s;
  };

  const els = {
    d: document.getElementById('days'),
    h: document.getElementById('hours'),
    m: document.getElementById('minutes'),
    s: document.getElementById('seconds'),
  };

  function tick() {
    if (!els.d) return;
    const diff = MATCH_DATE - new Date();
    if (diff <= 0) {
      ['d','h','m','s'].forEach(k => { if(els[k]) els[k].textContent = toNum(0); });
      return;
    }
    els.d.textContent = toNum(Math.floor(diff / 86400000));
    els.h.textContent = toNum(Math.floor((diff % 86400000) / 3600000));
    els.m.textContent = toNum(Math.floor((diff % 3600000)  / 60000));
    els.s.textContent = toNum(Math.floor((diff % 60000)    / 1000));
  }

  tick();
  window.__countdownInterval = setInterval(tick, 1000);

  // Re-render digits when language switches
  document.getElementById('langToggle')?.addEventListener('click', () => tick());
}

// ===== PARTICLES =====
function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  // Reduce count for mobile
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 8 : 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:absolute;
      width:${Math.random()*3+1}px; height:${Math.random()*3+1}px;
      background:rgba(0,87,168,${Math.random()*0.45+0.1});
      border-radius:50%;
      top:${Math.random()*100}%; left:${Math.random()*100}%;
      animation:particleFloat ${Math.random()*6+5}s ease-in-out infinite;
      animation-delay:${Math.random()*4}s;
      pointer-events:none;
    `;
    c.appendChild(p);
  }
  if (!isMobile) {
    for (let i = 0; i < 6; i++) {
      const sz = Math.random()*55+18;
      const s  = document.createElement('div');
      s.style.cssText = `
        position:absolute; width:${sz}px; height:${sz}px;
        border:1px solid rgba(0,87,168,${Math.random()*0.12+0.04});
        border-radius:${Math.random()>0.5?'50%':'4px'};
        top:${Math.random()*100}%; left:${Math.random()*100}%;
        transform:rotate(${Math.random()*360}deg);
        animation:particleFloat ${Math.random()*10+8}s ease-in-out infinite;
        animation-delay:${Math.random()*5}s; pointer-events:none;
      `;
      c.appendChild(s);
    }
  }
}

// ===== NEWS FILTER =====
function initNewsFilter() {
  const btns  = document.querySelectorAll('.news-filter .filter-btn');
  const cards = document.querySelectorAll('.news-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        if (show) {
          card.style.display = '';
          // fix: don't set span 2 via JS — CSS handles it with @media
          requestAnimationFrame(() => {
            card.style.opacity   = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ===== PLAYER FILTER =====
function initPlayerFilter() {
  const btns  = document.querySelectorAll('.position-filter .filter-btn');
  const cards = document.querySelectorAll('.player-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const pos = btn.dataset.pos;
      let delay = 0;
      cards.forEach(card => {
        const show = pos === 'all' || card.dataset.pos === pos;
        if (show) {
          card.style.display = '';
          setTimeout(() => {
            card.style.opacity   = '1';
            card.style.transform = 'translateY(0)';
          }, delay);
          delay = Math.min(delay + 40, 200); // cap delay at 200ms
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ===== CONTACT FORM (fix: e.preventDefault + fetch) =====
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault(); // fix: prevent page reload
    const btn  = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        btn.textContent = currentLang === 'ar' ? '✓ تم الإرسال بنجاح' : '✓ Message Sent';
        btn.style.background = 'linear-gradient(135deg,#2e7d32,#1b5e20)';
        form.reset();
        announce(currentLang === 'ar' ? 'تم إرسال رسالتك بنجاح' : 'Message sent successfully');
        setTimeout(() => { btn.textContent=orig; btn.style.background=''; btn.disabled=false; }, 4000);
      } else { throw new Error('bad response'); }
    } catch {
      btn.textContent = currentLang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Error, try again';
      btn.style.background = 'linear-gradient(135deg,#c62828,#b71c1c)';
      setTimeout(() => { btn.textContent=orig; btn.style.background=''; btn.disabled=false; }, 3500);
    }
  });
}

// ===== REGISTRATION FORMS (Supabase placeholder) =====
function initRegForm() {
  document.querySelectorAll('.reg-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn  = form.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = currentLang === 'ar' ? 'جاري التسجيل...' : 'Registering...';
      btn.disabled = true;

      // TODO: Replace with real Supabase call when credentials are ready
      // const supabase = window.supabaseClient;
      // const { error } = await supabase.from('members').insert({...});

      // Simulated success for now
      await new Promise(r => setTimeout(r, 1500));
      const successEl = form.querySelector('.form-success');
      if (successEl) { successEl.style.display = 'block'; }
      btn.textContent = currentLang === 'ar' ? '✓ تم التسجيل' : '✓ Registered';
      announce(currentLang === 'ar' ? 'تم التسجيل بنجاح' : 'Registration successful');
      form.reset();
      setTimeout(() => { btn.textContent=orig; btn.disabled=false; }, 5000);
    });
  });
}

// ===== POLL =====
function initPoll() {
  const voted = store.get('dsc_poll_voted', null);
  
  // Initialize base counts if not exists (simulating backend)
  let counts = store.get('dsc_poll_counts');
  if (!counts) {
    counts = { win: 774, draw: 300, loss: 174 }; // Total 1248
    store.set('dsc_poll_counts', JSON.stringify(counts));
  } else {
    counts = JSON.parse(counts);
  }

  if (voted) {
    showPollResults(voted);
  }

  document.querySelectorAll('.poll-option').forEach(btn => {
    btn.addEventListener('click', () => vote(btn));
  });
}

function vote(btn) {
  if (store.get('dsc_poll_voted')) return;
  const val = btn.dataset.value;
  if (!val) return;
  
  store.set('dsc_poll_voted', val);
  
  // Update counts
  let counts = JSON.parse(store.get('dsc_poll_counts'));
  counts[val] = (counts[val] || 0) + 1;
  store.set('dsc_poll_counts', JSON.stringify(counts));
  
  showPollResults(val);
  announce(currentLang === 'ar' ? 'تم تسجيل تصويتك' : 'Your vote has been recorded');
}

function showPollResults(voted) {
  const v = voted || store.get('dsc_poll_voted');
  const counts = JSON.parse(store.get('dsc_poll_counts') || '{"win":774,"draw":300,"loss":174}');
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  document.querySelectorAll('.poll-option').forEach(opt => {
    opt.disabled = true;
    opt.style.pointerEvents = 'none';
    
    const val = opt.dataset.value;
    const count = counts[val] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    
    if (val === v) {
      opt.style.borderColor = 'var(--blue-500)';
      opt.style.background  = 'rgba(20,33,165,0.12)';
    }
    
    // Update percentage text
    const pctEl = opt.querySelector('.poll-pct');
    if (pctEl) pctEl.textContent = pct + '%';
    
    // Animate bars
    const fill = opt.querySelector('.poll-fill');
    if (fill) {
      fill.style.width = '0%';
      setTimeout(() => { fill.style.width = pct + '%'; }, 50);
    }
  });

  // Show vote count label
  const votesEl = document.querySelector('.poll-votes');
  if (votesEl) {
    const formattedTotal = currentLang === 'ar' 
      ? total.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
      : total.toLocaleString();
    votesEl.textContent = currentLang === 'ar' 
      ? `${formattedTotal} صوت حتى الآن`
      : `${formattedTotal} votes so far`;
  }
}

// ===== NEWSLETTER (Brevo placeholder) =====
function initNewsletter() {
  const forms = document.querySelectorAll('.newsletter-form');
  forms.forEach(form => {
    const btn = form.querySelector('.btn');
    const inp = form.querySelector('input[type="email"]');
    if (!btn || !inp) return;

    btn.addEventListener('click', async () => {
      const email = inp.value.trim();
      // Better email validation (fix: was too simple)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        inp.style.borderColor = '#F44336';
        inp.focus();
        setTimeout(() => inp.style.borderColor = '', 2500);
        return;
      }
      const orig = btn.textContent;
      btn.textContent = '...';
      btn.disabled = true;

      // Netlify Function proxy → Brevo API (API key stays secret on server)
      const res = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Subscribe failed');
      btn.textContent = currentLang === 'ar' ? '✓ تم' : '✓ Done';
      btn.style.background = 'linear-gradient(135deg,#2e7d32,#1b5e20)';
      inp.value = '';
      announce(currentLang === 'ar' ? 'تم اشتراكك في النشرة البريدية' : 'Subscribed to newsletter');
      setTimeout(() => { btn.textContent=orig; btn.style.background=''; btn.disabled=false; }, 3000);
    });
  });
}

// ===== REVEAL ANIMATIONS (fix: removed animationupdate non-standard event) =====
function initRevealAnimations() {
  const els = document.querySelectorAll(
    '.news-card,.player-card,.timeline-item,.youth-card,.match-row,.board-card,.product-card,.ticket-card,.join-card,.job-item'
  );
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal', 'visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  els.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i * 0.04, 0.3)}s`; // fix: cap delay at 300ms
    obs.observe(el);
  });
}

// ===== STORE: Add to Cart placeholder =====
function addToCart(productId, name, price, btnEl = null) {
  // TODO: Implement with Fawry API
  const btn = btnEl || (typeof event !== 'undefined' ? event.currentTarget : null);
  const orig = btn.textContent;
  btn.textContent = currentLang === 'ar' ? '✓ تمت الإضافة' : '✓ Added';
  btn.style.background = 'linear-gradient(135deg,#2e7d32,#1b5e20)';
  announce(currentLang === 'ar' ? `تم إضافة ${name} إلى السلة` : `${name} added to cart`);
  setTimeout(() => { if (btn) { btn.textContent=orig; btn.style.background=''; } }, 2000);
}

// ===== TICKETS: Buy placeholder =====
function buyTicket(matchId) {
  // TODO: Implement with Fawry API
  alert(currentLang === 'ar'
    ? 'سيتم تفعيل شراء التذاكر قريباً عبر فوري'
    : 'Ticket purchase via Fawry coming soon');
}

console.log('%c⚽ نادي دمياط الرياضي — منذ ١٩٢٣', 'color:#1A6FC4;font-size:16px;font-weight:bold;');

// =============================================
// DATA LOADER — reads from _data/*.json
// Replaces hardcoded HTML with dynamic content
// =============================================

async function loadJSON(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ===== LOAD NEXT MATCH =====
async function loadMatchData() {
  const data = await loadJSON('_data/match.json');
  if (!data) return;

  // Update countdown target date
  window.MATCH_DATE_OVERRIDE = new Date(data.datetime);

  // Update opponent name
  const lang = currentLang;
  document.querySelectorAll('.countdown-team.away span, .countdown-team:last-child span').forEach(el => {
    el.textContent = lang === 'ar' ? data.opponent_ar : data.opponent_en;
  });

  // Update competition label
  document.querySelectorAll('.countdown-league').forEach(el => {
    el.textContent = lang === 'ar' ? data.competition_ar : data.competition_en;
  });

  // Update match date display
  const d = new Date(data.datetime);
  const arDate = d.toLocaleDateString('ar-EG', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const enDate = d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric' });
  const time   = d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-GB', { hour:'2-digit', minute:'2-digit' });
  document.querySelectorAll('.match-date').forEach(el => {
    el.textContent = (lang === 'ar' ? arDate : enDate) + ' | ' + time;
  });

  // Re-init countdown with new date
  if (document.getElementById('countdownTimer')) initCountdown(new Date(data.datetime));
}

// ===== LOAD RESULTS & TABLE =====
async function loadResultsData() {
  const container = document.querySelector('.results-layout');
  if (!container) return;
  const data = await loadJSON('_data/results.json');
  if (!data) return;

  const lang = currentLang;

  // Recent results
  const recentList = container.querySelector('.matches-list');
  if (recentList && data.recent) {
    recentList.innerHTML = data.recent.map(m => {
      const homeAr = m.home_ar === 'دمياط' ? 'دمياط' : m.home_ar;
      const homeEn = m.home_en === 'Damietta' ? 'Damietta' : m.home_en;
      const awayAr = m.away_ar === 'دمياط' ? 'دمياط' : m.away_ar;
      const awayEn = m.away_en === 'Damietta' ? 'Damietta' : m.away_en;
      const resultLabels = { win:['فوز','W'], draw:['تعادل','D'], loss:['خسارة','L'] };
      const [rAr, rEn] = resultLabels[m.result] || ['—','—'];
      return `
        <div class="match-row ${m.result}">
          <div class="match-comp">${m.competition}</div>
          <div class="match-teams">
            <span>${lang==='ar'?homeAr:homeEn}</span>
            <div class="match-score">
              <span>${m.home_score}</span><span class="score-sep">-</span><span>${m.away_score}</span>
            </div>
            <span>${lang==='ar'?awayAr:awayEn}</span>
          </div>
          <div class="match-result-badge ${m.result}">${lang==='ar'?rAr:rEn}</div>
        </div>`;
    }).join('');
  }

  // League table
  const tbody = container.querySelector('.league-table tbody');
  if (tbody && data.table) {
    tbody.innerHTML = data.table.map(t => {
      const name = lang === 'ar' ? t.name_ar : t.name_en;
      const rowClass = t.is_damietta ? 'class="highlight-row"' : '';
      const prefix   = t.is_damietta ? '🔵 ' : '';
      return `<tr ${rowClass}>
        <td>${t.position}</td>
        <td>${prefix}${name}</td>
        <td>${t.played}</td><td>${t.won}</td>
        <td>${t.drawn}</td><td>${t.lost}</td>
        <td class="pts">${t.points}</td>
      </tr>`;
    }).join('');
  }
}

// ===== LOAD PLAYERS =====
async function loadPlayersData() {
  const grid = document.querySelector('.players-grid');
  if (!grid) return;

  // Fetch all player files listed in directory
  const index = await loadJSON('_data/players/index.json');
  if (!index || !index.files) return;

  const players = await Promise.all(index.files.map(f => loadJSON(`_data/players/${f}`)));
  const lang = currentLang;

  const posLabels = { gk:'حارس/GK', def:'مدافع/DEF', mid:'وسط/MID', fwd:'مهاجم/FWD' };

  grid.innerHTML = players.filter(Boolean).sort((a,b)=>a.number-b.number).map(p => {
    const name = lang==='ar' ? p.name_ar : p.name_en;
    const posAr = p.position_label_ar || posLabels[p.position];
    const posEn = p.position_label_en || p.position.toUpperCase();
    const posLabel = lang==='ar' ? posAr : posEn;
    const stat1Label = p.position==='gk' ? (lang==='ar'?'نظيفة':'Clean') : (lang==='ar'?'هدف':'Goals');
    const stat1Val   = p.position==='gk' ? (p.clean_sheets||0) : (p.goals||0);
    const photo = p.photo
      ? `<img src="${p.photo}" alt="${name}" loading="lazy" style="width:100%;height:100%;object-fit:cover"/>`
      : `<span>${p.position.toUpperCase()}</span>`;

    return `
      <div class="player-card" data-pos="${p.position}">
        <div class="player-number">${p.number}</div>
        <div class="player-photo-wrap">
          <div class="player-photo-placeholder">${photo}</div>
          <div class="player-hover-overlay">
            <div class="player-stats-mini">
              <div class="mini-stat"><span>${p.apps||0}</span><small>${lang==='ar'?'مباراة':'Apps'}</small></div>
              <div class="mini-stat"><span>${stat1Val}</span><small>${stat1Label}</small></div>
            </div>
          </div>
        </div>
        <div class="player-info">
          <div class="player-pos-badge ${p.position}">${posLabel}</div>
          <h4 class="player-name">${name}</h4>
        </div>
      </div>`;
  }).join('');

  // Re-attach filter after dynamic render
  initPlayerFilter();
}

// ===== LOAD BOARD =====
async function loadBoardData() {
  const grid = document.querySelector('.board-grid');
  if (!grid) return;
  const index = await loadJSON('_data/board/index.json');
  if (!index || !index.files) return;
  const members = await Promise.all(index.files.map(f => loadJSON(`_data/board/${f}`)));
  const lang = currentLang;

  grid.innerHTML = members.filter(Boolean).sort((a,b)=>a.order-b.order).map(m => {
    const name = lang==='ar' ? m.name_ar : m.name_en;
    const role = lang==='ar' ? m.role_ar  : m.role_en;
    const photo = m.photo
      ? `<img src="${m.photo}" alt="${name}" loading="lazy"/>`
      : `<div style="font-size:2rem;color:var(--text-muted)">${name.charAt(0)}</div>`;
    return `
      <div class="board-card">
        <div class="board-photo">${photo}</div>
        <div class="board-info">
          <div class="board-role">${role}</div>
          <h4 class="board-name">${name}</h4>
        </div>
      </div>`;
  }).join('');
}

// ===== LOAD PRODUCTS =====
async function loadProductsData() {
  const grid = document.querySelector('.store-grid');
  if (!grid) return;
  const index = await loadJSON('_data/products/index.json');
  if (!index || !index.files) return;
  const products = await Promise.all(index.files.map(f => loadJSON(`_data/products/${f}`)));
  const lang = currentLang;

  grid.innerHTML = products.filter(Boolean).map(p => {
    const name = lang==='ar' ? p.name_ar : p.name_en;
    const badge = p.badge_ar ? `<div class="product-badge">${p.badge_ar}</div>` : '';
    const photo = p.image
      ? `<img src="${p.image}" alt="${name}" loading="lazy" style="width:100%;height:100%;object-fit:cover"/>`
      : `<div class="placeholder-icon">👕</div>`;
    const btnText = p.available ? (lang==='ar'?'أضف للسلة':'Add to Cart') : (lang==='ar'?'قريباً':'Soon');
    const safeName = String(p.name_en).replace(/'/g, "\\'");
    return `
      <div class="product-card" data-cat="${p.category}">
        <div class="product-img">${photo}${badge}</div>
        <div class="product-info">
          <div class="product-name">${name}</div>
          <div class="product-price">
            <span class="currency">${lang==='ar'?'ج.م':'EGP'}</span>${p.price}
          </div>
          <button class="btn ${p.available?'btn-primary':'btn-outline'} full-w btn-sm"
                  onclick="${p.available?`addToCart('${safeName}', ${p.price}, this)`:''}"
                  ${p.available?'':'disabled'}>${btnText}</button>
        </div>
      </div>`;
  }).join('');
}

// ===== LOAD TICKETS =====
async function loadTicketsData() {
  const list = document.querySelector('.tickets-matches');
  if (!list) return;
  const index = await loadJSON('_data/tickets/index.json');
  if (!index || !index.files) return;
  const tickets = await Promise.all(index.files.map(f => loadJSON(`_data/tickets/${f}`)));
  const lang = currentLang;

  list.innerHTML = tickets.filter(Boolean).map(t => {
    const d = new Date(t.datetime);
    const day   = d.getDate();
    const month = d.toLocaleDateString(lang==='ar'?'ar-EG':'en-GB', {month:'short'});
    const time  = d.toLocaleTimeString(lang==='ar'?'ar-EG':'en-GB', {hour:'2-digit',minute:'2-digit'});
    const home  = lang==='ar' ? t.home_ar : t.home_en;
    const away  = lang==='ar' ? t.away_ar : t.away_en;
    const comp  = lang==='ar' ? t.competition_ar : t.competition_en;
    const venue = lang==='ar' ? t.venue_ar : t.venue_en;

    const actionHTML = t.status === 'available'
      ? `<span class="ticket-available">${lang==='ar'?'التذاكر متاحة':'Tickets Available'}</span>
         <a href="${t.buy_url||'#'}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">
           ${lang==='ar'?'شراء':'Buy'}
         </a>`
      : t.status === 'sold_out'
        ? `<span class="ticket-sold-out">${lang==='ar'?'نفدت':'Sold Out'}</span>`
        : t.status === 'away'
          ? `<span class="ticket-sold-out">${lang==='ar'?'مباراة خارجية':'Away Match'}</span>`
          : `<span class="ticket-available">${lang==='ar'?'قريباً':'Coming Soon'}</span>`;

    return `
      <div class="ticket-card">
        <div class="ticket-date">
          <div class="day">${day}</div>
          <div class="month">${month}</div>
        </div>
        <div class="ticket-match">
          <div class="competition">${comp}</div>
          <div class="ticket-teams">
            <span class="ticket-team-name">${home}</span>
            <span class="ticket-vs">VS</span>
            <span class="ticket-team-name">${away}</span>
          </div>
        </div>
        <div class="ticket-time">
          <div class="time">${time}</div>
          <div class="venue">${venue}</div>
        </div>
        <div class="ticket-action">${actionHTML}</div>
      </div>`;
  }).join('');
}

// ===== LOAD JOBS =====
async function loadJobsData() {
  const list = document.querySelector('.jobs-list');
  if (!list) return;
  const index = await loadJSON('_data/jobs/index.json');
  if (!index || !index.files) return;
  const jobs = await Promise.all(index.files.map(f => loadJSON(`_data/jobs/${f}`)));
  const lang = currentLang;
  const typeLabels = {
    fulltime:  ['دوام كامل','Full-time'],
    parttime:  ['دوام جزئي','Part-time'],
    volunteer: ['تطوع','Volunteer']
  };

  list.innerHTML = jobs.filter(j => j && j.active).map(j => {
    const title = lang==='ar' ? j.title_ar : j.title_en;
    const dept  = lang==='ar' ? j.dept_ar  : j.dept_en;
    const [typeAr, typeEn] = typeLabels[j.type] || ['—','—'];
    return `
      <div class="job-item">
        <div class="job-icon">${j.icon||'💼'}</div>
        <div class="job-info">
          <div class="job-title">${title}</div>
          <div class="job-type">${lang==='ar'?typeAr:typeEn}</div>
          <div class="job-dept">${dept}</div>
        </div>
        <a href="#volunteer-form" class="btn btn-outline btn-sm"
           data-ar="تقدّم الآن" data-en="Apply Now">تقدّم الآن</a>
      </div>`;
  }).join('');
}

// ===== INIT ALL DATA LOADERS on page load =====
document.addEventListener('DOMContentLoaded', () => {
  // Run loaders based on which elements exist on current page
  if (document.getElementById('countdownTimer') || document.querySelector('.countdown-league')) {
    loadMatchData();
  }
  if (document.querySelector('.results-layout')) loadResultsData();
  if (document.querySelector('.players-grid'))   loadPlayersData();
  if (document.querySelector('.board-grid'))     loadBoardData();
  if (document.querySelector('.store-grid'))     loadProductsData();
  if (document.querySelector('.tickets-matches'))loadTicketsData();
  if (document.querySelector('.jobs-list'))      loadJobsData();
});

// Re-render dynamic content when language switches
const _origApplyLang = applyLang;
// Wrap lang switch to reload displayed data
document.getElementById('langToggle')?.addEventListener('click', () => {
  setTimeout(() => {
    if (document.querySelector('.results-layout')) loadResultsData();
    if (document.querySelector('.players-grid'))   loadPlayersData();
    if (document.querySelector('.board-grid'))     loadBoardData();
    if (document.querySelector('.tickets-matches'))loadTicketsData();
    if (document.querySelector('.jobs-list'))      loadJobsData();
    if (document.querySelector('.countdown-league')) loadMatchData();
  }, 100);
});
