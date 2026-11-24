renderMathInElement(document.body, {
  delimiters: [
    {left: '\\[', right: '\\]', display: true},
    {left: '\\(', right: '\\)', display: false},
  ],
  macros: {'\\ket': '\\lvert#1\\rangle', '\\bra': '\\langle#1\\rvert'},
  throwOnError: true,
  strict: 'ignore',
});

Reveal.initialize({
  width: 960,
  height: 700,
  margin: .08,
  center: false,
  controls: false,
  touch: false,
  progress: true,
  slideNumber: 'c/t',
  hash: true,
  transition: 'none',
  navigationMode: 'linear',
  scrollActivationWidth: null,
  plugins: [RevealNotes],
});
