# Cipherlab

A responsive text encryption and decryption playground. All text transformations run locally in the browser; text and passwords are never stored or sent to a server.


## Run locally

Requires Node.js 22 or later. No dependencies or installation needed.

```sh
npm run dev
```

Open http://localhost:5173. Use `PORT=8080 npm run dev` to choose a different port.

## Included methods

- Caesar cipher: selectable shift from 0 to 25.
- Vigenère cipher: an A–Z keyword; spaces and punctuation do not advance the key.
- Atbash and ROT13: reversible letter substitutions with no key.
- Base64: UTF-8 encoding and decoding, including Khmer and emoji.
- AES-256-GCM: password-based encryption using Web Crypto, PBKDF2-SHA-256 with 310,000 iterations, a fresh 16-byte salt, and a fresh 12-byte nonce. Results use the `CY1.` format (salt + nonce + authenticated ciphertext, Base64 encoded).

Classical ciphers are intended for learning and puzzles. Base64 is encoding rather than encryption. Use AES for password-protected messages; decrypting requires the entire result and the same password. AES requires HTTPS or localhost.

Results update automatically when you type, paste, or change the method, mode, shift, keyword, or password. AES waits until you pause typing for 300 ms, and results from older inputs are discarded. Clearing the input clears the result. The transform button and Ctrl/⌘ + Enter still work for an immediate update.

The interface also includes copy, download, input/output swapping, sample messages, alphabet previews, and a method guide. Refreshing clears your text and passwords. Google Fonts is used for typography, with local fallback fonts.

## Verify

```sh
npm test
```

Static hosting needs only the contents of `web/dist`. The development server is bound to localhost.

@Built by Codex-ChatGPT6.1Ultra
