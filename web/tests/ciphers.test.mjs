import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transform, fromBase64, toBase64 } from '../dist/ciphers.js';

test('Caesar uses the known shift, wraps, and preserves punctuation, case, and Unicode', async () => {
  assert.equal(await transform('Hello, World! Zz សួស្តី 🌍', 'caesar', 'encrypt', { shift: 3 }), 'Khoor, Zruog! Cc សួស្តី 🌍');
  for (let shift = 0; shift < 26; shift++) {
    const message = 'Abc XYZ z! សួស្តី 🌍';
    const encrypted = await transform(message, 'caesar', 'encrypt', { shift });
    assert.equal(await transform(encrypted, 'caesar', 'decrypt', { shift }), message);
  }
  await assert.rejects(transform('abc', 'caesar', 'encrypt', { shift: 26 }), /shift/);
  await assert.rejects(transform('abc', 'caesar', 'encrypt', { shift: 2.5 }), /whole-number/);
});
test('Vigenère matches the LEMON vector and skips spaces when advancing its key', async () => {
  assert.equal(await transform('ATTACKATDAWN', 'vigenere', 'encrypt', { keyword: 'LEMON' }), 'LXFOPVEFRNHR');
  assert.equal(await transform('Attack at dawn!', 'vigenere', 'encrypt', { keyword: 'lemon' }), 'Lxfopv ef rnhr!');
  assert.equal(await transform('Lxfopv ef rnhr!', 'vigenere', 'decrypt', { keyword: 'LEMON' }), 'Attack at dawn!');
  await assert.rejects(transform('abc', 'vigenere', 'encrypt', { keyword: '' }), /keyword/);
  await assert.rejects(transform('abc', 'vigenere', 'encrypt', { keyword: '123' }), /keyword/);
});
test('Atbash and ROT13 are self-inverse and match known examples', async () => {
  assert.equal(await transform('Abc XYZ!', 'atbash'), 'Zyx CBA!');
  assert.equal(await transform('Hello, World!', 'rot13'), 'Uryyb, Jbeyq!');
  for (const method of ['atbash', 'rot13']) {
    const original = 'A small secret. Zz 🌍';
    assert.equal(await transform(await transform(original, method), method, 'decrypt'), original);
  }
});
test('Base64 matches known UTF-8 vectors and handles Unicode and long text', async () => {
  assert.equal(await transform('Hello', 'base64'), 'SGVsbG8=');
  for (const text of ['សួស្តី 🌍 café', '', 'a'.repeat(100000)]) {
    assert.equal(await transform(await transform(text, 'base64'), 'base64', 'decrypt'), text);
  }
  assert.equal(await transform('SGVs\nbG8=', 'base64', 'decrypt'), 'Hello');
});
test('Base64 rejects malformed, noncanonical, or non-UTF-8 input', async () => {
  for (const text of ['%%%=', 'SGVsbG8', 'AB==', '//==', '/w==']) await assert.rejects(transform(text, 'base64', 'decrypt'));
});
test('AES round trips Unicode, randomizes every message, and rejects wrong passwords and tampering', async () => {
  const message = 'A secret. សួស្តី 🌍';
  const options = { password: 'a long private passphrase 🔑' };
  const a = await transform(message, 'aes', 'encrypt', options);
  const b = await transform(message, 'aes', 'encrypt', options);
  assert.ok(a.startsWith('CY1.'));
  assert.notEqual(a, b);
  assert.equal(await transform(a, 'aes', 'decrypt', options), message);
  await assert.rejects(transform(a, 'aes', 'decrypt', { password: 'wrong' }), /Could not decrypt/);
  const bytes = fromBase64(a.slice(4)); bytes[bytes.length - 1] ^= 1;
  await assert.rejects(transform('CY1.' + toBase64(bytes), 'aes', 'decrypt', options), /Could not decrypt/);
  await assert.rejects(transform(message, 'aes', 'encrypt', { password: '' }), /password/);
  await assert.rejects(transform('something', 'aes', 'decrypt', options), /CY1/);
  await assert.rejects(transform('CY1.YQ==', 'aes', 'decrypt', options), /incomplete/);
});
