import { methods, transform } from './ciphers.js';

const $ = id => document.getElementById(id);
const icon = (name, extra = '') => `<svg class="icon ${extra}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const state = { method: 'caesar', mode: 'encrypt', shift: 3, keyword: 'LEMON', password: '', revision: 0, busy: false };
const input = $('input-text');
const output = $('output-text');
let toastTimer;
let autoTimer;
let pendingRun = false;
let composing = false;

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2800);
}
function count(text) { return Array.from(text).length; }
function updateCounts() {
  for (const [el, target] of [[input, 'input-count'], [output, 'output-count']]) {
    const n = count(el.value);
    $(target).textContent = `${n.toLocaleString()} character${n === 1 ? '' : 's'}`;
  }
  $('copy-button').disabled = $('download-button').disabled = !output.value;
  $('swap-button').disabled = !output.value || state.busy;
}
function invalidate() {
  clearTimeout(autoTimer);
  pendingRun = false;
  state.revision++;
  output.value = '';
  $('error-message').hidden = true;
  $('output-tag').textContent = 'READY WHEN YOU ARE';
  $('output-tag').classList.remove('done');
  updateCounts();
  if (input.value && !composing) {
    autoTimer = setTimeout(() => run(true), state.method === 'aes' ? 300 : 0);
  }
}
function operation() { return state.method === 'base64' ? (state.mode === 'encrypt' ? 'Encode' : 'Decode') : (state.mode === 'encrypt' ? 'Encrypt' : 'Decrypt'); }
function updateMode() {
  for (const mode of ['encrypt', 'decrypt']) {
    const active = state.mode === mode;
    $(mode + '-tab').classList.toggle('active', active);
    $(mode + '-tab').setAttribute('aria-pressed', active);
    $(mode + '-tab').innerHTML = icon(mode === 'encrypt' ? 'lock' : 'unlock', 'small') + (state.method === 'base64' ? (mode === 'encrypt' ? 'Encode' : 'Decode') : mode[0].toUpperCase() + mode.slice(1));
  }
  $('transform-button').innerHTML = icon(state.mode === 'encrypt' ? 'lock' : 'unlock', 'small') + `<span>${operation()} text</span>` + icon('arrow', 'small');
  $('input-label').textContent = state.mode === 'encrypt' ? 'Your message' : (state.method === 'base64' ? 'Encoded message' : 'Encrypted message');
  $('output-label').textContent = state.mode === 'encrypt' ? (state.method === 'base64' ? 'Encoded result' : 'Encrypted result') : 'Your original message';
  input.placeholder = state.mode === 'encrypt' ? 'Every secret starts with a few words…' : (state.method === 'aes' ? 'Paste your CY1. encrypted message here…' : 'Paste a message to reveal its meaning…');
  output.placeholder = state.mode === 'encrypt' ? 'A little mystery will appear here…' : 'Your original words will appear here…';
  $('preserve-note').textContent = state.method === 'aes' ? 'Password stays in this tab only' : state.method === 'base64' ? 'Unicode & emoji supported' : 'Letter case & punctuation preserved';
  renderVisual();
}
function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  invalidate();
  updateMode();
}
function updateShift(value) {
  state.shift = value;
  $('shift-input').value = value;
  $('shift-range').value = value;
  $('shift-from').textContent = state.mode === 'encrypt' ? 'A' : String.fromCharCode(65 + value);
  $('shift-to').textContent = state.mode === 'encrypt' ? String.fromCharCode(65 + value) : 'A';
  invalidate();
  renderVisual();
}
function renderParameters() {
  const type = methods[state.method].key;
  const panel = $('parameters');
  if (type === 'shift') {
    panel.innerHTML = `<div class="parameter-row"><label class="parameter-label" for="shift-input">Shift amount ${icon('info')}</label><div class="stepper"><button id="shift-minus" aria-label="Decrease shift">−</button><input id="shift-input" type="number" min="0" max="25" step="1" value="${state.shift}"/><button id="shift-plus" aria-label="Increase shift">+</button></div><div class="range-wrap"><span>0</span><input id="shift-range" aria-label="Shift amount slider" type="range" min="0" max="25" value="${state.shift}"/><span>25</span></div><div class="shift-preview"><span>Each letter moves</span><strong id="shift-from">A</strong>${icon('arrow')}<strong id="shift-to">D</strong></div></div>`;
    $('shift-minus').onclick = () => updateShift((Number(state.shift) + 25) % 26);
    $('shift-plus').onclick = () => updateShift((Number(state.shift) + 1) % 26);
    $('shift-input').oninput = event => {
      const value = event.target.value;
      if (value === '' || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 25) { invalidate(); return; }
      updateShift(Number(value));
    };
    $('shift-input').onchange = () => updateShift(Math.max(0, Math.min(25, Math.round(Number($('shift-input').value) || 0))));
    $('shift-range').oninput = event => updateShift(Number(event.target.value));
    $('shift-from').textContent = state.mode === 'encrypt' ? 'A' : String.fromCharCode(65 + state.shift);
    $('shift-to').textContent = state.mode === 'encrypt' ? String.fromCharCode(65 + state.shift) : 'A';
  } else if (type === 'keyword') {
    panel.innerHTML = `<div class="parameter-row"><label class="parameter-label" for="keyword-input">${icon('key')} Secret keyword</label><input class="field-input" id="keyword-input" placeholder="e.g. LEMON" autocomplete="off" spellcheck="false"/><span class="parameter-hint">Letters A–Z only</span></div>`;
    $('keyword-input').value = state.keyword;
    $('keyword-input').oninput = event => { state.keyword = event.target.value; invalidate(); renderVisual(); };
  } else if (type === 'password') {
    panel.innerHTML = `<div class="parameter-row"><label class="parameter-label" for="password-input">${icon('key')} Your password</label><div class="password-wrap"><input class="field-input" id="password-input" type="password" placeholder="Enter a strong password" autocomplete="off" spellcheck="false"/><button id="show-password" class="icon-button" aria-label="Show password" aria-pressed="false">${icon('eye', 'small')}</button></div><span class="parameter-hint">Needed to decrypt your message</span></div>`;
    $('password-input').value = state.password;
    $('password-input').oninput = event => { state.password = event.target.value; invalidate(); };
    $('show-password').onclick = () => {
      const visible = $('password-input').type === 'password';
      $('password-input').type = visible ? 'text' : 'password';
      $('show-password').setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      $('show-password').setAttribute('aria-pressed', visible);
    };
  } else {
    panel.innerHTML = `<div class="parameter-row"><div class="no-key">${icon('check')} ${state.method === 'base64' ? 'No key needed. Encode any text, including emoji and Unicode.' : 'No key needed. This method works the same in both directions.'}</div></div>`;
  }
}
function renderVisual() {
  const m = state.method;
  const data = methods[m];
  const visual = $('explanation-visual');
  if (['caesar', 'atbash', 'rot13'].includes(m)) {
    const shift = m === 'rot13' ? 13 : state.shift;
    const source = [0, 1, 2, 3, 4, 5, 6];
    const mapped = source.map(n => String.fromCharCode(65 + (m === 'atbash' ? 25 - n : (n + shift * (state.mode === 'decrypt' ? -1 : 1) + 26) % 26)));
    const letters = source.map(n => String.fromCharCode(65 + n));
    visual.innerHTML = `<div class="alphabet-label"><span>A SMALL SHIFT IN PERSPECTIVE</span><span class="shift-pill">${m === 'atbash' ? 'MIRROR' : `SHIFT ${String(shift).padStart(2, '0')}`}</span></div><div class="alphabet-row">${letters.map(c => `<span>${c}</span>`).join('')}<span class="ellipsis">···</span></div><div class="alphabet-arrows">${letters.map(() => '<span>↓</span>').join('')}<span></span></div><div class="alphabet-row bottom">${mapped.map(c => `<span>${c}</span>`).join('')}<span class="ellipsis">···</span></div><div class="alphabet-caption">${m === 'atbash' ? 'The end is just another beginning.' : `Same alphabet. ${shift === 0 ? 'No shift. Your words stay the same.' : 'A different story.'}`}</div>`;
  } else {
    visual.innerHTML = `<div class="alphabet-label"><span>${m === 'aes' ? 'PRIVATE BY DESIGN' : m === 'base64' ? 'A CHANGE OF FORMAT' : 'A KEY TO THE PATTERN'}</span><span class="shift-pill">${m === 'aes' ? 'AES-256' : m === 'base64' ? 'UTF-8' : 'A–Z'}</span></div><div class="visual-steps">${data.steps.map((step, i) => `<div class="visual-step"><b>${String(i + 1).padStart(2, '0')}</b>${step}</div>`).join('')}</div><p class="visual-note"></p>`;
    visual.querySelector('.visual-note').textContent = m === 'vigenere' ? `Your keyword: ${state.keyword || 'choose a word'} · A = 0, B = 1, C = 2…` : m === 'aes' ? 'A new random salt and nonce for every message.' : 'SGVsbG8= is just another way to say Hello.';
  }
}
function setMethod(method) {
  if (state.method !== method) {
    state.method = method;
    state.mode = 'encrypt';
    invalidate();
  }
  const data = methods[method];
  document.querySelectorAll('.method-button').forEach(button => {
    const active = button.dataset.method === method;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  $('method-title').textContent = data.name;
  $('method-description').textContent = data.description;
  $('method-type').textContent = data.type;
  $('method-symbol').innerHTML = icon(data.icon);
  $('explanation-eyebrow').textContent = data.label;
  $('explanation-title').textContent = { caesar: 'A classic. With a twist.', vigenere: 'The secret is in the keyword.', atbash: 'A different kind of reflection.', rot13: 'A halfway turn. A full return.', base64: 'Same words. New language.', aes: 'For words meant to stay private.' }[method];
  $('explanation-about').textContent = data.about;
  $('method-detail').textContent = data.detail;
  renderParameters();
  updateMode();
}
async function run(automatic = false) {
  clearTimeout(autoTimer);
  if (state.busy) { pendingRun = true; return; }
  if (!input.value) {
    if (automatic) return;
    $('error-message').textContent = 'Add a message first. Even a little mystery needs a few words.';
    $('error-message').hidden = false;
    input.focus();
    return;
  }
  if (automatic && ((state.method === 'aes' && !state.password) || (state.method === 'vigenere' && !state.keyword))) return;
  const revision = state.revision;
  state.busy = true;
  $('transform-button').disabled = true;
  $('transform-button').innerHTML = icon('rotate', 'small') + '<span>Working on it…</span>';
  $('error-message').hidden = true;
  updateCounts();
  try {
    const options = { ...state, shift: state.method === 'caesar' ? Number($('shift-input').value) : state.shift };
    if (state.method === 'caesar' && $('shift-input').value === '') throw new Error('Choose a whole-number shift from 0 to 25.');
    const result = await transform(input.value, state.method, state.mode, options);
    if (revision !== state.revision) return;
    output.value = result;
    $('output-tag').textContent = 'A LITTLE MAGIC, DONE';
    $('output-tag').classList.add('done');
    updateCounts();
  } catch (error) {
    if (revision !== state.revision) return;
    output.value = '';
    $('error-message').textContent = error.message;
    $('error-message').hidden = false;
    updateCounts();
  } finally {
    state.busy = false;
    $('transform-button').disabled = false;
    updateMode();
    updateCounts();
    if (pendingRun) {
      pendingRun = false;
      run(true);
    }
  }
}

const nav = $('method-nav');
for (const [id, data] of Object.entries(methods)) {
  const button = document.createElement('button');
  button.className = 'method-button';
  button.dataset.method = id;
  button.innerHTML = icon(data.icon) + `<span>${data.name}</span>` + (id === 'aes' ? '<span class="nav-marker">AES</span>' : '');
  button.onclick = () => setMethod(id);
  nav.append(button);
  const guideButton = document.createElement('button');
  guideButton.className = 'guide-method';
  guideButton.innerHTML = icon(data.icon) + `<div><h3>${data.name}</h3><p>${data.description}</p></div><span>${data.type.toUpperCase()}</span>`;
  guideButton.onclick = () => { $('guide-dialog').close(); setMethod(id); $('workspace').scrollIntoView({ behavior: 'smooth' }); };
  $('guide-methods').append(guideButton);
}
$('encrypt-tab').onclick = () => { setMode('encrypt'); if (state.method === 'caesar') renderParameters(); };
$('decrypt-tab').onclick = () => { setMode('decrypt'); if (state.method === 'caesar') renderParameters(); };
input.addEventListener('input', invalidate);
input.addEventListener('compositionstart', () => { composing = true; clearTimeout(autoTimer); pendingRun = false; });
input.addEventListener('compositionend', () => { composing = false; invalidate(); });
$('transform-button').onclick = () => run();
$('clear-button').onclick = () => { input.value = ''; invalidate(); input.focus(); };
$('example-button').onclick = async () => {
  state.mode = 'encrypt';
  input.value = methods[state.method].example;
  invalidate(); updateMode();
  if (state.method === 'caesar') renderParameters();
  if (state.method === 'aes' && !state.password) { clearTimeout(autoTimer); $('password-input').focus(); toast('Enter your own password to try AES encryption.'); return; }
  await run();
};
$('swap-button').onclick = () => {
  if (!output.value || state.busy) return;
  input.value = output.value;
  state.mode = state.mode === 'encrypt' ? 'decrypt' : 'encrypt';
  invalidate(); updateMode();
  if (state.method === 'caesar') renderParameters();
  run();
};
$('copy-button').onclick = async () => {
  if (!output.value) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(output.value);
    toast('Copied. Your secret is ready to travel.');
  } catch { output.focus(); output.select(); toast('Result selected. Press Ctrl+C or ⌘C to copy.'); }
};
$('download-button').onclick = () => {
  if (!output.value) return;
  const url = URL.createObjectURL(new Blob([output.value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `cipherlab-${state.method}-${state.mode === 'encrypt' ? 'encrypted' : 'decrypted'}.txt`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Your result has been downloaded.');
};
const showGuide = () => $('guide-dialog').showModal();
for (const id of ['guide-button', 'about-button', 'learn-button']) $(id).onclick = showGuide;
$('method-info').onclick = () => $('explanation').scrollIntoView({ behavior: 'smooth', block: 'center' });
$('close-dialog').onclick = () => $('guide-dialog').close();
$('guide-dialog').addEventListener('click', event => {
  if (event.target !== $('guide-dialog')) return;
  const box = $('guide-dialog').getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('guide-dialog').close();
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !$('guide-dialog').open) { event.preventDefault(); run(); }
});
if (/Mac|iPhone|iPad/.test(navigator.platform)) document.querySelector('.shortcut').innerHTML = '<kbd>⌘</kbd> + <kbd>↵</kbd>';
setMethod('caesar');
input.value = methods.caesar.example;
await run();
