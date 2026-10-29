/* Literal spider unfusion in the functorial proof. No opacity interpolation. */
(() => {
  const section=document.getElementById('state-semantics-proof');
  if(!section)return;
  const svg=section.querySelector('svg[data-semantics-graph="unfused"]');
  if(!svg)return;
  const marker=svg.closest('[data-semantics-unfuse]')||svg.closest('.fragment');
  const NS='http://www.w3.org/2000/svg',R=6.378,rows=[48,96],outputs=[28,116];
  const duration=3000,sourceHold=180;
  let progress=1,raf=0;
  const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
  const ease=t=>t*t*t*(10+t*(-15+6*t));
  function unionPath(x1,x2,y){
    const d=Math.abs(x2-x1);
    if(d>=2*R)return null;
    if(d<1e-9)return `M${x1-R} ${y}A${R} ${R} 0 1 0 ${x1+R} ${y}A${R} ${R} 0 1 0 ${x1-R} ${y}Z`;
    const middle=(x1+x2)/2,h=Math.sqrt(R*R-d*d/4);
    return `M${middle} ${y+h}A${R} ${R} 0 1 1 ${middle} ${y-h}A${R} ${R} 0 1 1 ${middle} ${y+h}Z`;
  }
  function seek(value){
    progress=clamp(value);
    const u=ease(progress),leaf=70-18*u,main=70+18*u;
    svg.dataset.progress=String(progress);
    for(const old of svg.querySelectorAll('[data-semantics-node-union]'))old.remove();
    for(let i=0;i<2;i++){
      const a=svg.querySelector(`[data-semantics-leaf-node="${i}"]`),b=svg.querySelector(`[data-semantics-main-node="${i}"]`);
      a.setAttribute('cx',leaf);b.setAttribute('cx',main);a.style.display=progress===0?'none':'';b.style.display='';
      svg.querySelector(`[data-semantics-input-edge="${i}"]`).setAttribute('d',`M${leaf} ${rows[i]}L${main} ${rows[i]}`);
      for(let j=0;j<2;j++)svg.querySelector(`[data-semantics-main-edge="${i}-${j}"]`).setAttribute('d',`M${main} ${rows[i]}L154 ${outputs[j]}`);
      const d=unionPath(leaf,main,rows[i]);
      if(progress>0&&d){
        a.style.display='none';b.style.display='none';
        const path=document.createElementNS(NS,'path');path.dataset.semanticsNodeUnion=String(i);
        path.setAttribute('d',d);path.setAttribute('fill','#d8f8d8');path.setAttribute('stroke','#000');path.setAttribute('stroke-width','.9');svg.appendChild(path);
      }
    }
    svg.querySelector('[data-semantics-green-dots]').setAttribute('transform',`translate(${main} 72)`);
    const leafDots=svg.querySelector('[data-semantics-leaf-dots]');
    leafDots.setAttribute('transform',`translate(${leaf} 72)`);
    leafDots.style.display=progress===0?'none':'';
  }
  function pause(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function finish(){pause();seek(1);}
  function animate(reverse=false){
    pause();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){seek(reverse?0:1);return;}
    seek(reverse?1:0);
    const start=performance.now()+sourceHold;
    function tick(now){const t=clamp((now-start)/duration);seek(reverse?1-t:t);if(t<1)raf=requestAnimationFrame(tick);else raf=0;}
    raf=requestAnimationFrame(tick);
  }
  function boot(){
    if(!window.Reveal?.isReady()){setTimeout(boot,20);return;}
    Reveal.on('fragmentshown',e=>{if(e.fragment===marker||e.fragment.contains(svg))animate();});
    Reveal.on('fragmenthidden',e=>{if(e.fragment===marker||e.fragment.contains(svg)){pause();seek(0);}});
    Reveal.on('slidechanged',()=>{pause();seek(marker?.classList.contains('visible')?1:0);});
    seek(marker?.classList.contains('visible')?1:0);
  }
  window.stateSemanticsProof={seek:t=>{pause();seek(t);},finish,get progress(){return progress;},get animating(){return raf!==0;},timing:{duration,sourceHold}};
  window.addEventListener('beforeprint',finish);
  boot();
})();
