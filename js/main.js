/* ===========================================================
   Jules Arrouasse — Japanese Night
   Logique du site : compte à rebours, révélation du menu,
   animations au scroll, pétales, musique, easter egg.
   =========================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     ⚙️ CONFIGURATION — à modifier facilement
     -----------------------------------------------------------
     REVEAL_DATE doit inclure le décalage horaire de Paris
     (+02:00 en été / heure d'été, +01:00 en hiver / heure d'hiver)
     afin que la révélation se déclenche à la bonne heure pour
     TOUS les invités, quel que soit le fuseau de leur téléphone.
  ----------------------------------------------------------- */
  const REVEAL_DATE = "2026-08-28T20:30:00+02:00"; // <-- changer ici la date/heure de la soirée

  /* Mode test : 'auto' | 'before' | 'after'
     - 'auto'   : utilise l'heure réelle comparée à REVEAL_DATE (comportement normal)
     - 'before' : force l'état "avant la révélation" (menu caché)
     - 'after'  : force l'état "après la révélation" (menu visible)
     On peut aussi forcer via l'URL, ex : ?test=before ou ?test=after
     Ajouter ?debug=1 à l'URL affiche un petit panneau de test à l'écran. */
  let TEST_MODE = 'auto';

  const params = new URLSearchParams(window.location.search);
  if (params.get('test') === 'before' || params.get('test') === 'after') {
    TEST_MODE = params.get('test');
  }
  const DEBUG = params.get('debug') === '1';

  /* ----------------------------------------------------------- */

  const revealTimestamp = new Date(REVEAL_DATE).getTime();
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const els = {
    countdown: document.getElementById('countdown'),
    cdH: document.getElementById('cd-h'),
    cdM: document.getElementById('cd-m'),
    cdS: document.getElementById('cd-s'),
    gate: document.getElementById('menu-gate'),
    menu: document.getElementById('menu'),
    overlay: document.getElementById('reveal-overlay'),
    discoverBtn: document.getElementById('discover-btn'),
    debugPanel: document.getElementById('debug-panel'),
  };

  function now() {
    if (TEST_MODE === 'before') return revealTimestamp - 3 * 60 * 60 * 1000; // -3h fictif
    if (TEST_MODE === 'after') return revealTimestamp + 60 * 1000; // +1min fictif
    return Date.now();
  }

  function hasBeenRevealed() {
    return now() >= revealTimestamp;
  }

  /* -----------------------------------------------------------
     Compte à rebours
  ----------------------------------------------------------- */
  let countdownTimer = null;

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const diff = revealTimestamp - now();

    if (diff <= 0) {
      clearInterval(countdownTimer);
      triggerReveal();
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    els.cdH.textContent = pad(h);
    els.cdM.textContent = pad(m);
    els.cdS.textContent = pad(s);
  }

  function startCountdown() {
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
  }

  /* -----------------------------------------------------------
     États du site : avant / après révélation
  ----------------------------------------------------------- */

  function showMenuInstantly() {
    // Le site est ouvert après 20h30 : pas d'animation, le menu est déjà là.
    body.dataset.state = 'after';
    els.gate.style.display = 'none';
    body.classList.add('menu-visible');
    showDiscoverButton();
    // Le menu était display:none au chargement : on force l'apparition des
    // éléments plutôt que de dépendre de l'IntersectionObserver, qui peut
    // ne pas re-mesurer immédiatement un bloc qui vient de devenir visible.
    requestAnimationFrame(() => {
      document.querySelectorAll('#menu [data-observe]').forEach(el => el.classList.add('in-view'));
    });
  }

  function showGateAndCountdown() {
    body.dataset.state = 'before';
    startCountdown();
  }

  function showDiscoverButton() {
    els.discoverBtn.classList.add('visible');
  }

  /* -----------------------------------------------------------
     Animation de révélation (4 à 6 secondes)
     1. écran s'assombrit légèrement
     2. brume passe
     3. cercle Enso apparaît
     4. cadenas disparaît (masqué par la brume/l'overlay)
     5. pétales de sakura passent
     6. texte japonais apparaît
     7. le menu se révèle progressivement
  ----------------------------------------------------------- */

  let revealed = false;

  function triggerReveal() {
    if (revealed) return;
    revealed = true;

    if (reduceMotion) {
      body.classList.add('menu-visible');
      els.gate.style.display = 'none';
      showDiscoverButton();
      scrollGentlyIntoView();
      return;
    }

    const overlay = els.overlay;
    overlay.classList.add('active');
    spawnRevealPetals();

    const steps = [
      { cls: 'step-dim',      at: 0 },
      { cls: 'step-fog',      at: 500 },
      { cls: 'step-enso',     at: 1200 },
      { cls: 'step-text',     at: 3000 },
      { cls: 'step-fadeout',  at: 4600 },
    ];

    steps.forEach(step => {
      setTimeout(() => overlay.classList.add(step.cls), step.at);
    });

    // Le menu se révèle progressivement pendant que l'overlay s'efface
    setTimeout(() => {
      els.gate.style.display = 'none';
      body.classList.add('menu-visible');
      body.dataset.state = 'after';
      requestAnimationFrame(() => {
        document.querySelectorAll('#menu [data-observe]').forEach((el, i) => {
          setTimeout(() => el.classList.add('in-view'), i * 90);
        });
      });
    }, 3900);

    // Fin de l'overlay
    setTimeout(() => {
      overlay.classList.remove('active', 'step-dim', 'step-fog', 'step-enso', 'step-text', 'step-fadeout');
      showDiscoverButton();
    }, 5600);
  }

  function spawnRevealPetals() {
    const host = document.querySelector('.reveal-petals');
    if (!host) return;
    host.innerHTML = '';
    const count = 14;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const size = 8 + Math.random() * 10;
      p.style.cssText = `
        position:absolute; top:-5%; left:${Math.random() * 100}%;
        width:${size}px; height:${size * 0.8}px;
        background: radial-gradient(circle at 30% 30%, #f4c9c9, #a3272c88);
        border-radius: 70% 30% 65% 35% / 60% 40% 60% 40%;
        opacity:0;
        animation: reveal-petal-fall ${3.2 + Math.random() * 1.6}s ease-in ${Math.random() * 1.2}s forwards;
      `;
      host.appendChild(p);
    }
    if (!document.getElementById('reveal-petal-kf')) {
      const style = document.createElement('style');
      style.id = 'reveal-petal-kf';
      style.textContent = `
        @keyframes reveal-petal-fall {
          0%   { opacity: 0; transform: translate(0,0) rotate(0deg); }
          10%  { opacity: .9; }
          100% { opacity: 0; transform: translate(${(-40 + Math.random()*80)}px, 340px) rotate(260deg); }
        }`;
      document.head.appendChild(style);
    }
  }

  function scrollGentlyIntoView() {
    // no-op helper kept for reduced-motion path
  }

  /* -----------------------------------------------------------
     Initialisation de l'état au chargement
  ----------------------------------------------------------- */

  function init() {
    if (hasBeenRevealed()) {
      showMenuInstantly();
    } else {
      showGateAndCountdown();
    }

    if (DEBUG && els.debugPanel) {
      els.debugPanel.hidden = false;
      els.debugPanel.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-force]');
        if (!btn) return;
        // On repart d'une vraie navigation avec le paramètre ?test= dans l'URL
        // (un simple TEST_MODE + location.reload() serait perdu au rechargement,
        // puisque tout l'état JS repart de zéro et se relit depuis l'URL).
        const url = new URL(window.location.href);
        if (btn.dataset.force === 'auto') {
          url.searchParams.delete('test');
        } else {
          url.searchParams.set('test', btn.dataset.force);
        }
        url.searchParams.set('debug', '1');
        window.location.href = url.toString();
      });
    }
  }

  /* -----------------------------------------------------------
     Animations au scroll (IntersectionObserver)
  ----------------------------------------------------------- */

  function initScrollReveal() {
    // Marque les blocs à observer individuellement (pas les conteneurs
    // parents, pour éviter un double fondu imbriqué).
    document.querySelectorAll(
      '.eyebrow, .section-title, .brush-divider, .dish, .course-label, .menu-section .btn--ghost'
    ).forEach(el => {
      el.setAttribute('data-observe', '');
    });

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-observe], .timeline-item').forEach(el => el.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('[data-observe], .timeline-item').forEach(el => io.observe(el));
  }

  /* -----------------------------------------------------------
     Pétales de sakura / brume en arrière-plan (canvas léger)
  ----------------------------------------------------------- */

  function initPetalsCanvas() {
    const canvas = document.getElementById('petals');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr;
    let petals = [];
    let running = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makePetal() {
      return {
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.4,
        size: 5 + Math.random() * 6,
        speedY: 0.25 + Math.random() * 0.35,
        speedX: (Math.random() - 0.5) * 0.4,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.004 + Math.random() * 0.006,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        opacity: 0.25 + Math.random() * 0.35,
      };
    }

    const COUNT = window.innerWidth < 640 ? 9 : 14;
    for (let i = 0; i < COUNT; i++) petals.push(makePetal());

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = '#b8433f';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      petals.forEach(p => {
        p.sway += p.swaySpeed;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.sway) * 0.3;
        p.rot += p.rotSpeed;
        if (p.y > h + 20) Object.assign(p, makePetal(), { y: -20 });
        drawPetal(p);
      });
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(tick);
    });
    requestAnimationFrame(tick);
  }

  /* -----------------------------------------------------------
     Filtre d'entrée : le visiteur décline son identité, seul le nom
     de famille "Arrouasse" donne accès au reste du site.
  ----------------------------------------------------------- */

  const GATE_SESSION_KEY = 'jaGatePassed';
  const GATE_SURNAME = 'arrouasse';

  function normalizeName(str) {
    return str
      .trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les accents
      .toLowerCase();
  }

  function initGatekeeper(onPassed) {
    const gate = document.getElementById('gatekeeper');
    if (!gate) { onPassed(); return; }

    let alreadyPassed = false;
    try { alreadyPassed = sessionStorage.getItem(GATE_SESSION_KEY) === '1'; } catch (e) { /* pas grave */ }
    const skip = params.get('skipgate') === '1';

    if (alreadyPassed || skip) {
      gate.remove();
      onPassed();
      return;
    }

    body.classList.add('gk-lock');

    const form = document.getElementById('gk-form');
    const prenomInput = document.getElementById('gk-prenom');
    const nomInput = document.getElementById('gk-nom');
    const accepted = document.getElementById('gk-accepted');
    const acceptedName = document.getElementById('gk-accepted-name');
    const rejected = document.getElementById('gk-rejected');
    const continueBtn = document.getElementById('gk-continue');
    const outBtn = document.getElementById('gk-out');
    const retryBtn = document.getElementById('gk-retry');

    function showPanel(panel) {
      [form, accepted, rejected].forEach(p => { p.hidden = (p !== panel); });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const prenom = prenomInput.value.trim();
      const nom = nomInput.value;

      if (normalizeName(nom) === GATE_SURNAME) {
        acceptedName.textContent = prenom ? `Bienvenue, ${prenom}.` : '';
        showPanel(accepted);
      } else {
        rejected.classList.remove('gk-shake-once');
        showPanel(rejected);
        requestAnimationFrame(() => rejected.classList.add('gk-shake-once'));
      }
    });

    continueBtn.addEventListener('click', () => {
      try { sessionStorage.setItem(GATE_SESSION_KEY, '1'); } catch (e) { /* pas grave */ }
      gate.classList.add('gk-hide');
      body.classList.remove('gk-lock');
      setTimeout(() => gate.remove(), 1100);
      onPassed();
    });

    retryBtn.addEventListener('click', () => {
      nomInput.value = '';
      showPanel(form);
      nomInput.focus();
    });

    outBtn.addEventListener('click', () => {
      window.close();
      // La plupart des navigateurs mobiles ignorent window.close() sur un onglet
      // que l'utilisateur a ouvert lui-même : on referme quand même la porte.
      setTimeout(() => { window.location.href = 'about:blank'; }, 150);
    });
  }

  /* -----------------------------------------------------------
     Animation d'ouverture (brume + cercle Enso) à l'arrivée sur le site.
     Jouée une seule fois par session (sessionStorage) pour ne pas gêner
     un invité qui recharge ou navigue plusieurs fois pendant la soirée.
  ----------------------------------------------------------- */

  const INTRO_SESSION_KEY = 'jaIntroPlayed';

  function initIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return;

    let alreadyPlayed = false;
    try { alreadyPlayed = sessionStorage.getItem(INTRO_SESSION_KEY) === '1'; } catch (e) { /* stockage indisponible : on rejoue à chaque fois, tant pis */ }

    if (reduceMotion || alreadyPlayed) {
      intro.remove();
      return;
    }

    body.classList.add('intro-lock');
    requestAnimationFrame(() => intro.classList.add('intro-draw'));

    setTimeout(() => {
      intro.classList.add('intro-hide');
      body.classList.remove('intro-lock');
    }, 2600);

    setTimeout(() => intro.remove(), 3900);

    try { sessionStorage.setItem(INTRO_SESSION_KEY, '1'); } catch (e) { /* pas grave si indisponible */ }
  }

  /* -----------------------------------------------------------
     Musique d'ambiance — jamais de lecture automatique.
     Nappe sonore générative douce (aucun fichier externe requis).
     Pour utiliser un vrai enregistrement, placer un fichier dans
     /audio/ambiance.mp3 et décommenter la section "AUDIO FILE".
  ----------------------------------------------------------- */

  function initMusic() {
    const btn = document.getElementById('music-toggle');
    if (!btn) return;

    let audioCtx = null;
    let nodes = null;
    let playing = false;

    /* --- Option simple : fichier audio réel (décommenter si présent) ---
    const audioEl = new Audio('audio/ambiance.mp3');
    audioEl.loop = true;
    audioEl.volume = 0.35;
    btn.addEventListener('click', () => {
      playing = !playing;
      if (playing) audioEl.play(); else audioEl.pause();
      btn.setAttribute('aria-pressed', String(playing));
    });
    return;
    ------------------------------------------------------------------ */

    function buildAmbiance() {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const master = audioCtx.gain ? audioCtx.gain : audioCtx.createGain();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);

      const freqs = [174.6, 220, 261.6]; // nappe douce, accord ouvert
      const oscs = freqs.map((f, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.14 - i * 0.03;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        osc.connect(filter).connect(gain).connect(masterGain);
        osc.start();
        return osc;
      });

      // Léger vibrato lent (LFO) pour une sensation de brume sonore
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain);
      oscs.forEach(o => lfoGain.connect(o.frequency));
      lfo.start();

      nodes = { masterGain, oscs, lfo };
    }

    btn.addEventListener('click', () => {
      if (!audioCtx) buildAmbiance();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      playing = !playing;
      btn.setAttribute('aria-pressed', String(playing));
      const target = playing ? 0.22 : 0;
      const t = audioCtx.currentTime;
      nodes.masterGain.gain.cancelScheduledValues(t);
      nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, t);
      nodes.masterGain.gain.linearRampToValueAtTime(target, t + 1.2);
      btn.setAttribute('aria-label', playing ? 'Couper la musique d\'ambiance' : 'Activer la musique d\'ambiance');
    });
  }

  /* -----------------------------------------------------------
     Easter egg : sceau japonais tapé 5 fois
  ----------------------------------------------------------- */

  function initEasterEgg() {
    const seal = document.getElementById('seal');
    const msg = document.getElementById('easter-msg');
    if (!seal || !msg) return;
    let taps = 0;
    let resetTimer = null;

    seal.addEventListener('click', () => {
      taps++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { taps = 0; }, 2500);

      if (taps >= 5) {
        msg.classList.add('show');
        taps = 0;
      }
    });
  }

  /* -----------------------------------------------------------
     Boot
  ----------------------------------------------------------- */

  function startSite() {
    initIntro();
    initScrollReveal(); // pose les attributs data-observe avant init()
    init();
    initPetalsCanvas();
    initMusic();
    initEasterEgg();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initGatekeeper(startSite);
  });
})();
