/* ==========================================================================
   Maryam Maralani — Portfolio (v4)
   Small, dependency-free scripts. Every effect respects
   prefers-reduced-motion, and every page stays fully readable without JS.

   1. Helpers
   2. Role line: types and erases in a loop (homepage)
   3. Sections fade up 18px as they appear
   4. Portrait: duotone → colour when fully in view on touch screens
   5. Page transitions (view transitions + fallback fade)
   6. Floating back-to-top badge (drag to either side)
   7. Walkthrough videos: play in view, pause button, reduced motion
   8. Smooth-scroll fallback for older browsers
   ========================================================================== */

/* 1. Helpers --------------------------------------------------------------- */
var MM = {
  mq: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null,
  reduce: function () { return !!(MM.mq && MM.mq.matches); }
};

/* 2. Role line --------------------------------------------------------------
   Types "UX/UI designer.", deletes it, types "digital designer." and loops.
   Screen readers always get "I’m a UX/UI and digital designer." (the moving
   text is aria-hidden). Reduced motion: a static "UX/UI & digital designer."
   A click on the line, or Escape, stops it on that static text too. */
(function () {
  var root = document.querySelector('[data-typer]');
  if (!root) return;
  var out = root.querySelector('.typer__word');
  var words = ['UX/UI designer.', 'digital designer.'];
  var STILL = 'UX/UI & digital designer.';
  var timer = null, stopped = false;

  function finish() {
    stopped = true;
    clearTimeout(timer);
    out.textContent = STILL;
    root.classList.add('is-done');
  }
  if (MM.reduce()) { finish(); return; }

  var w = 0, pos = words[0].length, mode = 'hold';
  function tick() {
    if (stopped) return;
    if (document.hidden) { timer = setTimeout(tick, 500); return; }
    var word = words[w];
    if (mode === 'hold') { mode = 'erase'; timer = setTimeout(tick, 1800); return; }
    if (mode === 'erase') {
      if (pos > 0) { pos--; out.textContent = word.slice(0, pos); timer = setTimeout(tick, 40); return; }
      w = (w + 1) % words.length; mode = 'type'; timer = setTimeout(tick, 300); return;
    }
    if (pos < word.length) { pos++; out.textContent = word.slice(0, pos); timer = setTimeout(tick, 70); return; }
    mode = 'hold'; timer = setTimeout(tick, 0);
  }

  root.addEventListener('click', finish);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });
  if (MM.mq && MM.mq.addEventListener) MM.mq.addEventListener('change', function () { if (MM.reduce()) finish(); });
  timer = setTimeout(tick, 600);
})();

/* 3. Sections fade up 18px, once. The first screen is never hidden. */
(function () {
  if (!('IntersectionObserver' in window) || MM.reduce()) return;
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!items.length) return;
  var vh = window.innerHeight || 800;
  items.forEach(function (el) {
    if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add('is-in');
  });
  document.documentElement.classList.add('js-reveal');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  window.addEventListener('beforeprint', function () { items.forEach(function (el) { el.classList.add('is-in'); }); });
})();

/* 4. Portrait duotone: hover handles mouse users in CSS. On touch screens
      the photo turns to colour once it is fully in view. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (!window.matchMedia || !matchMedia('(hover: none)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle('is-colour', e.intersectionRatio >= 0.95);
    });
  }, { threshold: [0, 0.95, 1] });
  document.querySelectorAll('.portrait').forEach(function (p) { io.observe(p); });
})();

/* 5. Page transitions -------------------------------------------------------
   Modern browsers (Chrome, Edge, Safari): native cross-document view
   transitions, styled in CSS — the header stays still while the page
   cross-fades (transition 1); "Next case study" slides sideways
   (transition 3). Other browsers get a quiet JS fade. Off for reduced motion. */
