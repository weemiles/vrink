(function () {
  // 설정
  const API_URL = window.VRINK_CHAT_API || '/api/chat';
  const HANDOFF_URL = window.VRINK_HANDOFF_API || '/api/handoff';
  const BRAND = '#56E893';
  const BOT_NAME = '브링크';
  const NOTICE =
    '평일 10:00–18:00에 순차적으로 답변드려요.\n도입 문의, 이용 방법, 제휴 등 무엇이든 편하게 남겨주세요.';
  const MACROS = window.VRINK_MACROS || { greeting: '무엇을 도와드릴까요?', items: [] };

  const history = [];        // AI 상담 대화 기록 (AI API 전달용)
  let pendingImages = [];    // 전송 대기 중인 첨부 이미지(data URL)

  // 브랜드 로고 (Vector.svg 인라인)
  function logo(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 278 278" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M138.654 0C62.0811 0 0 62.0811 0 138.654C0 215.227 62.0811 277.308 138.654 277.308C215.227 277.308 277.308 215.227 277.308 138.654C277.308 62.0811 215.227 0 138.654 0ZM138.654 242.244C81.4337 242.244 35.0458 195.856 35.0458 138.636C35.0458 81.4154 81.4337 35.0276 138.654 35.0276C195.874 35.0276 242.262 81.4154 242.262 138.636C242.262 195.856 195.874 242.244 138.654 242.244Z" fill="url(#vkgrad)"/><defs><linearGradient id="vkgrad" x1="18.55" y1="69.3" x2="258.7" y2="207.9" gradientUnits="userSpaceOnUse"><stop stop-color="#89F7FE"/><stop offset="1" stop-color="#66A6FF"/></linearGradient></defs></svg>`;
  }

  function nowTime() {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ap = h < 12 ? '오전' : '오후';
    h = h % 12;
    if (h === 0) h = 12;
    return `${ap} ${h}:${m}`;
  }

  // ---- 스타일 ----
  const css = `
  .vk-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:2147482999;display:none}
  .vk-launcher{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border:none;border-radius:50%;
    background:${BRAND};cursor:pointer;display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 16px rgba(0,0,0,.16);z-index:2147483002;transition:transform .15s ease}
  .vk-launcher:hover{transform:scale(1.05)}
  .vk-launcher svg{width:26px;height:26px}
  .vk-launcher.vk-active{background:#fff;border:1px solid #E5E5E5}
  .vk-launcher.vk-active svg{stroke:#56E893}
  .vk-panel{position:fixed;right:24px;bottom:92px;width:380px;max-width:calc(100vw - 32px);height:600px;
    max-height:calc(100vh - 120px);background:#fff;border:1px solid #ECECEC;border-radius:16px;
    box-shadow:0 12px 40px rgba(0,0,0,.14);z-index:2147483000;display:none;flex-direction:column;overflow:hidden;
    font-family:'Pretendard',system-ui,'Apple SD Gothic Neo',sans-serif}
  .vk-panel.vk-open{display:flex}
  .vk-header{position:relative;padding:14px 14px;border-bottom:1px solid #F2F2F2;display:flex;align-items:center;gap:8px}
  .vk-profile{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
  .vk-avatar{width:34px;height:34px;border-radius:50%;background:#F4F8FF;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .vk-title{font-size:16px;font-weight:600;letter-spacing:-0.02em;color:#1A1A1A;line-height:1.2}
  .vk-sub{font-size:12px;color:#8A8A8A;margin-top:1px}
  .vk-more{background:none;border:none;cursor:pointer;padding:6px;flex-shrink:0;display:flex;align-items:center}
  .vk-more svg{width:4px;height:18px}
  .vk-min{background:none;border:none;cursor:pointer;padding:6px;flex-shrink:0;display:flex;align-items:center}
  .vk-min svg{width:20px;height:20px}
  .vk-menu{position:absolute;top:50px;right:12px;background:#fff;border:1px solid #ECECEC;border-radius:12px;
    box-shadow:0 8px 24px rgba(0,0,0,.12);padding:6px;display:none;flex-direction:column;min-width:160px;z-index:5}
  .vk-menu.vk-open{display:flex}
  .vk-menu button{background:none;border:none;text-align:left;font-family:inherit;font-size:14px;color:#1A1A1A;
    padding:10px 12px;border-radius:8px;cursor:pointer}
  .vk-menu button:hover{background:#F5F5F5}
  .vk-menu button.vk-exit{color:#E5484D}
  .vk-notice{border-bottom:1px solid #F2F2F2;background:#FBFBFB;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;cursor:pointer}
  .vk-notice-ic{color:#9AA0A6;flex-shrink:0;margin-top:1px}
  .vk-notice-ic svg{width:16px;height:16px;display:block}
  .vk-notice-text{flex:1;font-size:13px;line-height:1.5;color:#5A5A5A;white-space:pre-wrap}
  .vk-notice.vk-collapsed .vk-notice-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .vk-notice-arrow{color:#B0B0B0;flex-shrink:0;font-size:11px;margin-top:2px;transition:transform .15s}
  .vk-notice.vk-collapsed .vk-notice-arrow{transform:rotate(180deg)}
  .vk-body{flex:1;min-height:0;overflow-y:auto;padding:16px;background:#FAFAFA;display:flex;flex-direction:column;gap:8px}
  .vk-msg{max-width:80%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
  .vk-bot{align-self:flex-start;background:#fff;border:1px solid #EDEDED;color:#1A1A1A;border-bottom-left-radius:4px}
  .vk-user{align-self:flex-end;background:${BRAND};color:#0A2A1A;border-bottom-right-radius:4px}
  .vk-msg img{max-width:100%;border-radius:8px;margin-top:6px;display:block}
  .vk-meta{align-self:flex-start;display:flex;align-items:center;gap:5px;font-size:12px;color:#9AA0A6;margin:-2px 0 4px 2px}
  .vk-meta-ic{width:15px;height:15px;border-radius:50%;background:#F4F8FF;display:flex;align-items:center;justify-content:center}
  .vk-meta-ic svg{width:12px;height:12px}
  .vk-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#fff;border:1px solid #EDEDED;border-radius:14px}
  .vk-typing span{width:6px;height:6px;border-radius:50%;background:#BDBDBD;animation:vk-blink 1.2s infinite}
  .vk-typing span:nth-child(2){animation-delay:.2s}.vk-typing span:nth-child(3){animation-delay:.4s}
  @keyframes vk-blink{0%,60%,100%{opacity:.3}30%{opacity:1}}
  .vk-inline-actions{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:92%;margin-top:2px}
  .vk-chip{background:#fff;border:1px solid #DDD;color:#1A1A1A;font-size:14px;font-weight:500;padding:8px 13px;border-radius:18px;
    cursor:pointer;font-family:inherit;transition:border-color .12s,background .12s}
  .vk-chip:hover{border-color:${BRAND};background:#F4FCF7}
  .vk-chip.vk-accent{border-color:${BRAND};font-weight:600}
  .vk-foot{padding:12px;border-top:1px solid #F2F2F2;display:flex;flex-direction:column;gap:8px}
  .vk-preview{display:flex;gap:8px;flex-wrap:wrap}
  .vk-preview:empty{display:none}
  .vk-thumb{position:relative;width:56px;height:56px;border-radius:8px;overflow:hidden;border:1px solid #E2E2E2}
  .vk-thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .vk-thumb button{position:absolute;top:2px;right:2px;width:16px;height:16px;border:none;border-radius:50%;
    background:rgba(0,0,0,.55);color:#fff;font-size:11px;line-height:16px;text-align:center;cursor:pointer;padding:0}
  .vk-foot-row{display:flex;gap:8px;align-items:flex-end}
  .vk-attach{border:none;background:none;cursor:pointer;padding:8px 2px;color:#9AA0A6;flex-shrink:0;display:flex;align-items:center}
  .vk-attach svg{width:20px;height:20px}
  .vk-attach:hover{color:${BRAND}}
  .vk-input{flex:1;resize:none;border:1px solid #E2E2E2;border-radius:10px;padding:10px 12px;font-size:16px;
    font-family:inherit;max-height:96px;outline:none;line-height:1.4;background:#fff}
  .vk-input:focus{border-color:${BRAND}}
  .vk-send{border:none;background:${BRAND};color:#0A2A1A;font-weight:600;font-size:15px;border-radius:10px;
    padding:10px 16px;cursor:pointer;flex-shrink:0}
  .vk-send:disabled{opacity:.5;cursor:default}
  @media (max-width:480px){
    .vk-panel{top:16px;bottom:88px;left:12px;right:12px;width:auto;max-width:none;height:auto;max-height:none;border-radius:16px}
    .vk-overlay.vk-open{display:block}
  }
  `;
  const pretendard = document.createElement('link');
  pretendard.rel = 'stylesheet';
  pretendard.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/static/pretendard.min.css';
  document.head.appendChild(pretendard);

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // 아이콘
  const dotsIcon =
    '<svg viewBox="0 0 4 18" fill="#9AA0A6"><circle cx="2" cy="2" r="2"/><circle cx="2" cy="9" r="2"/><circle cx="2" cy="16" r="2"/></svg>';
  const noticeIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>';
  const clipIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
  // 접기(최소화) 아이콘
  const chevronDown =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#9AA0A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  // ---- DOM ----
  const launcher = document.createElement('button');
  launcher.className = 'vk-launcher';
  launcher.setAttribute('aria-label', '상담 열기');
  launcher.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><path d="M6 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h0a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z"/><path d="M18 12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h0a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/><path d="M20 17v1a3 3 0 0 1-3 3h-3"/></svg>';

  const panel = document.createElement('div');
  panel.className = 'vk-panel';
  panel.innerHTML = `
    <div class="vk-header">
      <div class="vk-profile">
        <span class="vk-avatar">${logo(22)}</span>
        <div>
          <div class="vk-title">${BOT_NAME}</div>
          <div class="vk-sub">보통 몇 분 안에 답변드려요</div>
        </div>
      </div>
      <button class="vk-min" aria-label="접기">${chevronDown}</button>
      <button class="vk-more" aria-label="메뉴">${dotsIcon}</button>
      <div class="vk-menu">
        <button data-act="home">처음으로 돌아가기</button>
        <button data-act="exit" class="vk-exit">상담 나가기</button>
      </div>
    </div>
    <div class="vk-notice">
      <span class="vk-notice-ic">${noticeIcon}</span>
      <div class="vk-notice-text">${NOTICE}</div>
      <span class="vk-notice-arrow">⌃</span>
    </div>
    <div class="vk-body"></div>
    <div class="vk-foot">
      <div class="vk-preview"></div>
      <div class="vk-foot-row">
        <button class="vk-attach" aria-label="사진 첨부">${clipIcon}</button>
        <textarea class="vk-input" rows="1" placeholder="메시지를 입력해주세요."></textarea>
        <button class="vk-send">전송</button>
      </div>
    </div>
    <input type="file" class="vk-file" accept="image/*" multiple style="display:none" />`;

  const overlay = document.createElement('div');
  overlay.className = 'vk-overlay';
  overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  // 모바일은 의도치 않은 닫힘을 막기 위해 딤 배경 탭으로 닫지 않음. 닫기는 ⌄(접기)·메뉴로만.
  document.body.appendChild(overlay);
  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const minBtn = panel.querySelector('.vk-min');
  const moreBtn = panel.querySelector('.vk-more');
  const menu = panel.querySelector('.vk-menu');
  const notice = panel.querySelector('.vk-notice');
  const body = panel.querySelector('.vk-body');
  const preview = panel.querySelector('.vk-preview');
  const attachBtn = panel.querySelector('.vk-attach');
  const fileInput = panel.querySelector('.vk-file');
  const input = panel.querySelector('.vk-input');
  const sendBtn = panel.querySelector('.vk-send');

  // ---- 헬퍼 ----
  function addMessage(role, text, images) {
    const el = document.createElement('div');
    el.className = 'vk-msg ' + (role === 'user' ? 'vk-user' : 'vk-bot');
    if (text) el.textContent = text;
    (images || []).forEach((url) => {
      const img = document.createElement('img');
      img.src = url;
      el.appendChild(img);
    });
    body.appendChild(el);
    if (role !== 'user') {
      const meta = document.createElement('div');
      meta.className = 'vk-meta';
      meta.innerHTML = `<span class="vk-meta-ic">${logo(12)}</span><span>${BOT_NAME}, ${nowTime()}</span>`;
      body.appendChild(meta);
    }
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'vk-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function makeChip(label, onClick, cls) {
    const b = document.createElement('button');
    b.className = 'vk-chip' + (cls ? ' ' + cls : '');
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  // 선택지 칩을 봇 메시지처럼 대화 영역(body) 안에 인라인으로 추가.
  // 칩을 누르면 그 그룹은 사라지고(선택 기록은 user 말풍선으로 남음) 다음 단계가 이어짐.
  function addActions(buttons) {
    const wrap = document.createElement('div');
    wrap.className = 'vk-inline-actions';
    buttons.forEach((b) => {
      const chip = makeChip(b.label, () => { wrap.remove(); b.onClick(); }, b.accent ? 'vk-accent' : '');
      wrap.appendChild(chip);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  // ---- 첨부 미리보기 ----
  function renderPreview() {
    preview.innerHTML = '';
    pendingImages.forEach((url, i) => {
      const t = document.createElement('div');
      t.className = 'vk-thumb';
      t.innerHTML = `<img src="${url}" alt=""><button aria-label="삭제">×</button>`;
      t.querySelector('button').addEventListener('click', () => {
        pendingImages.splice(i, 1);
        renderPreview();
      });
      preview.appendChild(t);
    });
  }

  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        pendingImages.push(reader.result);
        renderPreview();
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  });

  // ---- 화면 흐름(인라인 누적) ----
  // 처음으로: 카테고리 메뉴를 다시 띄움(대화 기록은 유지)
  function home() { mainScreen(); }

  // 1단계: 카테고리 메뉴
  function mainScreen() {
    addActions(
      MACROS.items.map((cat) => ({
        label: cat.label,
        onClick: () => { addMessage('user', cat.label); categoryScreen(cat); },
      }))
    );
  }

  // 2단계: 선택한 카테고리의 세부 질문(바로 표시)
  function categoryScreen(cat) {
    const nodes = (cat.children || []).map((node) => ({ label: node.label, onClick: () => onNode(node) }));
    nodes.push({ label: '다른 메뉴 보기', onClick: () => { addMessage('user', '다른 메뉴 보기'); mainScreen(); } });
    addActions(nodes);
  }

  // 3단계: 답변 후 후속 선택지
  function onNode(node) {
    addMessage('user', node.label);
    if (node.handoff) { requestHandoff(); return; }
    addMessage('bot', node.answer);
    escalationScreen();
  }

  function escalationScreen() {
    addActions([
      { label: '해결됐어요', onClick: () => { addMessage('bot', '도움이 됐다니 다행이에요. 더 궁금한 게 있으면 아래에서 골라주세요.'); mainScreen(); } },
      { label: 'AI에게 물어보기', accent: true, onClick: () => { addMessage('bot', '무엇이든 편하게 입력해 주세요. 사진도 첨부할 수 있어요.'); if (window.innerWidth > 480) input.focus(); } },
      { label: '상담사 연결', onClick: requestHandoff },
    ]);
  }

  async function sendAI() {
    const text = input.value.trim();
    const images = pendingImages.slice();
    if (!text && images.length === 0) return; // 어느 단계에서든 입력/첨부하면 AI가 응답

    addMessage('user', text, images);
    input.value = '';
    input.style.height = 'auto';
    pendingImages = [];
    renderPreview();

    // OpenAI 비전 형식: 텍스트만이면 string, 이미지 있으면 멀티파트
    let content;
    if (images.length > 0) {
      content = [];
      if (text) content.push({ type: 'text', text });
      images.forEach((url) => content.push({ type: 'image_url', image_url: { url } }));
    } else {
      content = text;
    }
    history.push({ role: 'user', content });

    input.disabled = true; sendBtn.disabled = true;
    const typing = showTyping();
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await r.json();
      typing.remove();
      const reply = data.text || data.error || '응답을 받지 못했습니다.';
      addMessage('bot', reply);
      if (data.text) history.push({ role: 'assistant', content: data.text });
    } catch (e) {
      typing.remove();
      addMessage('bot', '지금 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.');
    } finally {
      input.disabled = false; sendBtn.disabled = false; input.focus();
    }
  }

  async function requestHandoff() {
    addMessage('bot', '상담사 연결을 요청하고 있어요…');
    try {
      await fetch(HANDOFF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, page: location.href }),
      });
    } catch (e) { /* 접수 실패해도 사용자에겐 안내만 */ }
    addMessage('bot', '상담사 연결이 접수됐어요. 영업시간 내 순차적으로 답변드릴게요. 급하시면 본사 대표번호로 연락해 주세요.');
  }

  // ---- 헤더 동작 ----
  minBtn.addEventListener('click', () => toggle(false));
  moreBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('vk-open'); });
  menu.addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    menu.classList.remove('vk-open');
    if (act === 'home') home();
    else if (act === 'exit') { resetConversation(); toggle(false); }
  });
  notice.addEventListener('click', () => notice.classList.toggle('vk-collapsed'));
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !moreBtn.contains(e.target)) menu.classList.remove('vk-open');
    // 데스크톱만 '패널 밖 클릭' 닫기. 모바일은 overlay(딤) 탭으로만 닫아 iOS 합성 click 오작동(빠른메뉴 탭 시 닫힘) 방지
    if (opened && window.innerWidth > 480 && !panel.contains(e.target) && !launcher.contains(e.target)) toggle(false);
  });

  // ---- 열기/닫기 ----
  // 상담 나가기: 대화 전체 초기화(다시 열면 처음부터). 접기(⌄)는 유지.
  function resetConversation() {
    body.innerHTML = '';
    history.length = 0;
    pendingImages = [];
    renderPreview();
  }
  let opened = false;
  function toggle(open) {
    opened = open;
    panel.classList.toggle('vk-open', open);
    overlay.classList.toggle('vk-open', open);
    launcher.classList.toggle('vk-active', open);
    document.body.style.overflow = (open && window.innerWidth <= 480) ? 'hidden' : '';
    if (open && body.childElementCount === 0) {
      addMessage('bot', MACROS.greeting);
      home();
    }
    if (open && window.innerWidth > 480) input.focus(); // 모바일은 자동 포커스 안 함(키보드 튐 방지)
  }
  launcher.addEventListener('click', () => toggle(!opened));

  // ---- 입력 ----
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 96) + 'px';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); }
  });
  sendBtn.addEventListener('click', sendAI);
})();
