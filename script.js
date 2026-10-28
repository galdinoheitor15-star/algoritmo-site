(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  $('#year').textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 30);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const burger = $('.nav__burger');
  const menu = $('#mobileMenu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    menu.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

  // active section link
  const links = $$('.nav__links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const t = $(l.getAttribute('href')); if (t) spy.observe(t); });

  /* ---------- reveal on scroll (staggered per parent) ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's');
    revealIO.observe(el);
  });

  /* ---------- scramble / decode text ---------- */
  const glyphs = '01<>/{}[]#$%&*+=?ALGORITMO';
  function scramble(el) {
    const final = el.textContent;
    if (reduce) return;
    let frame = 0, done = false;
    const queue = [...final].map((ch, i) => ({ ch, start: Math.floor(Math.random() * 12) + i * 1.2, end: 0 }));
    queue.forEach(q => (q.end = q.start + 10 + Math.floor(Math.random() * 10)));
    const tick = () => {
      if (done) return;
      let out = '', n = 0;
      for (const q of queue) {
        if (frame >= q.end || q.ch === ' ') { out += q.ch; n++; }
        else if (frame >= q.start) out += glyphs[Math.floor(Math.random() * glyphs.length)];
        else out += ' ';
      }
      el.textContent = out;
      frame++;
      if (n < queue.length) requestAnimationFrame(tick);
      else el.textContent = final;
    };
    tick();
    setTimeout(() => { done = true; el.textContent = final; }, 1800); // safety net if rAF is throttled
  }
  setTimeout(() => $$('[data-scramble]').forEach(scramble), 250);

  /* ---------- code rain (hero) ---------- */
  const cv = $('#codeRain');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    const chars = '01';
    let w, h, cols, drops, fs = 16, dpr = Math.min(devicePixelRatio || 1, 2), running = true;
    const size = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / fs);
      drops = Array.from({ length: cols }, () => Math.random() * -h / fs);
    };
    size();
    addEventListener('resize', size);
    let last = 0;
    const draw = t => {
      if (!running) return;
      requestAnimationFrame(draw);
      if (t - last < 55) return;
      last = t;
      ctx.fillStyle = 'rgba(5,7,15,.16)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `600 ${fs - 2}px "JetBrains Mono", monospace`;
      for (let i = 0; i < cols; i++) {
        if (i % 2) continue; // sparse columns keep it subtle
        const y = drops[i] * fs;
        ctx.fillStyle = Math.random() > .975 ? '#eafff4' : 'rgba(43,235,152,.55)';
        ctx.fillText(chars[(Math.random() * 2) | 0], i * fs, y);
        if (y > h && Math.random() > .975) drops[i] = 0;
        drops[i] += .6;
      }
    };
    requestAnimationFrame(draw);
    // pause when hero is off-screen
    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(draw);
    }).observe(cv);
  }

  /* ---------- hero parallax ---------- */
  const visual = $('.hero__visual');
  if (visual && !reduce && matchMedia('(hover: hover)').matches) {
    const layers = [
      [$('.hero__students', visual), 10],
      [$('.hero__ring', visual), -14],
      [$('.fc--1', visual), 24],
      [$('.fc--2', visual), 20],
      [$('.hero__emblem', visual), -26],
    ];
    let raf;
    $('.hero').addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        layers.forEach(([el, k]) => el && (el.style.translate = `${el.classList.contains('hero__students') ? 'calc(-50% + ' + x * k + 'px)' : x * k + 'px'} ${y * k}px`));
      });
    });
  }

  /* ---------- pillar spotlight + tilt ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
        card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 6}deg) rotateY(${(px - .5) * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => (card.style.transform = ''));
    });
  }

  /* ---------- terminal typing ---------- */
  const term = $('#terminal code');
  const script = [
    ['c', '// algoritmo da aprovação — v2026'],
    ['', ''],
    ['k', 'const ', 'n', 'aluno', '', ' = ', 'f', 'matricular', '', '(', 's', '"você"', '', ');'],
    ['', ''],
    ['n', 'aluno', '', '.', 'f', 'mindset', '', '(', 's', '"vencedor"', '', ');            ', 'c', '// 01 crenças limitantes → confiança'],
    ['n', 'aluno', '', '.', 'f', 'emocoes', '', '(', 's', '"sob controle"', '', ');        ', 'c', '// 02 adeus, “branco”'],
    ['n', 'aluno', '', '.', 'f', 'tempo', '', '(', 's', '"rotina otimizada"', '', ');      ', 'c', '// 03 foco no que cai'],
    ['n', 'aluno', '', '.', 'f', 'disciplinas', '', '(', 's', '"domínio total"', '', ');   ', 'c', '// 04 profundidade'],
    ['', ''],
    ['k', 'while ', '', '(!', 'n', 'aluno', '', '.', 'f', 'aprovado', '', ') { ', 'f', 'praticar', '', '(); }'],
    ['', ''],
    ['k', 'return ', 's', '"✔ APROVADO — #ProgramadosParaVencer"', '', ';'],
  ];
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lineHTML = parts => {
    let html = '';
    for (let i = 0; i < parts.length; i += 2) {
      const cls = parts[i], txt = esc(parts[i + 1] || '');
      html += cls ? `<span class="${cls}">${txt}</span>` : txt;
    }
    return html;
  };
  if (term) {
    const full = script.map(lineHTML).join('\n');
    if (reduce) term.innerHTML = full;
    else {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let li = 0, ci = 0;
        const plain = script.map(p => p.filter((_, i) => i % 2).join(''));
        const step = () => {
          if (li >= script.length) { term.innerHTML = full + '<span class="caret"></span>'; return; }
          ci += 2;
          // render finished lines fully, the current one by sliced segments
          const done = script.slice(0, li).map(lineHTML);
          let remaining = ci, cur = '';
          const parts = script[li];
          for (let i = 0; i < parts.length; i += 2) {
            const t = parts[i + 1] || '';
            const take = t.slice(0, Math.max(0, remaining));
            remaining -= t.length;
            cur += parts[i] ? `<span class="${parts[i]}">${esc(take)}</span>` : esc(take);
            if (remaining <= 0) break;
          }
          term.innerHTML = [...done, cur].join('\n') + '<span class="caret"></span>';
          if (ci >= plain[li].length) { li++; ci = 0; setTimeout(step, plain[li - 1].length ? 140 : 60); }
          else setTimeout(step, 22);
        };
        step();
      }, { threshold: .4 });
      io.observe(term);
    }
  }

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, to = +el.dataset.count;
      if (reduce) { el.textContent = to; return; }
      const dur = to > 10 ? 1600 : 900, t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- course filter ---------- */
  const tabs = $$('.tabs button');
  const courses = $$('.course');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
    const f = tab.dataset.filter;
    courses.forEach(c => {
      const show = f === 'all' || c.dataset.cat === f;
      c.classList.toggle('is-hidden', !show);
      if (show && !reduce) c.animate([{ opacity: 0, transform: 'translateY(12px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
  }));

  // course CTA pre-selects the form
  const select = $('#leadForm select[name="curso"]');
  $$('.course__link').forEach(a => a.addEventListener('click', () => {
    const v = a.dataset.course;
    const opt = [...select.options].find(o => o.text === v);
    if (opt) select.value = opt.value || opt.text;
  }));

  /* ---------- lead form → WhatsApp ---------- */
  const form = $('#leadForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle('is-invalid', bad);
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    const d = new FormData(form);
    const text = `Olá! Vim pelo site do Algoritmo Prepara.\n\n*Aluno:* ${d.get('nome')}\n*Telefone:* ${d.get('tel')}\n*Curso:* ${d.get('curso')}${d.get('msg') ? `\n*Mensagem:* ${d.get('msg')}` : ''}`;
    window.open('https://wa.me/5581992787835?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
  $$('[required]', form).forEach(f => f.addEventListener('input', () => f.classList.remove('is-invalid')));
})();
