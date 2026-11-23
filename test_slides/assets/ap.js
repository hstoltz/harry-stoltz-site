/* Bend the original input wires; the map box and output wires remain anchored. */
(() => {
  const originalA='M300 190 C270 190 240 190 220 190 C200 190 180 190 160 190';
  const originalB='M300 310 C260 310 220 310 200 310 C180 310 160 310 140 310';
  const bentA='M300 190 C225 190 210 140 240 140 C380 140 620 140 785 140';
  const bentB='M300 310 C100 310 100 60 210 60 C380 60 620 60 785 60';
  function update(step,animate) {
    const section=document.getElementById('ap-reachability'); if(!section)return;
    const a=section.querySelector('.ap-bend-a'),b=section.querySelector('.ap-bend-b');
    if(!a||!b)return;
    const bent=step>0;
    a.style.transitionDuration=b.style.transitionDuration=animate?'280ms':'0ms';
    a.style.d=`path('${bent?bentA:originalA}')`;
    b.style.d=`path('${bent?bentB:originalB}')`;
  }
  document.addEventListener('deckstep',e=>{
    if(e.detail.id==='ap-reachability')update(e.detail.step,e.detail.previous!==null && e.detail.step<=1);
  });
})();
