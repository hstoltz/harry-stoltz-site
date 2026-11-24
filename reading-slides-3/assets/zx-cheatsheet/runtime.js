/* Keyboard-accessible reference using the book's native SVG glyphs. */
(() => {
  'use strict';
  const icon = (name, alt) => `<img src="assets/zx-cheatsheet/icons/${name}.svg" alt="${alt}" draggable="false">`;
  const math = text => `<span class="zxcs-math">\\(${text}\\)</span>`;
  const row = (file, alt, coefficient, interpretation, action='') =>
    `<tr><td><span class="zxcs-picture">${coefficient ? math(coefficient) : '<span class="zxcs-no-coefficient" aria-hidden="true"></span>'}${icon(file,alt)}</span></td>`+
    `<td><span class="zxcs-interpretation">${math('='+interpretation)}</span>${action?`<span class="zxcs-action">${math(action)}</span>`:''}</td></tr>`;
  const stateFactor=String.raw`\frac1{\sqrt2}`;
  const stateRows = [
    ['state-zero','Red spider of phase zero',String.raw`\ket{0}`],
    ['state-one','Red spider of phase pi',String.raw`\ket{1}`],
    ['state-plus','Green spider of phase zero',String.raw`\ket{+}`],
    ['state-minus','Green spider of phase pi',String.raw`\ket{-}`]
  ].map(([file,alt,value])=>row(file,alt,stateFactor,value)).join('');
  const rt=String.raw;
  const gateRows=[
    ['gate-i','A plain wire','',rt`I`],
    ['gate-h','Hadamard box on a wire','',rt`H=\tfrac1{\sqrt2}\begin{pmatrix}1&1\\1&-1\end{pmatrix}`],
    ['gate-x','Red spider of phase pi on a wire','',rt`X=\begin{pmatrix}0&1\\1&0\end{pmatrix}`],
    ['gate-z','Green spider of phase pi on a wire','',rt`Z=\begin{pmatrix}1&0\\0&-1\end{pmatrix}`],
    ['gate-s','Green spider of phase pi over two on a wire','',rt`S=\operatorname{diag}(1,i)`],
    ['gate-s-dagger','Green spider of phase minus pi over two on a wire','',rt`S^\dagger=\operatorname{diag}(1,-i)`],
    ['gate-cnot','Green control spider joined to a red target spider',rt`\sqrt2`,rt`\operatorname{CNOT}`,rt`\ket{a,b}\mapsto\ket{a,a\oplus b}`],
    ['gate-cz','Two green spiders connected by a Hadamard',rt`\sqrt2`,rt`\operatorname{CZ}`,rt`\ket{a,b}\mapsto(-1)^{ab}\ket{a,b}`]
  ];
  const singleRows=gateRows.slice(0,6).map(args=>row(...args)).join('');
  const twoRows=gateRows.slice(6).map(args=>row(...args)).join('');
  const group=`<tr class="zxcs-group"><th colspan="2" scope="rowgroup">Two-qubit gates</th></tr>`;
  const table=(heading,id,rows,more='',tableName=heading)=>`<section class="zxcs-section" aria-labelledby="${id}"><h3 id="${id}">${heading}</h3><table aria-label="${tableName}"><thead class="zxcs-visually-hidden"><tr><th scope="col">ZX diagram</th><th scope="col">Interpretation</th></tr></thead><tbody>${rows}${more}</tbody></table></section>`;
  const dialog=document.createElement('dialog');
  dialog.className='zxcs-popup';
  dialog.tabIndex=-1;
  dialog.setAttribute('aria-labelledby','zxcs-title');
  dialog.setAttribute('aria-modal','true');
  dialog.innerHTML=`<button class="zxcs-close" type="button" aria-label="Close reference">×</button><h2 id="zxcs-title">ZX diagrams</h2><div class="zxcs-tables">${table('States','zxcs-states',stateRows,group+twoRows,'States and two-qubit gates')}${table('Single-qubit gates','zxcs-gates',singleRows)}</div>`;
  document.body.append(dialog);
  if(typeof renderMathInElement==='function')renderMathInElement(dialog,{delimiters:[{left:'\\(',right:'\\)',display:false}],throwOnError:false,macros:{'\\ket':'\\lvert#1\\rangle'}});
  let opener=null;
  const close=()=>{if(!dialog.open)return;dialog.close();opener?.focus?.({preventScroll:true});};
  const open=()=>{if(dialog.open||document.querySelector('dialog[open]'))return;opener=document.activeElement;dialog.showModal();dialog.focus({preventScroll:true});};
  dialog.querySelector('.zxcs-close').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();});
  document.addEventListener('keydown',event=>{
    if(dialog.open){
      event.stopImmediatePropagation();
      if(event.key==='Escape'||(!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key.toLowerCase()==='v')){event.preventDefault();close();}
      return;
    }
    if(event.ctrlKey||event.metaKey||event.altKey||event.key.toLowerCase()!=='v'||event.repeat||event.target?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]')||document.querySelector('dialog[open]'))return;
    event.preventDefault();event.stopImmediatePropagation();open();
  },true);
  window.addEventListener('beforeprint',close);
})();
