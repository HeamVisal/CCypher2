export const methods = {
  caesar: { name: 'Caesar cipher', short: 'Caesar', label: 'THE ORIGINAL LETTER SHIFT', type: 'Classical cipher', icon: 'rotate', description: 'One small shift. A whole new message.', about: 'Named after Julius Caesar, this cipher moves every letter a fixed number of places through the alphabet. Simple, timeless, and a perfect place to start.', example: 'Meet me where the story begins.', key: 'shift', steps: ['Choose a shift', 'Move each letter', 'Keep the secret'], detail: 'Letters wrap around from Z to A. Spaces, punctuation, and letter case stay just as you wrote them.' },
  vigenere: { name: 'Vigenère cipher', short: 'Vigenère', label: 'A KEYWORD CHANGES EVERYTHING', type: 'Classical cipher', icon: 'key', description: 'One keyword. Many different shifts.', about: 'Vigenère repeats your keyword over the letters in your message. Each key letter sets a different shift, giving this classical cipher a changing pattern.', example: 'Attack at dawn!', key: 'keyword', steps: ['Pick a keyword', 'Repeat it over the text', 'Shift with each letter'], detail: 'Use an A–Z keyword. Only letters advance the key; spaces, punctuation, and case are preserved.' },
  atbash: { name: 'Atbash cipher', short: 'Atbash', label: 'TURN THE ALPHABET AROUND', type: 'Classical cipher', icon: 'arrows', description: 'The alphabet, seen in a mirror.', about: 'Atbash pairs the first letter with the last, the second with the second-to-last, and so on. The same operation both encrypts and decrypts your message.', example: 'Every secret has a story.', key: null, steps: ['Reverse the alphabet', 'Find each letter’s pair', 'Reveal the reflection'], detail: 'A becomes Z, B becomes Y, and C becomes X. Apply Atbash twice to get back your original text.' },
  rot13: { name: 'ROT13', short: 'ROT13', label: 'HALFWAY AROUND THE ALPHABET', type: 'Classical cipher', icon: 'rotate', description: 'Thirteen places. Two ways home.', about: 'ROT13 is Caesar cipher with a fixed shift of 13. Because 13 is half the alphabet, repeating the transformation brings your original message back.', example: 'Hello, curious world!', key: null, steps: ['Start with a letter', 'Shift thirteen places', 'Repeat to reverse'], detail: 'No key to remember. A–Z and a–z shift by 13; all other characters pass through unchanged.' },
  base64: { name: 'Base64', short: 'Base64', label: 'TEXT, IN ANOTHER FORM', type: 'Encoding', icon: 'code', description: 'A different format. The same meaning.', about: 'Base64 represents text bytes using a compact set of printable characters. It is handy for moving text between systems, and supports Unicode messages too.', example: 'Hello, world! សួស្តី 🌍', key: null, steps: ['Read the text bytes', 'Group the bits', 'Encode as characters'], detail: 'Base64 is encoding, not encryption. Anyone can decode it without a key. UTF-8 text is supported.' },
  aes: { name: 'AES-256-GCM', short: 'AES-256', label: 'A PASSWORD-PROTECTED MESSAGE', type: 'Modern encryption', icon: 'shield', description: 'Your message. Your password.', about: 'AES-GCM encrypts your message and checks that it has not been changed. A fresh random salt and nonce make each encrypted result different, even for the same text.', example: 'Some words are just for you.', key: 'password', steps: ['Enter a password', 'Encrypt in your browser', 'Share the result safely'], detail: 'Uses AES-256-GCM with a PBKDF2-SHA-256 key (310,000 iterations). Keep your password separately; it is needed to decrypt the CY1 message.' }
};

const mod = (n, m) => ((n % m) + m) % m;
function substitute(text, shiftFor) {
  let index = 0;
  return text.replace(/[a-z]/gi, (char) => {
    const base = char >= 'a' ? 97 : 65;
    const code = char.charCodeAt(0) - base;
    return String.fromCharCode(base + mod(shiftFor(code, index++), 26));
  });
}
export function toBase64(bytes) {
  let str = '';
  for (let i = 0; i < bytes.length; i += 8192) str += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(str);
}
export function fromBase64(text) {
  const compact = text.replace(/\s/g, '');
  if (compact.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)) throw new Error('Enter valid Base64 text, including its padding (=).');
  const bytes = Uint8Array.from(atob(compact), ch => ch.charCodeAt(0));
  if (toBase64(bytes) !== compact) throw new Error('This Base64 text is not valid. Check the last characters.');
  return bytes;
}
async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function transform(text, method, mode = 'encrypt', options = {}) {
  const direction = mode === 'decrypt' ? -1 : 1;
  if (!methods[method]) throw new Error('Choose a supported method.');
  if (method === 'caesar') {
    const shift = Number(options.shift ?? 3);
    if (!Number.isInteger(shift) || shift < 0 || shift > 25) throw new Error('Choose a whole-number shift from 0 to 25.');
    return substitute(text, code => code + shift * direction);
  }
  if (method === 'vigenere') {
    if (!/^[a-z]+$/i.test(options.keyword ?? '')) throw new Error('Enter a keyword using only letters A–Z.');
    const key = options.keyword.toUpperCase();
    return substitute(text, (code, index) => code + (key.charCodeAt(index % key.length) - 65) * direction);
  }
  if (method === 'atbash') return substitute(text, code => 25 - code);
  if (method === 'rot13') return substitute(text, code => code + 13);
  if (method === 'base64') {
    if (mode === 'encrypt') return toBase64(new TextEncoder().encode(text));
    try { return new TextDecoder('utf-8', { fatal: true }).decode(fromBase64(text)); }
    catch (error) { if (error instanceof TypeError) throw new Error('The decoded data is not valid UTF-8 text.'); throw error; }
  }
  if (!crypto.subtle) throw new Error('AES needs a secure connection. Open this app on HTTPS or localhost.');
  if (!options.password) throw new Error('Enter a password to protect or unlock your message.');
  if (mode === 'encrypt') {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(options.password, salt);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)));
    const result = new Uint8Array(28 + ciphertext.length);
    result.set(salt); result.set(iv, 16); result.set(ciphertext, 28);
    return 'CY1.' + toBase64(result);
  }
  if (!text.startsWith('CY1.')) throw new Error('Paste a Cipherlab AES message starting with CY1.');
  const bytes = fromBase64(text.slice(4));
  if (bytes.length < 44) throw new Error('This AES message is incomplete. Paste the full CY1 message.');
  try {
    const key = await deriveKey(options.password, bytes.slice(0, 16));
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(16, 28) }, key, bytes.slice(28));
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  } catch { throw new Error('Could not decrypt. Check the password and make sure the message has not been changed.'); }
}
