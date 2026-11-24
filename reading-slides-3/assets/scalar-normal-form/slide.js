/* Reveal owns the advances. Each diagram piece declares the builds on which it is present. */
function enableDiagramBuilds(slide) {
  const steps = [...slide.querySelectorAll('.sf-step')];
  const pieces = [...slide.querySelectorAll('[data-sf-on]')].map(element => ({
    element,
    steps: element.dataset.sfOn.split(' ').map(Number)
  }));
  let previous = -1;

  function showBuild() {
    const current = steps.filter(step => step.classList.contains('visible')).length;
    if (current === previous) return;
    previous = current;
    slide.dataset.scalarBuild = String(current);
    for (const piece of pieces) {
      const visible = piece.steps.includes(current);
      piece.element.classList.toggle('sf-visible', visible);
      piece.element.setAttribute('aria-hidden', String(!visible));
      piece.element.inert = !visible;
    }
    slide.dispatchEvent(new CustomEvent("diagram-build", {detail: current}));
  }

  for (const template of slide.querySelectorAll('template')) {
    renderMathInElement(template.content, {
      delimiters: [{left: '\\(', right: '\\)', display: false}],
      throwOnError: true,
      strict: 'ignore'
    });
  }
  Reveal.on('ready', showBuild);
  Reveal.on('slidechanged', showBuild);
  Reveal.on('fragmentshown', showBuild);
  Reveal.on('fragmenthidden', showBuild);
  showBuild();
}

document.querySelectorAll("#scalar-decomposition, #scalar-normal-form, .course-build").forEach(enableDiagramBuilds);
