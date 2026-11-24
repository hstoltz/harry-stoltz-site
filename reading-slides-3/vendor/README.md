# Offline runtime dependencies

No package manager or JavaScript build step is needed to view this deck.

- `reveal/`: the exact assets served alongside Aleks Kissinger's September 2025 ZX seminar deck. The library identifies itself as **Reveal.js 5.1.0**. The core JS, reset CSS, presentation CSS, math, Markdown and highlight assets were also byte-compared with the official 5.1.0 release and match.
- `reveal/plugin/notes/notes.js`: official Reveal 5.1.0 notes plugin, added for local speaker view. The reference talk did not enable it.
- `katex/`: **KaTeX 0.18.9**, including auto-render, CSS and every distributed math font. This is the version returned by the reference plugin's `@latest` URL when inspected on 2026-09-26. The historical September 2025 version cannot be recovered from an unpinned URL alone.
- `fonts/`: the Quicksand 400/700 and Open Sans 400/700 normal/italic faces returned for the exact Google Fonts CSS requests in Aleks's theme. The Quicksand response does not supply italic faces. Local `fonts.css` replaces only remote URLs.

`provenance.json` records download sources and SHA-256 hashes; `SHA256SUMS` covers the saved runtime files and license/provenance documents. To check these files from the project root:

```sh
shasum -a 256 -c vendor/SHA256SUMS
```

Reveal and KaTeX are MIT licensed. Reveal's bundled Marked is MIT licensed and Highlight.js is BSD-3-Clause licensed. The font families use the SIL Open Font License. Their license notices are included here. The original theme attribution is preserved in `theme.css`; the unmodified Oxford source is retained separately under `reference/` for comparison.

The reference's QR-code helper was specific to linking its own talk and is not needed by the new deck. No QR-code or original presentation content is copied into `slides.html`.
