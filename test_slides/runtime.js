/* Presenter-controlled builds. No click, tap or swipe advances the deck. */
(() => {
  'use strict';
  const mathOptions = {
    delimiters: [{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],
    macros:{'\\ket':'\\lvert#1\\rangle','\\bra':'\\langle#1\\rvert'},
    throwOnError:true, strict:'ignore',
  };
  const renderMath = node => renderMathInElement(node,mathOptions);
  const slides = [...document.querySelectorAll('.slides > section')];
  for(const section of slides) {
    const count = Number(section.dataset.steps || 0);
    const ticks=document.createElement('div');
    ticks.className='build-ticks'; ticks.setAttribute('aria-hidden','true');
    for(let i=0;i<count;i++) {
      const tick=document.createElement('span');
      tick.className='fragment'; tick.dataset.fragmentIndex=i;
      ticks.appendChild(tick);
    }
    section.appendChild(ticks);
  }
  document.querySelectorAll('[data-on]').forEach(el=>el.classList.add('build'));
  renderMath(document.querySelector('.reveal'));
  let last={id:null,step:0};
  function allowed(spec,step) {
    return spec.split(/[ ,]+/).some(s=> {
      if(s.endsWith('+'))return step>=Number(s.slice(0,-1));
      if(s.includes('-')){const [a,b]=s.split('-').map(Number);return step>=a&&step<=b;}
      return step===Number(s);
    });
  }
  function update() {
    const section=Reveal.getCurrentSlide();
    if(!section)return;
    const step=section.querySelectorAll('.build-ticks > .visible').length;
    section.querySelectorAll('[data-on]').forEach(el=> {
      const on=allowed(el.dataset.on,step);
      el.classList.toggle('is-on',on);
      el.setAttribute('aria-hidden',String(!on));
      if('inert' in el)el.inert=!on;
    });
    section.dataset.step=step;
    document.body.dataset.slide=section.id;
    document.body.dataset.step=step;
    const previous=last.id===section.id?last.step:null;
    document.dispatchEvent(new CustomEvent('deckstep',{detail:{id:section.id,step,previous}}));
    last={id:section.id,step};
  }
  const dialog=document.getElementById('reference-dialog');
  const referenceBody=document.getElementById('reference-body');
  const backButton=document.getElementById('reference-back');
  let referenceStack=[],returnFocus=null;
  function showContent(content,append=true) {
    if(!dialog.open){returnFocus=document.activeElement;dialog.showModal();}
    if(append)referenceStack.push(content);
    referenceBody.replaceChildren(content.cloneNode(true));
    renderMath(referenceBody);
    referenceBody.scrollTop=0;
    backButton.hidden=referenceStack.length<2;
    document.getElementById('reference-close').focus({preventScroll:true});
  }
  function showRef(id) {
    const template=document.getElementById(id);
    if(!template)return;
    showContent(template.content);
  }
  function closeReference() {
    referenceStack=[];
    dialog.close();
    if(returnFocus && returnFocus.isConnected)returnFocus.focus({preventScroll:true});
  }
  document.addEventListener('click',e=> {
    const ref=e.target.closest('[data-ref]');
    if(!ref)return;
    e.preventDefault(); e.stopPropagation(); showRef(ref.dataset.ref);
  });
  document.getElementById('reference-close').addEventListener('click',closeReference);
  backButton.addEventListener('click',()=>{
    referenceStack.pop();showContent(referenceStack[referenceStack.length-1],false);
  });
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeReference();});
  dialog.addEventListener('click',e=>{
    if(e.target===dialog){
      const r=dialog.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeReference();
    }
  });
  function notes() {
    const current=Reveal.getCurrentSlide();
    const f=document.createDocumentFragment();
    const heading=document.createElement('h3');heading.textContent=current.querySelector('h1,h2').textContent;
    f.appendChild(heading);
    const note=current.querySelector('aside.notes');
    const div=document.createElement('div');div.innerHTML=note?note.innerHTML:'No additional notes.';
    f.appendChild(div);showContent(f);
  }
  document.addEventListener('keydown',e=>{
    if(dialog.open){
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeReference();}
      else if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','PageDown','PageUp',' ','Home','End','s','S'].includes(e.key)){
        e.stopImmediatePropagation();
      }
      return;
    }
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='s'||e.key==='S'){e.preventDefault();e.stopImmediatePropagation();notes();}
    if(e.key==='c'||e.key==='C'){e.preventDefault();e.stopImmediatePropagation();showRef('ref-credits');}
    if(e.key==='?'||e.key==='h'||e.key==='H'){e.preventDefault();e.stopImmediatePropagation();showRef('ref-help');}
    if(e.key==='r'||e.key==='R'){e.preventDefault();e.stopImmediatePropagation();showRef('ref-rules');}
  },true);
  Reveal.initialize({width:960,height:700,margin:.08,center:false,controls:false,touch:false,
    progress:true,slideNumber:'c/t',hash:true,fragmentInURL:true,transition:'none',
    navigationMode:'linear',scrollActivationWidth:null,mouseWheel:false,overview:false,
    keyboard:{38:'prev',40:'next',33:'prev',34:'next',13:'next',8:'prev',83:null,67:null,72:null,82:null},
    autoAnimate:false,plugins:[]}).then(()=>{
      update();document.body.dataset.ready='true';
    });
  Reveal.on('slidechanged',update);
  Reveal.on('fragmentshown',update);
  Reveal.on('fragmenthidden',update);
})();
