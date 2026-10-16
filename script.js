// ===== Portfolio interactions =====
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// ---- Footer year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Theme toggle (remembers choice) ----
document.querySelector('.theme-toggle').addEventListener('click', () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next = isDark ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// ---- Mobile menu ----
const menuBtn = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// ---- Header shadow + scroll progress ----
const header = document.querySelector('.portfolio-header');
const progress = document.querySelector('.scroll-progress');

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle('scrolled', y > 10);
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Active nav link for the section in view ----
const links = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('section[id]')];

// last section whose top has passed 35% of the viewport; at page bottom, the last one
function updateActiveLink() {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let current = null;
  if (atBottom) current = sections[sections.length - 1];
  else sections.forEach(s => { if (s.getBoundingClientRect().top < window.innerHeight * 0.35) current = s; });
  links.forEach(l => l.classList.toggle('active', !!current && l.getAttribute('href') === '#' + current.id));
}
window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();

// ---- Reveal on scroll ----
let pending = [...document.querySelectorAll('.reveal')];

pending.forEach((el, i) => {
  // small stagger for cards sitting side by side
  if (el.classList.contains('card')) el.style.transitionDelay = `${(i % 3) * 90}ms`;
});

function revealInView() {
  const limit = window.innerHeight * 0.9;
  pending = pending.filter(el => {
    if (el.getBoundingClientRect().top > limit) return true;
    el.classList.add('visible');
    // drop the stagger delay so hover effects respond instantly afterwards
    if (el.style.transitionDelay) setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
    return false;
  });
  if (!pending.length) window.removeEventListener('scroll', revealInView);
}

// only ~20 elements, so checking on every scroll event is cheap
window.addEventListener('scroll', revealInView, { passive: true });
window.addEventListener('resize', revealInView);
window.addEventListener('load', revealInView);
revealInView();

// ---- Typewriter for the role line ----
const typed = document.querySelector('.typed');
if (typed && !reduceMotion) {
  const words = JSON.parse(typed.dataset.words);
  let w = 0, c = words[0].length, deleting = true;

  function tick() {
    const word = words[w];
    c += deleting ? -1 : 1;
    typed.textContent = word.slice(0, c);

    let delay = deleting ? 45 : 90;
    if (!deleting && c === word.length) { deleting = true; delay = 2400; }
    else if (deleting && c === 2) { deleting = false; w = (w + 1) % words.length; delay = 300; }
    // keep the shared "A " prefix while switching words
    setTimeout(tick, delay);
  }
  setTimeout(tick, 2600);
}

// ---- 3D tilt on the hero photo ----
const tilt = document.querySelector('.tilt');
if (tilt && finePointer && !reduceMotion) {
  tilt.addEventListener('mousemove', e => {
    const r = tilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });
  tilt.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
}

// ---- Magnetic buttons ----
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

// ---- Card spotlight follows cursor ----
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// ---- Project filters ----
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.card');

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(f => f.classList.toggle('active', f === btn));
    const cat = btn.dataset.filter;
    cards.forEach(card => {
      const show = cat === 'all' || card.dataset.category.split(' ').includes(cat);
      card.classList.toggle('hidden', !show);
      if (show) {
        card.style.transitionDelay = '0ms';
        card.animate?.([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  });
});

// ---- Skill tabs (chips animate in via CSS each time a panel shows) ----
const tabs = document.querySelectorAll('.skill-tab');
const panels = document.querySelectorAll('.skill-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', t === tab);
    });
    panels.forEach(p => p.classList.toggle('active', p.id === tab.dataset.tab));
  });
});

// ---- Copy email + toast ----
const toast = document.querySelector('.toast');
let toastTimer;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.querySelector('.email-copy')?.addEventListener('click', async e => {
  const email = e.currentTarget.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    showToast('Email copied to clipboard ✓');
  } catch {
    window.location.href = `mailto:${email}`;
  }
});

// ---- Contact form (sends via Web3Forms) ----
const form = document.querySelector('.contact-form');

if (form) {
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('.form-submit');
  const label = form.querySelector('.submit-label');

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = 'form-status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // simple validation with friendly messages
    const invalid = [...form.querySelectorAll('[required]')].find(f => !f.checkValidity());
    if (invalid) {
      invalid.focus();
      setStatus(invalid.name === 'email' ? 'Please enter a valid email address.' : 'Please fill in every field.', 'error');
      return;
    }

    const key = form.dataset.accessKey;
    if (!key || key.startsWith('YOUR_')) {
      setStatus('The form isn\'t connected yet. Please email me directly using the address below.', 'error');
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return; // spam bot filled the hidden field

    submit.disabled = true;
    label.textContent = 'Sending…';
    setStatus('', '');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: key,
          subject: `New portfolio message from ${data.name}`,
          from_name: 'Portfolio contact form',
          name: data.name,
          email: data.email,
          replyto: data.email,
          message: data.message,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Send failed');

      form.reset();
      setStatus('Thanks! Your message is on its way. I\'ll get back to you soon.', 'success');
      showToast('Message sent ✓');
    } catch (err) {
      setStatus('Sorry, something went wrong. Please try again or email me directly.', 'error');
    } finally {
      submit.disabled = false;
      label.textContent = 'Send message →';
    }
  });
}
