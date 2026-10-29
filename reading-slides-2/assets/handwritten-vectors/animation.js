/* Entry-by-entry vector reading for Harry's handwritten slide 9. */
(() => {
 const slide=document.getElementById('zx-normal-form');
 if(!slide || !slide.querySelector('.vector-example-graph')) return;
 const graph=slide.querySelector('.vector-example-graph');
 const guide=graph.querySelector('.zero-check-guide');
 function focus(coordinate){
  graph.querySelectorAll('.focused').forEach(e=>e.classList.remove('focused'));
  guide.setAttribute('visibility','hidden');
  guide.removeAttribute('data-coordinate');
  if(!coordinate)return;
  const [p,q]=coordinate.split('-');
  for(const selector of [`[data-green="${p}"]`,`[data-red="${q}"]`,`[data-qlabel="${q}"]`,`[data-wire="${p}-${q}"]`])graph.querySelector(selector)?.classList.add('focused');
  if(slide.querySelector(`.vector-bit[data-coordinate="${coordinate}"]`)?.dataset.value==='0'){
   const source=graph.querySelector(`[data-green="${p}"]`),target=graph.querySelector(`[data-red="${q}"]`);
   guide.setAttribute('d',`M${source.getAttribute('cx')} ${source.getAttribute('cy')}L${target.getAttribute('cx')} ${target.getAttribute('cy')}`);
   guide.dataset.coordinate=coordinate;
   guide.setAttribute('visibility','visible');
  }
 }
 function sync(){
  const finished=slide.querySelector('.vectors-clear-trigger').classList.contains('visible');
  slide.classList.toggle('vectors-finished',finished);
  const token=slide.querySelector('.vector-bit.current-fragment');
  focus(!finished&&Reveal.getCurrentSlide()===slide?token?.dataset.coordinate:null);
 }
 function seek(stage){
  const n=Math.max(-1,Math.min(7,Math.trunc(stage)));
  const index=Reveal.getIndices(slide).h;
  Reveal.slide(index,0,n);
  sync();
  return state();
 }
 function finish(){
  seek(7);
  return state();
 }
 function state(){
  return {slide:slide.id,fragment:Reveal.getCurrentSlide()===slide?Reveal.getIndices().f:null,
   visible:[...slide.querySelectorAll('.vector-bit.visible')].map(e=>e.dataset.coordinate),
   focused:slide.classList.contains('vectors-finished')?null:slide.querySelector('.vector-bit.current-fragment')?.dataset.coordinate||null,
   zeroCheck:guide.dataset.coordinate||null,
   vectors:[[1,0,1],[0,1,0]],edges:[[1,1],[1,3],[2,2]]};
 }
 const setup=()=>{Reveal.on('fragmentshown',sync);Reveal.on('fragmenthidden',sync);Reveal.on('slidechanged',sync);sync();};
 if(window.Reveal?.isReady())setup();else window.Reveal?.on('ready',setup);
 window.handwrittenVectors={seek,state,sync,finish};
 window.completenessVectors=window.handwrittenVectors;
})();
