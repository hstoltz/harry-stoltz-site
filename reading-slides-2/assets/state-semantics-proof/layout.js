/* Align semantic diagrams and separately typeset algebra by the TeX math axis.
   Summation limits belong below the axis; they must not push the equality down. */
(() => {
  function align(){
    const slide=window.Reveal?.getCurrentSlide();
    if(!slide?.classList.contains('semantic-chain-slide'))return;
    const terms=[...slide.querySelectorAll('.sproof-rhs>.math,.spider-tensor>.math,.sproof-relation>.math,.semantic-chain-expansion-slide .sproof-lhs>.math,.semantic-chain-count-slide .sproof-lhs>.math,.basis-action-input>.math,.basis-action-implication>.math')];
    for(const term of terms)term.style.transform='none';
    const offsets=terms.map(term=>{
      const base=term.querySelector('.katex-html>.katex-base,.katex-html>.base');
      const strut=base?.querySelector(':scope>.katex-strut,:scope>.strut');
      if(!strut)return 0;
      const style=getComputedStyle(strut),rect=strut.getBoundingClientRect();
      const scale=rect.height/parseFloat(style.height);
      if(!Number.isFinite(scale)||scale===0)return 0;
      const depth=parseFloat(style.verticalAlign)||0;
      const axis=rect.bottom+scale*(depth-parseFloat(getComputedStyle(base).fontSize)*.25);
      const box=term.getBoundingClientRect();
      return ((box.top+box.bottom)/2-axis)/scale;
    });
    for(let i=0;i<terms.length;i++)terms[i].style.transform=`translateY(${offsets[i]}px)`;
  }
  function boot(){
    if(!window.Reveal?.isReady()){setTimeout(boot,20);return;}
    Reveal.on('slidechanged',()=>requestAnimationFrame(align));
    Reveal.on('resize',()=>requestAnimationFrame(align));
    document.fonts.ready.then(()=>requestAnimationFrame(align));
  }
  boot();
})();