(function () {
  var root = document.documentElement;
  var KEY = 'mm-vt';

  if ('onpagereveal' in window) {
    // Remember that the next navigation came from a "Next case study" link
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.site-footer__next');
      try { sessionStorage.setItem(KEY, a ? 'slide' : ''); } catch (err) {}
    });
    window.addEventListener('pageswap', function (e) {
      var t; try { t = sessionStorage.getItem(KEY); } catch (err) {}
      if (e.viewTransition && t === 'slide') e.viewTransition.types.add('slide');
    });
    window.addEventListener('pagereveal', function (e) {
      var t; try { t = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (err) {}
      if (e.viewTransition && t === 'slide') e.viewTransition.types.add('slide');
    });
    return;
  }

  // Fallback: quiet fade (under 0.4 s in total)
  if (MM.reduce()) return;
  root.classList.add('js-fade');
  window.addEventListener('pageshow', function () { root.classList.remove('is-leaving'); });

  function isPageLink(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/i.test(href)) return false;
    if (/\.pdf($|\?)/i.test(href)) return false;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.hash) return false;   // same-page anchor
    return true;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!isPageLink(a, e) || MM.reduce()) return;
    e.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(function () { location.href = a.href; }, 180);
  });
})();

/* 6. Floating back-to-top badge ---------------------------------------------
   Appears after the hero and rests on the right edge. It can be dragged
   anywhere and springs to the nearest side on release. A tap, Enter or Space
   scrolls smoothly to the top. */
(function () {
  var fab = document.querySelector('.to-top');
  if (!fab) return;
  var hero = document.querySelector('main > section, main > div');
  var foot = document.querySelector('.site-footer');
  var M = 12;
  var side = 'right', yFrac = 0.72;
  function size() { return fab.offsetWidth || 60; }
  function vw() { return document.documentElement.clientWidth; }
  function vh() { return window.innerHeight; }
  function clampY(y) { return Math.max(M, Math.min(vh() - size() - M, y)); }
  function place(x, y) { fab.style.setProperty('--x', x + 'px'); fab.style.setProperty('--y', y + 'px'); }
  function rest() { place(side === 'right' ? vw() - size() - M : M, clampY(yFrac * vh())); }
  function update() {
    var past = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 600;
    fab.classList.toggle('is-shown', past);
    fab.tabIndex = past ? 0 : -1;
    fab.setAttribute('aria-hidden', past ? 'false' : 'true');
    if (foot) {
      var f = foot.getBoundingClientRect(), b = fab.getBoundingClientRect();
      fab.classList.toggle('is-on-dark', f.top < b.top + size() / 2);
    }
  }
  function toTop() {
    window.scrollTo({ top: 0, behavior: MM.reduce() ? 'auto' : 'smooth' });
    var first = document.querySelector('.nav__brand');
    if (first) first.focus({ preventScroll: true });
  }

  rest(); update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { rest(); update(); });

  var start = null, moved = false;
  fab.addEventListener('pointerdown', function (e) {
    var r = fab.getBoundingClientRect();
    start = { px: e.clientX, py: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top };
    moved = false;
    fab.setPointerCapture(e.pointerId);
  });
  fab.addEventListener('pointermove', function (e) {
    if (!start) return;
    if (!moved && Math.hypot(e.clientX - start.px, e.clientY - start.py) < 6) return;
    moved = true;
    fab.classList.add('is-dragging');
    var x = Math.max(0, Math.min(vw() - size(), e.clientX - start.ox));
    var y = Math.max(0, Math.min(vh() - size(), e.clientY - start.oy));
    place(x, y);
    update();
  });
  function end(e) {
    if (!start) return;
    fab.classList.remove('is-dragging');
    if (moved) {
      var r = fab.getBoundingClientRect();
      side = r.left + size() / 2 > vw() / 2 ? 'right' : 'left';
      yFrac = clampY(r.top) / vh();
      rest();
      setTimeout(update, 460);
    } else if (e.type === 'pointerup') {
      toTop();
    }
    start = null;
  }
  fab.addEventListener('pointerup', end);
  fab.addEventListener('pointercancel', end);
  // Keyboard: the button's own click covers Enter/Space; pointer taps are handled above
  fab.addEventListener('click', function (e) { if (e.detail === 0) toTop(); });
})();

