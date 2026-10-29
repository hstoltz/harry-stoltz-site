(()=>{
 const slide=document.getElementById('nonuniqueness');
 if(!slide)return;
 const trigger=slide.querySelector('.nonunique-trigger');
 const labelTrigger=slide.querySelector('.nonunique-label-trigger');
 // Hide only the brace and its label: retain all KaTeX layout boxes so
 // revealing them never moves the span equation or the rows underneath.
 const under=slide.querySelector('.nonunique-span .katex-html > .katex-base > .munder');
 const label=under?.querySelector(':scope > .vlist-t > .vlist-r > .vlist > span:first-child');
 const brace=under?.querySelector('.katex-stretchy');
 for(const piece of [label,brace])piece?.classList.add('nonunique-brace-piece');
 function syncBuilds(){slide.classList.toggle('nonunique-has-span-label',labelTrigger.classList.contains('visible'));}
 const host=slide.querySelector('.nonunique-middle');
 const expanded=host.querySelector('.nonunique-expanded');
 const condensed=host.querySelector('.nonunique-condensed');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const duration=2800,sourceHold=180;
 const clamp=t=>Math.max(0,Math.min(1,t));
 const ease=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
 let raf=0,progress=trigger.classList.contains('visible')?1:0,geometry=null;
 const layer=document.createElement('div');
 layer.className='nonunique-motion-layer';layer.setAttribute('aria-hidden','true');host.appendChild(layer);
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
 function measure(){
  const rect=host.getBoundingClientRect(),scale=rect.width/host.offsetWidth;
  if(!scale)return false;
  const layouts=[expanded,condensed].map(el=>{
   const math=el.querySelector('.math'),r=math.getBoundingClientRect();
   const bases=[...math.querySelector('.katex-html').children];
   const left=bases[0].querySelector(':scope > .mopen').getBoundingClientRect();
   const right=bases.at(-1).querySelector(':scope > .mopen').getBoundingClientRect();
   return {math,r,left,right};
  });
  const target=layouts[1],relations=[...target.math.querySelectorAll('.katex-html > .katex-base > .mrel')];
  const first=relations[0].getBoundingClientRect(),last=relations.at(-1).getBoundingClientRect();
  const width=target.r.width/scale,height=target.r.height/scale;
  // Slice the existing typesetting, preserving KaTeX spacing and glyph sizes.
  // The small blank margins include the relation signs with the moving ends.
  const leftCut=(first.right-target.r.left)/scale+2;
  const rightCut=(last.left-target.r.left)/scale-2;
  layer.replaceChildren();
  for(const [name,a,b] of [['left',0,leftCut],['middle',leftCut,rightCut],['right',rightCut,width]]){
   const piece=document.createElement('div');piece.className='nonunique-motion-piece';piece.dataset.part=name;
   Object.assign(piece.style,{left:(target.r.left-rect.left)/scale+'px',top:(target.r.top-rect.top)/scale+'px',width:width+'px',height:height+'px',clipPath:`inset(-8px ${width-b}px -8px ${a}px)`});
   const clone=target.math.cloneNode(true);clone.style.width=width+'px';clone.style.margin='0';piece.appendChild(clone);layer.appendChild(piece);
  }
  geometry={left:{x:(layouts[0].left.left-target.left.left)/scale,y:(layouts[0].left.top-target.left.top)/scale},right:{x:(layouts[0].right.left-target.right.left)/scale,y:(layouts[0].right.top-target.right.top)/scale}};
  return true;
 }
 function draw(p){
  progress=clamp(p);layer.dataset.progress=progress;
  const moving=progress>0&&progress<1;
  slide.classList.toggle('nonunique-moving',moving);
  slide.classList.toggle('nonunique-is-condensed',progress===1);
  if(!moving||!geometry)return;
  // The new middle expression replaces the old one once. The outer
  // interpretations then move inward, without fading or scaling any glyph.
  for(const side of ['left','right']){
   const d=geometry[side];layer.querySelector(`[data-part="${side}"]`).style.transform=`translate(${d.x*(1-progress)}px,${d.y*(1-progress)}px)`;
  }
 }
 function finish(){stop();syncBuilds();draw(trigger.classList.contains('visible')?1:0);}
 function animate(target){
  stop();if(reduced.matches||!measure()){draw(target);return;}
  const from=progress,start=performance.now()+sourceHold;
  function tick(now){const t=clamp((now-start)/duration);draw(from+(target-from)*ease(t));if(t<1)raf=requestAnimationFrame(tick);else raf=0;}
  draw(from);raf=requestAnimationFrame(tick);
 }
 function seek(p){stop();measure();draw(p);}
 Reveal.on('fragmentshown',e=>{syncBuilds();if(e.fragment===trigger)animate(1);else if(slide.contains(e.fragment))finish();});
 Reveal.on('fragmenthidden',e=>{syncBuilds();if(e.fragment===trigger)animate(0);else if(slide.contains(e.fragment))finish();});
 ['ready','slidechanged','resize'].forEach(event=>Reveal.on(event,finish));
 reduced.addEventListener('change',finish);window.addEventListener('beforeprint',finish);
 window.nonuniqueExample={sync:finish,finish,seek,timing:{duration,sourceHold},get progress(){return progress;},get animating(){return !!raf;}};
 finish();
})();
