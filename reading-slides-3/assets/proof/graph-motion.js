/* The picture is an example. The equation above it records the unrestricted rewrite. */
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function svg(tag, attributes, parent) {
    const element = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    parent.appendChild(element);
    return element;
  }
  const lerp = (a,b,t) => a + (b-a)*t;
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = t => t*t*(3-2*t);
  function timeline(slide, select, draw, duration) {
    let value = select(Number(slide.dataset.scalarBuild || 0));
    let frame = 0;
    draw(value);
    slide.addEventListener('diagram-build', event => {
      cancelAnimationFrame(frame);
      const target = select(event.detail), from = value;
      if (reduced.matches || !slide.classList.contains('present') || Math.abs(target-from)<.001) {
        value=target; draw(value); slide.removeAttribute('data-moving'); return;
      }
      slide.dataset.moving = 'true';
      const start=performance.now();
      function tick(time) {
        const t=clamp((time-start)/duration);
        value=lerp(from,target,smooth(t));
        draw(value);
        if (t<1) frame=requestAnimationFrame(tick);
        else slide.removeAttribute('data-moving');
      }
      frame=requestAnimationFrame(tick);
    });
  }

  const scalar = document.getElementById('scalar-decomposition');
  const picture = scalar.querySelector('.scalar-worked-graph');
  const ordinary = {p:[407,112],m:[738,147],u:[297,46],v:[517,46],a:[193,146],b:[614,147],c:[407,214]};
  const positive = {...ordinary, p:[78,64]};
  const negative = {...positive, m:[78,137]};
  const pivoted = {...negative, u:[222,69],v:[327,69]};
  const phases = {p:'plus',m:'minus',u:'minus',v:'minus',a:'pi',b:'minus',c:'minus'};
  const afterPositive = {...phases, u:'pi',v:'pi',c:'pi'};
  const afterNegative = {...afterPositive,b:'zero'};
  const afterPivot = {...afterNegative,a:'zero',b:'pi',c:'zero'};
  const originalEdges = ['pu','pv','pc','ua','vb','ac','bc','mb'];
  const positiveEdges = ['uv','uc','vc','ua','vb','ac','bc','mb'];
  const negativeEdges = positiveEdges.filter(key=>key!=='mb');
  const pivotEdges = ['uv','ab'];
  // Positions and edge sets are shared between focus builds. Only a rewrite changes them.
  const frames = [
    [ordinary,phases,originalEdges,[],[],0],
    [ordinary,phases,originalEdges,[],[],0],
    [ordinary,phases,originalEdges,['p'],['pu','pv','pc'],0],
    [positive,afterPositive,positiveEdges,[],[],0],
    [positive,afterPositive,positiveEdges,['m'],['mb'],0],
    [negative,afterNegative,negativeEdges,[],[],1],
    [negative,afterNegative,negativeEdges,[],[],1],
    [negative,afterNegative,negativeEdges,['u','v'],['uv'],1],
    [pivoted,afterPivot,pivotEdges,[],[],6]
  ];
  const dims = {zero:[17,17], pi:[38,38], plus:[38,38], minus:[57.8,38]};
  const nodes = new Map(), edges = new Map();
  const vertexLayer=picture.querySelector('.example-vertices');
  for (const id of Object.keys(ordinary)) {
    const group=svg('g',{'data-vertex':id},vertexLayer), variants={};
    for (const [phase,[w,h]] of Object.entries(dims)) {
      const layer=svg('g',{},group);
      const rim=svg('rect',{x:-w/2+1,y:-h/2+1,width:w-2,height:h-2,rx:h/2-1,class:'selected-rim'},layer);
      const href='assets/'+(phase==='zero'?'book/Z-scalar':'scalar-normal-form/'+phase)+'.svg';
      svg('image',{href,x:-w/2,y:-h/2,width:w,height:h},layer);
      variants[phase]={layer,rim};
    }
    nodes.set(id,{group,variants});
  }
  const edgeLayer=picture.querySelector('.example-links');
  const edgeNames=[...new Set(frames.flatMap(f=>f[2]))];
  for (const key of edgeNames) edges.set(key,{
    accent:svg('line',{class:'selected-edge'},edgeLayer),
    line:svg('line',{},edgeLayer)
  });
  const labels = ['a','c','b'].map((id,i)=>{
    const label=svg('text',{x:ordinary[id][0],y:ordinary[id][1]+37,'text-anchor':'middle','font-size':18,'font-family':'inherit','font-style':'italic'},picture);
    label.textContent=['left only','both','right only'][i];
    return label;
  });
  const correction=picture.querySelector('.example-correction');
  const bool=(items,key)=>Number(items.includes(key));
  function drawScalar(time) {
    const i=Math.floor(time), j=Math.min(frames.length-1,i+1), t=time-i;
    const [a,b]=[frames[i],frames[j]], pts={};
    for (const [id,{group,variants}] of nodes) {
      const pos=a[0][id].map((n,k)=>lerp(n,b[0][id][k],t));
      pts[id]=pos;
      group.setAttribute('transform','translate('+pos.join(' ')+')');
      for (const [ph,{layer,rim}] of Object.entries(variants)) {
        const opacity=lerp(Number(a[1][id]===ph),Number(b[1][id]===ph),clamp(t*2));
        layer.setAttribute('opacity',opacity);
        rim.setAttribute('opacity',lerp(bool(a[3],id),bool(b[3],id),t));
      }
    }
    for (const [key,{line,accent}] of edges) {
      for (const el of [line,accent]) for (const [k,v] of ['x1','y1','x2','y2'].entries()) {
        el.setAttribute(v,pts[key[k>>1]][k%2]);
      }
      const start=bool(a[2],key),end=bool(b[2],key);
      line.setAttribute('opacity',lerp(start,end,start>end?clamp(t*3):clamp((t-.10)*1.8)));
      accent.setAttribute('opacity',lerp(bool(a[4],key),bool(b[4],key),t));
    }
    labels.forEach(label=>label.setAttribute('opacity',lerp(Number(i===7),Number(j===7),t)));
    correction.setAttribute('opacity',lerp(Number(a[5]>0),Number(b[5]>0),t));
    correction.querySelector('text').setAttribute('opacity',lerp(Number(a[5]===6),Number(b[5]===6),t));
    picture.dataset.graphStep=String(Math.round(time));
  }
  timeline(scalar,build=>Math.max(1,Math.min(8,build)),drawScalar,700);

  const ap=document.getElementById('ap-triple'), graph=ap.querySelector('.affine-graph');
  const map={k1:[57,141],k2:[224,74],k3:[224,141],k4:[224,208],b1:[138,101],b2:[138,181]};
  const turning={k1:[57,120],k2:[224,80],k3:[224,147],k4:[224,213],b1:[135,98],b2:[135,181]};
  const state={k1:[224,39],k2:[224,106],k3:[224,173],k4:[224,240],b1:[82,91],b2:[82,188]};
  // Control points for the original input. Its free end travels round the top of the graph.
  const curve=[[[37,141],[25,141],[11,141]],[[-11,121],[19,11],[285,12]],[[246,39],[266,39],[291,39]]];
  const apNodes=[...graph.querySelectorAll('[data-ap-node]')];
  const graphEdges=[...graph.querySelectorAll('[data-endpoints]')];
  function drawBend(t) {
    const first=t<.46,ratio=first?t/.46:(t-.46)/.54;
    const a=first?map:turning,b=first?turning:state,k=first?0:1,pts={};
    for(const [id,start] of Object.entries(a)) pts[id]=start.map((x,j)=>lerp(x,b[id][j],ratio));
    for(const node of apNodes) node.setAttribute('transform','translate('+pts[node.dataset.apNode].join(' ')+')');
    for(const edge of graphEdges) {
      const [a,b]=edge.dataset.endpoints.split(' '),coords=[...pts[a],...pts[b]];
      ['x1','y1','x2','y2'].forEach((s,j)=>edge.setAttribute(s,coords[j]));
    }
    const controls=curve[k].map((p,i)=>p.map((x,j)=>lerp(x,curve[k+1][i][j],ratio)).join(' '));
    graph.querySelector('.bend-wire').setAttribute('d','M'+pts.k1.join(' ')+'C'+controls.join(' '));
    for (const line of graph.querySelectorAll('[data-output]')) {
      const [x,y]=pts[line.dataset.output];
      for(const [name,value] of Object.entries({x1:x,y1:y,x2:291,y2:y})) line.setAttribute(name,value);
    }
    for (const label of graph.querySelectorAll('[data-ap-label]')) {
      label.setAttribute('transform','translate(299 '+pts[label.dataset.apLabel][1]+')');
      label.setAttribute('opacity',clamp((t-.82)/.18));
    }
  }
  function selectAP(build) {
    const row = build === 3 ? 'b1' : build === 4 ? 'b2' : null;
    for (const node of apNodes) {
      node.querySelector('.ap-rim').classList.toggle('active', node.dataset.apNode === row);
    }
    for (const edge of graph.querySelectorAll('.ap-edge-glow')) {
      edge.classList.toggle('active', row !== null && edge.dataset.endpoints.split(' ').includes(row));
    }
    return Number(build >= 1);
  }
  timeline(ap,selectAP,drawBend,850);
})();