/* 7. Walkthrough videos -----------------------------------------------------
   Without JS the video shows its poster and native controls. With JS the
   native controls are swapped for one play/pause button; the video loops
   while it is on screen and stays paused for reduced motion. */
(function () {
  var vids = document.querySelectorAll('[data-video]');
  if (!vids.length) return;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target, wrap = v.closest('[data-video-wrap]');
      if (!wrap || wrap.dataset.userPaused === '1' || MM.reduce()) return;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.35 }) : null;

  vids.forEach(function (v) {
    var wrap = v.closest('[data-video-wrap]');
    var btn = wrap && wrap.querySelector('.video-toggle');
    v.removeAttribute('controls');
    v.muted = true;
    v.loop = true;
    v.setAttribute('playsinline', '');
    if (!btn) return;
    btn.hidden = false;
    function sync() {
      var playing = !v.paused;
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      btn.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + (btn.dataset.name || 'video'));
    }
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    btn.addEventListener('click', function () {
      if (v.paused) { wrap.dataset.userPaused = '0'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else { wrap.dataset.userPaused = '1'; v.pause(); }
    });
    sync();
    if (io && !MM.reduce()) io.observe(v);
  });
  if (MM.mq && MM.mq.addEventListener) MM.mq.addEventListener('change', function () {
    if (MM.reduce()) vids.forEach(function (v) { v.pause(); });
  });
})();

/* 8. Smooth-scroll fallback for older browsers ------------------------------ */
(function () {
  if ('scrollBehavior' in document.documentElement.style || MM.reduce()) return;
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    e.preventDefault();
    var start = window.pageYOffset;
    var end = target.getBoundingClientRect().top + start;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 600, 1);
      var ease = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      window.scrollTo(0, start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    history.pushState(null, '', '#' + id);
  });
})();

/* 9. Storytelling animations ------------------------------------------------
   a. Reading progress bar on case studies
   b. Haglöfs: markers 1–4 appear in turn; changes and markers highlight each other
   c. MyMaria emotion curve, About timeline, the homepage loop arrow and the
      Content page handwriting draw once when in view */
(function () {
  var bar = document.querySelector('.progress span');
  if (bar) {
    var ticking = false;
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', h > 0 ? Math.min(1, window.scrollY / h).toFixed(4) : 0);
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  // Linked highlight between "What I changed" and the markers on the screenshot
  var shotMarks = document.querySelectorAll('[data-markers] .marker[data-mark]');
  if (shotMarks.length) {
    var changes = document.querySelectorAll('.change[data-mark]');
    var hl = function (n, on) {
      document.querySelectorAll('[data-mark="' + n + '"]').forEach(function (el) {
        el.classList.toggle('is-hl', on);
        var m = el.classList.contains('marker') ? el : el.querySelector('.marker');
        if (m) m.classList.toggle('is-hl', on);
      });
    };
    changes.forEach(function (c) {
      var n = c.dataset.mark;
      ['mouseenter', 'focus'].forEach(function (ev) { c.addEventListener(ev, function () { hl(n, true); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { c.addEventListener(ev, function () { hl(n, false); }); });
    });
    shotMarks.forEach(function (m) {
      m.addEventListener('mouseenter', function () { hl(m.dataset.mark, true); });
      m.addEventListener('mouseleave', function () { hl(m.dataset.mark, false); });
    });
  }

  if (MM.reduce() || !('IntersectionObserver' in window)) return;
  var items = document.querySelectorAll('[data-markers], [data-draw], [data-hand]');
  if (!items.length) return;
  document.documentElement.classList.add('js-anim');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.35 });
  items.forEach(function (el) { io.observe(el); });
  window.addEventListener('beforeprint', function () { items.forEach(function (el) { el.classList.add('is-in'); }); });
})();
