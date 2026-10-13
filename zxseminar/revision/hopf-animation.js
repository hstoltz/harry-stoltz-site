/* One-shot playback of Harry's earlier complementarity derivation GIF.
 * Posters and animation use one fixed canvas; no SVG geometry is tweened here.
 */
(()=>{
 'use strict';
 const controllers=new Map();let playNumber=0;
 function controller(box){
  if(controllers.has(box))return controllers.get(box);
  const media=box.querySelector('[data-hopf-media]');
  const first=box.querySelector('[data-hopf-first]'),last=box.querySelector('[data-hopf-last]');
  const rhs=box.querySelector('[data-hopf-rhs]');
  const duration=Number(box.dataset.hopfDuration);
  let generation=0,timer=0,animation=null,lastBuild=null,objectUrl=null;
  // Preload bytes, not a hidden running image. Each play decodes a new Blob URL
  // from memory, so a slow network cannot advance the GIF before it is shown.
  const bytes=/^https?:$/.test(location.protocol)
   ?fetch(new URL(box.dataset.hopfGif,document.baseURI)).then(r=>{if(!r.ok)throw Error('GIF HTTP '+r.status);return r.blob();}).catch(()=>null)
   :Promise.resolve(null);
  function stop(){
   generation++;clearTimeout(timer);timer=0;
   if(animation){animation.onload=null;animation.onerror=null;animation.remove();animation=null;}
   if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
   box.dataset.hopfRunning='false';
  }
  function setRhs(visible){rhs.style.opacity=visible?'1':'0';rhs.setAttribute('aria-hidden',String(!visible));}
  function poster(final){
   first.style.visibility=final?'hidden':'visible';last.style.visibility=final?'visible':'hidden';
   box.dataset.hopfStage=final?'5':'0';
  }
  function finish(){stop();setRhs(false);poster(true);}
  function reset(){stop();setRhs(true);poster(false);}
  async function play(){
   stop();setRhs(false);poster(false);
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
   const token=generation,blob=await bytes;if(token!==generation)return;
   const img=new Image();animation=img;
   img.className='hopf-gif-frame';img.alt='Complementarity derivation';
   img.style.visibility='hidden';img.dataset.hopfPlayingImage='';
   img.onload=()=>{
    if(token!==generation)return;
    img.style.visibility='visible';first.style.visibility='hidden';last.style.visibility='hidden';
    box.dataset.hopfRunning='true';box.dataset.hopfStage='playing';
    // A non-looping GIF holds its own final frame. The timer marks status only;
    // it must not cut short playback on a throttled or background browser tab.
    timer=setTimeout(()=>{if(token===generation){box.dataset.hopfRunning='false';box.dataset.hopfStage='5';}},duration);
   };
   img.onerror=()=>{if(token===generation){stop();poster(false);box.dataset.hopfError='GIF failed to load';}};
   // Each play gets its own decoder, including Back -> Next and file:// use.
   const src=new URL(box.dataset.hopfGif,document.baseURI);
   src.searchParams.set('play',String(Date.now())+'-'+(++playNumber));
   if(blob){objectUrl=URL.createObjectURL(blob);img.src=objectUrl;}else img.src=src.href;
   media.append(img);
  }
  function sync(build,active=true){
   if(!active){lastBuild=null;reset();return;}
   if(build===lastBuild)return;lastBuild=build;
   if(build<2)reset();else if(build===2)play();else finish();
  }
  const ctl={box,duration,play,reset,finish,sync,show:index=>index?finish():reset(),get stage(){return box.dataset.hopfStage;}};
  controllers.set(box,ctl);return ctl;
 }
 function init(){
  document.querySelectorAll('[data-hopf-animation]').forEach(box=>{
   if(controllers.has(box))return;
   const ctl=controller(box),section=box.closest('section');if(!section)return;
   const update=()=>ctl.sync(Number(section.dataset.build||0),!window.Reveal||!Reveal.isReady()||Reveal.getCurrentSlide()===section);
   new MutationObserver(update).observe(section,{attributes:true,attributeFilter:['data-build','class']});update();
  });
 }
 window.HopfAnimation={init,controllers,
  sync(section,build){init();section?.querySelectorAll('[data-hopf-animation]').forEach(box=>controller(box).sync(build,true));},
  finish(){controllers.forEach(c=>c.finish());},reset(){controllers.forEach(c=>c.reset());},play(){controllers.forEach(c=>c.play());},show(index){controllers.forEach(c=>c.show(index));}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
