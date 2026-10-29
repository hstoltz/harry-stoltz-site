/* User's connectivity move on slide 8. Only positions change. */
(() => {
  const svg=document.getElementById('handwritten-states-normalise');
  if(!svg)return;
  const marker=svg.closest('[data-states-normalise]');
  const section=svg.closest('section');
  const starts=[[46,104],[46,152]],ends=[[46,52],[46,100]],red=[[110,28],[110,124]];
  const duration=2800,sourceHold=180;
  let progress=0,raf=0,started=0;
  function seek(t){
    progress=Math.max(0,Math.min(1,Number(t)||0));
    const u=progress**3*(10-15*progress+6*progress**2);
    const pos=starts.map((p,i)=>p.map((x,j)=>x+(ends[i][j]-x)*u));
    svg.querySelectorAll('[data-state-z]').forEach(e=>{const p=pos[+e.dataset.stateZ];e.setAttribute('cx',p[0]);e.setAttribute('cy',p[1]);});
    svg.querySelectorAll('[data-state-wire]').forEach(e=>{const [a,b]=e.dataset.stateWire.split('-').map(Number);e.setAttribute('d',`M${pos[a][0]} ${pos[a][1]} L${red[b][0]} ${red[b][1]}`);});
    svg.querySelector('[data-state-k]').setAttribute('transform',`translate(0 ${-52*u})`);
    svg.dataset.progress=String(progress);
  }
  function pause(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function finish(){pause();seek(1);}
  function animate(){
    pause();seek(0);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    started=performance.now()+sourceHold;
    const tick=now=>{seek((now-started)/duration);if(progress<1)raf=requestAnimationFrame(tick);else raf=0;};
    raf=requestAnimationFrame(tick);
  }
  function boot(){
    if(!window.Reveal?.isReady()){setTimeout(boot,20);return;}
    Reveal.on('fragmentshown',e=>{if(e.fragment===marker)animate();});
    Reveal.on('fragmenthidden',e=>{if(e.fragment===marker){pause();seek(0);}});
    Reveal.on('slidechanged',e=>{pause();if(e.currentSlide===section)seek(marker.classList.contains('visible')?1:0);});
    if(marker.classList.contains('visible'))finish();else seek(0);
  }
  window.handwrittenStates={seek,finish,pause,timing:{duration,sourceHold},get progress(){return progress;},get state(){return {progress,edges:[[0,0],[0,1],[1,0],[1,1]],colours:['Z','Z','X','X'],outputOrder:[0,1]};}};
  boot();
})();
