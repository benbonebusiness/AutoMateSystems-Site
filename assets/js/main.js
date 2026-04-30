/* ============================================================
   AutoMate — main.js
   ============================================================ */

const WA_LINK = 'https://wa.me/972537002710?text=%D7%94%D7%99%D7%99%2C%20%D7%94%D7%92%D7%A2%D7%AA%D7%99%20%D7%9E%D7%94%D7%90%D7%AA%D7%A8%20%F0%9F%91%8B%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A9%D7%9E%D7%95%D7%A2%20%D7%A2%D7%95%D7%93%20%D7%A2%D7%9C%20%D7%94%D7%91%D7%95%D7%98%20%D7%A9%D7%9C%D7%9B%D7%9D';
const WEBHOOK_URL = 'https://benbonebusiness.app.n8n.cloud/webhook/automate-website-bot';
const MAX_MESSAGES = 20;
const MAX_CHARS = 500;
const TIMEOUT_MS = 30000;

/* --- Header scroll shadow --- */
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* --- Mobile nav toggle --- */
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  /* סגירה בלחיצה על קישור */
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    });
  });
}

/* --- FAQ accordion --- */
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-question');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    /* סגור הכל */
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    });
    /* פתח אם היה סגור */
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* --- Smooth scroll for anchor buttons --- */
document.querySelectorAll('[data-scroll]').forEach(el => {
  el.addEventListener('click', () => {
    const target = document.querySelector(el.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ============================================================
   DEMO BOT
   ============================================================ */
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatLimitMsg = document.getElementById('chat-limit-msg');

if (chatBody) {
let sessionId = localStorage.getItem('automate_session_id');
  if (!sessionId) {
    sessionId = 'web_' + Math.random().toString(36).substring(2, 15) + Date.now();
    localStorage.setItem('automate_session_id', sessionId);
  }

  let msgCount = 0;

  function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendMessage(sender, text) {
    const wrap = document.createElement('div');
    wrap.className = `msg msg-${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    /* תמיכה בלינקים במסגרת הבוט */
    if (sender === 'bot') {
      bubble.innerHTML = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--amber-deep);text-decoration:underline">$1</a>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--amber-deep);text-decoration:underline">$1</a>');
    } else {
      bubble.textContent = text;
    }

    wrap.appendChild(bubble);
    chatBody.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    const indicator = document.createElement('div');
    indicator.className = 'msg msg-bot';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    chatBody.appendChild(indicator);
    scrollBottom();
  }

  function hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }

  function showLimit() {
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    if (chatLimitMsg) {
      chatLimitMsg.style.display = 'flex';
      chatBody.appendChild(chatLimitMsg);
      scrollBottom();
    }
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || msgCount >= MAX_MESSAGES) return;

    chatInput.value = '';
    chatSendBtn.disabled = true;
    msgCount++;

    appendMessage('user', text);
    showTyping();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) throw new Error('network');

      const data = await resp.json();
      hideTyping();
      appendMessage('bot', data.reply || 'מצטערים, משהו השתבש. נסה שוב.');
    } catch (err) {
      clearTimeout(timeoutId);
      hideTyping();
      if (err.name === 'AbortError') {
        appendMessage('bot', 'הבוט לוקח זמן לענות. נסה שוב או דבר איתנו ישירות.');
      } else {
        appendMessage('bot', 'אין חיבור כרגע. נסה שוב או צור קשר בווטסאפ.');
      }
    }

    if (msgCount >= MAX_MESSAGES) {
      showLimit();
    } else {
      chatSendBtn.disabled = false;
      chatInput.focus();
    }
  }

  /* שליחה בלחיצה */
  chatSendBtn?.addEventListener('click', sendMessage);

  /* שליחה ב-Enter (Shift+Enter = שורה חדשה) */
  chatInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  /* כפתור שליחה פעיל רק כשיש טקסט */
  chatInput?.addEventListener('input', () => {
    const val = chatInput.value;
    if (val.length > MAX_CHARS) chatInput.value = val.substring(0, MAX_CHARS);
    chatSendBtn.disabled = chatInput.value.trim().length === 0;
  });

  /* הודעת פתיחה */
  setTimeout(() => {
    appendMessage('bot', 'שלום! אני הבוט של AutoMate. אני יכול לענות לך על כל שאלה לגבי השירות שלנו — איך זה עובד, מה כלול, כמה זה עולה.\n\nבמהלך השיחה, ההודעות נשמרות לצורך שיפור השירות. [מדיניות פרטיות](privacy.html)\n\nאיך אעזור לך היום?');
    chatSendBtn.disabled = false;
  }, 600);
}
