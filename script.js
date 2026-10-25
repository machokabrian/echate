// ---------- helpers ----------
function $(id) { return document.getElementById(id); }
function on(id, fn) { var e = $(id); if (e) e.addEventListener('click', fn); }
function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ---------- Contact details from config.js ----------
var CFG = (typeof CONFIG !== 'undefined') ? CONFIG : {};
var DIGITS = (CFG.phone || '').replace(/\D/g, '');
(function () {
  var all = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };
  var hide = function (el) { el.style.display = 'none'; };
  if (!DIGITS) {
    all('.needs-phone', hide);
    document.documentElement.classList.add('nobar');
  } else {
    all('[data-tel]', function (a) { a.href = 'tel:+' + DIGITS; });
    all('[data-wa]', function (a) {
      a.href = 'https://wa.me/' + DIGITS + '?text=' + encodeURIComponent(a.getAttribute('data-msg') || 'Hello!');
    });
  }
  if (!CFG.mpesa) { all('.needs-mpesa', hide); } else { var m = $('mp'); if (m) m.textContent = CFG.mpesa; }
  var cl = $('cl');
  if (cl) {
    var extra = '';
    if (DIGITS) extra += '📞 <a href="tel:+' + DIGITS + '">' + esc(CFG.phone) + '</a><br>';
    if (CFG.email) extra += '✉️ <a href="mailto:' + esc(CFG.email) + '">' + esc(CFG.email) + '</a><br>';
    cl.innerHTML = extra + cl.innerHTML;
  }
})();

// ---------- WhatsApp welcome popup ----------
var pop = $('pp') || document.createElement('div');
on('pt', function () { pop.classList.toggle('o'); });
on('pc', function () { pop.classList.remove('o'); });
setTimeout(function () { pop.classList.add('o'); }, 3000);

// ---------- Join form ----------
(function () {
  var f = $('jf'); if (!f) return;
  var st = $('fs');
  function say(msg, ok) { st.textContent = msg; st.className = 'fs ' + (ok ? 'ok' : 'bad'); }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('n').value.trim(), phone = $('p').value.trim(), ward = $('w').value.trim();
    if (!name || !phone) { say('Please enter your name and phone number.', false); return; }
    if (!$('cn').checked) { say('Please tick the box so we may contact you.', false); return; }
    var url = CFG.formEndpoint || '';
    var msg = 'Name: ' + name + '\nPhone: ' + phone + '\nWard: ' + ward + '\nI want to join the movement.';
    if (url) {
      var btn = $('js'); btn.disabled = true; say('Sending…', true);
      fetch(url, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                   body: JSON.stringify({ name: name, phone: phone, ward: ward }) })
        .then(function (r) { if (!r.ok) throw 0; say('Asante! You are in. We will contact you soon.', true); f.reset(); })
        .catch(function () { say('Could not send. Please try again later.', false); })
        .then(function () { btn.disabled = false; });
    } else if (CFG.email) {
      location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Join the campaign') + '&body=' + encodeURIComponent(msg);
      say('Your email app is opening. Press send to finish.', true);
    } else if (DIGITS) {
      window.open('https://wa.me/' + DIGITS + '?text=' + encodeURIComponent(msg), '_blank');
      say('WhatsApp is opening. Press send to finish.', true);
    } else {
      say('Sign-up opens soon. Please check back shortly.', false);
    }
  });
})();

// ---------- Copy M-Pesa number ----------
on('cp', function () {
  var b = $('cp');
  try { navigator.clipboard.writeText(CFG.mpesa || ''); b.textContent = 'Copied ✓'; }
  catch (e) { b.textContent = CFG.mpesa || ''; }
});

// ---------- Events ----------
(function () {
  var M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var list = $('evl');
  if (!list) return;
  var d0 = new Date(), today = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2) + '-' + ('0' + d0.getDate()).slice(-2);
  var ev = (typeof EVENTS !== 'undefined' ? EVENTS : []).filter(function (e) { return e.d >= today; })
    .sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  if (!ev.length) {
    list.innerHTML = '<div class="em">New events will be announced here soon. Check back soon for updates.</div>';
    return;
  }
  list.innerHTML = ev.map(function (e) {
    var p = e.d.split('-');
    return '<div class="ev"><div class="d">' + esc(p[2] || '') + '<small>' + M[(+p[1] || 1) - 1] +
      '</small></div><div><b>' + esc(e.t) + '</b><p>' + esc(e.l || '') + '</p></div></div>';
  }).join('');
})();

