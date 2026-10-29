/* Reveal orchestration for the original book keyframes. No endpoint is redrawn. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const rows = [...document.querySelectorAll('svg[data-row-proof]')];
  if (!rows.length) return;
  const running = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sourceHold = 220;
  const durations = { '1-1': 3200, '1-2': 4200, '2-1': 4600, '2-2': 3400, '2-3': 3200 };
  const clamp = x => Math.max(0, Math.min(1, x));
  const svgElement = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    return el;
  };
  const rowFor = row => rows.find(svg => svg.dataset.rowProof === String(row));
  const panelFor = (svg, step) => svg.querySelector('[data-panel="' + step + '"]');
  const nativeLayers = new Map();
  function clipRectangle(svg, selector) {
    const group=svg.querySelector(selector),ref=group.getAttribute('clip-path').match(/#([^)]*)/)[1];
    return svg.querySelector('#'+ref+' rect');
  }
  function normalizedRectangle(svg, rect) {
    const v=svg.viewBox.baseVal;
    return svgElement('rect',{x:(+rect.getAttribute('x')-v.x)/v.width,y:(+rect.getAttribute('y')-v.y)/v.height,width:+rect.getAttribute('width')/v.width,height:+rect.getAttribute('height')/v.height});
  }
  function initializeNativeLayer(svg) {
    const row=svg.dataset.rowProof,figure=svg.closest('figure');
    const original=document.createElement('img');
    original.className='diagram vap-original';original.src='assets/book/row-op'+row+'.svg';
    original.setAttribute('width',svg.getAttribute('width'));original.setAttribute('height',svg.getAttribute('height'));
    original.alt='Original book vector-addition derivation';
    const source=original.cloneNode(true);source.classList.add('vap-source');source.alt='';source.style.display='none';
    figure.prepend(original);figure.append(source);
    const defs=svgElement('defs'),mask=svgElement('clipPath',{id:'vap-visible-'+row,clipPathUnits:'objectBoundingBox'});
    defs.append(mask);
    for(const panel of svg.querySelectorAll('[data-panel]')){
      const i=panel.dataset.panel,clip=svgElement('clipPath',{id:'vap-source-'+row+'-'+i,clipPathUnits:'objectBoundingBox'});
      clip.append(normalizedRectangle(svg,clipRectangle(svg,'[data-endpoint="'+i+'"]')));defs.append(clip);
    }
    svg.append(defs);
    nativeLayers.set(svg,{original,source,mask});
  }
  function updateNativeMask(svg) {
    const {original,mask}=nativeLayers.get(svg);mask.replaceChildren();
    mask.append(normalizedRectangle(svg,clipRectangle(svg,'[data-endpoint="0"]')));
    let complete=true;
    for(const fragment of svg.querySelectorAll('[data-row-step]')){
      const step=Number(fragment.dataset.rowStep),panel=panelFor(svg,step);
      if(!fragment.classList.contains('visible')){complete=false;continue;}
      mask.append(normalizedRectangle(svg,clipRectangle(svg,'[data-relation="'+step+'"] > g[clip-path]')));
      if(Number(panel.dataset.progress)===1)mask.append(normalizedRectangle(svg,clipRectangle(svg,'[data-endpoint="'+step+'"]')));
      else complete=false;
    }
    original.style.clipPath=complete?'none':'url(#'+mask.id+')';
  }
  rows.forEach(initializeNativeLayer);
  function stop(key) {
    if (running.has(key)) cancelAnimationFrame(running.get(key));
    running.delete(key);
  }
  function unionPath(a, b) {
    const r = a.r, d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d >= 2 * r) return null;
    if (d < 1e-8) return `M ${a.x-r} ${a.y} A ${r} ${r} 0 1 0 ${a.x+r} ${a.y} A ${r} ${r} 0 1 0 ${a.x-r} ${a.y} Z`;
    const theta = Math.atan2(b.y-a.y, b.x-a.x), alpha = Math.acos(d/(2*r));
    const p = {x:a.x+r*Math.cos(theta+alpha), y:a.y+r*Math.sin(theta+alpha)};
    const q = {x:a.x+r*Math.cos(theta-alpha), y:a.y+r*Math.sin(theta-alpha)};
    return `M ${p.x} ${p.y} A ${r} ${r} 0 1 1 ${q.x} ${q.y} A ${r} ${r} 0 1 1 ${p.x} ${p.y} Z`;
  }
  function draw(row, step, raw = 1) {
    const svg = rowFor(row), panel = panelFor(svg, step);
    const endpoint = panel.querySelector('[data-endpoint]');
    const motion = panel.querySelector('[data-motion]');
    const t = clamp(raw), key = row + '-' + step;
    panel.dataset.progress = t;
    endpoint.style.display = 'none';
    motion.style.display = t === 1 ? 'none' : '';
    motion.replaceChildren();
    const native=nativeLayers.get(svg);native.source.style.display='none';
    updateNativeMask(svg);
    if (t === 1) { panel.dataset.phase = 'exact-target'; return; }
    const previous = panelFor(svg, step-1);
    const targetX = Number(panel.dataset.outputX);
    if (t === 0) {
      const vb=svg.viewBox.baseVal,style=getComputedStyle(native.original);
      const scale=Math.min(parseFloat(style.width)/vb.width,parseFloat(style.height)/vb.height);
      native.source.style.clipPath='url(#vap-source-'+row+'-'+(step-1)+')';
      native.source.style.transform=`translateX(${(targetX-Number(previous.dataset.outputX))*scale}px)`;
      native.source.style.display='';
      panel.dataset.phase = 'exact-source';
      return;
    }
    const f = window.vectorAdditionMotion.frame(Number(row), step, t);
    panel.dataset.phase = f.phase;
    const group = svgElement('g', {transform:`translate(${targetX} 0)`, 'data-live-graph':key});
    for (const edge of f.edges) {
      const p = edge.points;
      const d = p.length === 4
        ? `M ${p[0].x} ${p[0].y} C ${p[1].x} ${p[1].y} ${p[2].x} ${p[2].y} ${p[3].x} ${p[3].y}`
        : `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y}`;
      group.append(svgElement('path', {d, fill:'none', stroke:edge.stroke, 'stroke-width':edge.width, 'stroke-miterlimit':10, 'data-live-edge':edge.id}));
    }
    const nodes = Object.fromEntries(f.nodes.map(n=>[n.id,n]));
    const united = new Set(), unions = [];
    for (const pair of f.unions || []) {
      const a=nodes[pair.a], b=nodes[pair.b];
      if (!a || !b) continue;
      const d=unionPath(a,b);
      if (!d) continue;
      united.add(a.id); united.add(b.id);
      const blue = a.width >= b.width ? a : b;
      unions.push(svgElement('path', {d, fill:a.fill, stroke:blue.stroke, 'stroke-width':blue.width, 'data-node-union':a.id+'-'+b.id}));
    }
    for (const n of f.nodes) {
      if (n.kind === 'boundary' || united.has(n.id)) continue;
      group.append(svgElement('circle', {cx:n.x,cy:n.y,r:n.r,fill:n.fill,stroke:n.stroke,'stroke-width':n.width,'data-live-node':n.id}));
    }
    unions.sort((a,b)=>(a.getAttribute('fill')==='#d8f8d8')-(b.getAttribute('fill')==='#d8f8d8'));
    group.append(...unions);
    motion.append(group);
    // The output ellipses are native Computer Modern glyphs at their original
    // coordinates; they never inherit the SVG defaults used by moving geometry.
    const context = panel.querySelector('[data-motion-context]') || endpoint;
    for (const text of context.querySelectorAll('text')) {
      if (text.textContent.trim() !== '...') continue;
      const clone=text.cloneNode(true);
      motion.append(clone);
    }
  }
  function animate(row, step) {
    const key=row+'-'+step;
    stop(key);
    if (reduced.matches) { draw(row,step,1); return; }
    const start=performance.now()+sourceHold, duration=durations[key];
    draw(row,step,0);
    const tick=now=>{
      const t=clamp((now-start)/duration);
      draw(row,step,t);
      if(t<1) running.set(key,requestAnimationFrame(tick));
      else running.delete(key);
    };
    running.set(key,requestAnimationFrame(tick));
  }
  function finish() {
    for (const key of [...running.keys()]) stop(key);
    for (const svg of rows) for (const fragment of svg.querySelectorAll('[data-row-step]')) draw(svg.dataset.rowProof,Number(fragment.dataset.rowStep),1);
  }
  function sync(event, play) {
    finish();
    const fragment=event?.fragment;
    if(play && fragment?.hasAttribute('data-row-step') && fragment.classList.contains('visible')) {
      animate(fragment.closest('svg[data-row-proof]').dataset.rowProof, Number(fragment.dataset.rowStep));
    }
  }
  function bind() {
    Reveal.on('fragmentshown',e=>sync(e,true));
    Reveal.on('fragmenthidden',e=>sync(e,false));
    Reveal.on('slidechanged',()=>sync(null,false));
    finish();
  }
  if(window.Reveal?.isReady()) bind(); else window.Reveal?.on('ready',bind);
  window.vectorAdditionProof={
    finish,
    seek(row,step,t=1){stop(row+'-'+step);draw(row,step,t);},
    frame:(row,step,t)=>window.vectorAdditionMotion.frame(row,step,t),
    timing:{sourceHold,durations},
    get animating(){return running.size>0;}
  };
  window.addEventListener('beforeprint',finish);
})();
