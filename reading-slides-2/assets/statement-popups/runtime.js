/* Same-page statement recall: copy the already-typeset source, without its proof. */
(() => {
  const host = document.querySelector('.reveal');
  if (!host) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'statement-popup';
  dialog.id = 'statement-popup';
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'statement-popup-title');
  dialog.innerHTML = '<button type="button" class="statement-popup-close" aria-label="Close statement">×</button><div class="content statement-popup-body"></div>';
  host.append(dialog);
  const body = dialog.querySelector('.statement-popup-body');
  let opener;

  function close() {
    if (!dialog.open) return;
    dialog.close();
    opener?.focus({preventScroll: true});
  }

  function open(link) {
    const source = link.dataset.statementTemplate
      ? document.getElementById(link.dataset.statementTemplate)?.content
      : document.getElementById(link.dataset.statementSource)?.querySelector('.content');
    if (!source) return;
    const statement = [];
    for (const child of source.children) {
      if (child.classList.contains('statement-label') && child.textContent.trim() === 'Proof.') break;
      const clone = child.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      statement.push(clone);
    }
    body.replaceChildren(...statement);
    body.firstElementChild.id = 'statement-popup-title';
    opener = link;
    link.setAttribute('aria-controls', dialog.id);
    dialog.showModal();
    dialog.querySelector('button').focus({preventScroll: true});
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-statement-source], a[data-statement-template]');
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    open(link);
  }, true);
  dialog.querySelector('button').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    // Native dialog backdrops report the dialog as their click target.
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  document.addEventListener('keydown', event => {
    if (!dialog.open) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    // Tab, Enter and Space retain their native dialog/button behavior.
  }, true);
  window.addEventListener('beforeprint', close);
  const bind = () => Reveal.on('slidechanged', close);
  if (window.Reveal?.isReady()) bind(); else window.Reveal?.on('ready', bind);
})();
