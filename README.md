# Cipherlab

A responsive text encryption and decryption playground. All text transformations run locally in the browser; text and passwords are never stored or sent to a server.

## Host for free on GitHub Pages

This app is a static website: GitHub Pages serves the HTML, CSS, and JavaScript directly. It needs no backend, database, API keys, paid hosting, dependency installation, or build step.

1. Create an empty **public** GitHub repository, for example `CCypher2`. Public repositories support GitHub Pages on GitHub Free.
2. Push this entire project to the repository's default branch. Keep `.github/workflows/pages.yml` at the repository root and include `web/dist`; do not upload only the `web` folder. If using GitHub's browser upload, make sure the hidden `.github` directory is included.
3. Open the repository's **Settings → Pages**. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Open **Actions → Deploy Cipherlab to GitHub Pages → Run workflow**, selecting the default branch. Future pushes to the default branch deploy automatically after the tests pass.
5. Open the website link shown by the successful deployment or in **Settings → Pages**. For a repository named `CCypher2`, it normally looks like `https://YOUR-USERNAME.github.io/CCypher2/`.

For a new repository, run these commands from this project's root folder, replacing `YOUR-USERNAME` with your GitHub username. Git may ask you to sign in when pushing.

```sh
git init -b main
git add .
git commit -m "Add Cipherlab with GitHub Pages deployment"
git remote add origin https://github.com/YOUR-USERNAME/CCypher2.git
git push -u origin main
```

If you already have a Git repository or remote, use its existing branch and remote instead of initializing again.

The workflow uses GitHub's automatic `GITHUB_TOKEN`; you do not need to create a personal access token or repository secret. Only `web/dist` is published. Node.js runs the tests in GitHub Actions and is not needed by website visitors.

Assets and module imports use relative URLs, so repository sites, account sites (`YOUR-USERNAME.github.io`), and custom domains work without changing the code. Use the HTTPS URL so AES encryption and clipboard access work. Refreshing the page and the logo link keep you inside the hosted app.

If the first run fails during **Configure GitHub Pages**, confirm that Pages is enabled with **GitHub Actions** selected, then rerun the workflow. If a deployment is skipped, select or push to the repository's default branch. If the home page is missing, check that the workflow uploads `web/dist`, not the repository root.

References: [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), and [custom deployment workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

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