// ---------- Gallery: named photos + short videos, auto-scrolling ----------
(function () {
  var g = $('gl'), lb = $('lb'), lbi = $('lbi'), lbv = $('lbv'), lbc = $('lbc');
  if (!g || !lb) return;
  var items = (typeof GALLERY !== 'undefined' ? GALLERY : []);
  if (!items.length) { g.parentNode.style.display = 'none'; return; }
  var html = '';
  for (var round = 0; round < 2; round++) {          // listed twice for the endless loop
    items.forEach(function (it, k) {
      var label = it.name ? '<span class="nm2">' + esc(it.name) + '</span>' : '';
      if (it.type === 'video') {
        html += '<div class="gi" data-k="' + k + '"><video src="' + esc(it.src) + '#t=0.1" ' +
          (it.poster ? 'poster="' + esc(it.poster) + '" ' : '') +
          'preload="metadata" muted playsinline></video><span class="pl">▶</span>' + label + '</div>';
      } else {
        html += '<div class="gi" data-k="' + k + '"><img src="' + esc(it.src) + '" alt="' + esc(it.name || it.alt || '') +
          '" loading="lazy">' + label + '</div>';
      }
    });
  }
  g.innerHTML = html;
  g.style.animationDuration = Math.max(24, items.length * 6) + 's';
  function closeLb() { lb.classList.remove('o'); lbv.pause(); lbv.removeAttribute('src'); lbv.style.display = 'none'; lbi.style.display = 'none'; }
  g.addEventListener('click', function (e) {
    var box = e.target.closest ? e.target.closest('.gi') : null;
    if (!box) return;
    var it = items[+box.getAttribute('data-k')];
    lbc.textContent = it.name || '';
    if (it.type === 'video') {
      lbi.style.display = 'none'; lbv.style.display = 'block'; lbv.src = it.src;
      if (it.poster) lbv.poster = it.poster;
      lb.classList.add('o'); lbv.play();
    } else {
      lbv.style.display = 'none'; lbi.style.display = 'block'; lbi.src = it.src; lbi.alt = it.name || ''; lb.classList.add('o');
    }
  });
  lb.addEventListener('click', function (e) { if (e.target !== lbv) closeLb(); });
})();

// ---------- Hide any photo that fails to load ----------
Array.prototype.forEach.call(document.querySelectorAll('img'), function (img) {
  img.addEventListener('error', function () { img.style.display = 'none'; });
});

// ---------- Social links (from config.js) ----------
(function () {
  var box = $('soc'); if (!box) return;
  var soc = (typeof CONFIG !== 'undefined' && CONFIG.social) || {}, html = '';
  Object.keys(soc).forEach(function (k) {
    if (soc[k]) html += '<a href="' + esc(soc[k]) + '" target="_blank" rel="noopener">' + esc(k) + '</a>';
  });
  if (html) box.innerHTML = html; else box.style.display = 'none';
})();

// ---------- Footer year ----------
(function () { var y = $('yr'); if (y) y.textContent = new Date().getFullYear(); })();

// ---------- Analytics (only if an ID is set in config.js) ----------
(function () {
  var id = typeof CONFIG !== 'undefined' && CONFIG.analyticsId;
  if (!id) return;
  var s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date()); gtag('config', id);
})();

// ---------- Hamburger menu ----------
(function () {
  var bg = $('bg'), menu = $('menu');
  if (!bg || !menu) return;
  function setOpen(o) {
    menu.classList.toggle('o', o);
    bg.setAttribute('aria-expanded', o ? 'true' : 'false');
    bg.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
  }
  bg.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!menu.classList.contains('o')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setOpen(false); });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 860) setOpen(false); });
})();
