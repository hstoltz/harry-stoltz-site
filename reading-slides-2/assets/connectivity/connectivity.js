(() => {
  'use strict';
  const root = document.getElementById('completeness-connectivity-dance');
  const svg = root.querySelector('.zx-stage');
  const data = JSON.parse(document.getElementById('completeness-connectivity-geometry').textContent);
  const ns = 'http://www.w3.org/2000/svg';
  const wireLayer=root.querySelector('.zx-wires'), nodeLayer=root.querySelector('.zx-spiders');
  const defs=document.createElementNS(ns,'defs');svg.prepend(defs);
  const clearance=[];
  const edges=data.poses[0].edges.map((e,i)=>{
    const path=document.createElementNS(ns,'path');
    path.dataset.edge=String(i); path.dataset.from=e.from; path.dataset.to=e.to;
    const mask=document.createElementNS(ns,'mask');
    mask.id='completeness-wire-clearance-'+i;mask.setAttribute('maskUnits','userSpaceOnUse');
    mask.setAttribute('x','-100');mask.setAttribute('y','-100');mask.setAttribute('width','300');mask.setAttribute('height','300');
    const paper=document.createElementNS(ns,'rect');
    for(const [key,val] of Object.entries({x:-100,y:-100,width:300,height:300,fill:'white'}))paper.setAttribute(key,val);
    mask.append(paper);
    clearance[i]=data.nodes.filter(n=>n.id!==e.from&&n.id!==e.to).map(n=>{
      const ellipse=document.createElementNS(ns,'ellipse');ellipse.setAttribute('fill','black');mask.append(ellipse);
      return {node:n,ellipse};
    });
    defs.append(mask);
    wireLayer.append(path); return path;
  });
  const nodes=data.nodes.map(n=>{
    const g=document.createElementNS(ns,'g');
    g.dataset.node=n.id; g.setAttribute('aria-label',n.label);
    g.innerHTML=n.markup; nodeLayer.append(g); return g;
  });
  const tau=Math.PI*2, segment=5, duration=segment*3;
  const arcs=[{"zp":[0,-6.2],"x0":[5.45,2.32],"z0":[-2.73,-1.82],"xh":[16.18,7.9],"zq":[2.61,11.31],"xp":[-0.91,-7.27]},{"zp":[0.32,-17.93],"x0":[-2.73,2.73],"z0":[0.68,2.32],"xh":[-10,3.64],"zq":[18.18,-1.82],"xp":[9.15,4.69]},{"zp":[-8.18,-8.18],"x0":[0.67,-0.33],"z0":[-3.87,-3.2],"xh":[22.07,13.3],"zq":[22.25,12.64],"xp":[-13.27,-7.31]}];
  const delay={zp:0,x0:.025,z0:.045,xh:.09,zq:.12,xp:.065};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
  const mix=(a,b,t)=>a+(b-a)*t;
  const xy=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
  // A tiny crouch, a fast elastic release, then a damped landing.
  function spring(u) {
    u=clamp(u);
    if(u<.13)return -.028*Math.sin(Math.PI*u/.13)**2;
    const v=(u-.13)/.87, s=smooth(v);
    const back=1+2.35*(s-1)**3+1.35*(s-1)**2;
    return back+.018*Math.sin(5*tau*v)*Math.sin(Math.PI*v)**2*smooth((v-.45)*3);
  }
  function getState(time) {
    const t=((time%duration)+duration)%duration;
    const k=Math.floor(t/segment), local=t-k*segment;
    const a=data.poses[k],b=data.poses[(k+1)%3];
    const u=clamp((local-1.05)/3.55), p=spring(u);
    const pos={},shape={};
    for(const [id,start] of Object.entries(a.nodes)) {
      if(!arcs[k][id]) {pos[id]=xy(start,b.nodes[id],smooth(u));continue;}
      const v=clamp((u-delay[id])/(1-delay[id])), e=spring(v), travel=smooth(v);
      const bow=Math.sin(Math.PI*travel)**2, arc=arcs[k][id];
      const ring=Math.sin(7*tau*v+delay[id]*8)*Math.sin(Math.PI*v)**2*smooth((v-.58)*4);
      const end=b.nodes[id];
      pos[id]=[mix(start[0],end[0],e)+arc[0]*bow+ring*.65,
               mix(start[1],end[1],e)+arc[1]*bow+ring*.9];
      const squash=.065*Math.sin(4*Math.PI*v)*Math.sin(Math.PI*v)**2;
      shape[id]={angle:7*Math.sin(3*Math.PI*v)*Math.sin(Math.PI*v)**2, sx:1+squash, sy:1/(1+squash)};
    }
    const paths=a.edges.map((edge,i)=>{
      const other=b.edges[i], v=clamp((u-.025*(i%3))/.95), e=spring(v);
      const fromIdeal=xy(a.nodes[edge.from],b.nodes[edge.from],e);
      const toIdeal=xy(a.nodes[edge.to],b.nodes[edge.to],e);
      const df=[pos[edge.from][0]-fromIdeal[0],pos[edge.from][1]-fromIdeal[1]];
      const dt=[pos[edge.to][0]-toIdeal[0],pos[edge.to][1]-toIdeal[1]];
      const wiggle=1.8*Math.sin(tau*2.3*v+i*.67)*Math.sin(Math.PI*v)**2;
      const points=edge.points.map((point,j)=>{
        const f=j/6, q=xy(point,other.points[j],e), envelope=Math.sin(Math.PI*f);
        return [q[0]+mix(df[0],dt[0],f)+wiggle*envelope*Math.sin(i*.9),
                q[1]+mix(df[1],dt[1],f)+wiggle*envelope*Math.cos(i*.9)];
      });
      // Phase-free dots are smaller than the source's phase-labelled spiders.
      // Extend each attached end under its opaque dot so no old label-radius gap
      // is visible. The boundary endpoints and all interior controls are retained.
      for(const [index,id] of [[0,edge.from],[6,edge.to]]) {
        if(shape[id]) points[index]=pos[id].slice();
      }
      return points;
    });
    return {k,u,pos,shape,paths,time:t};
  }
  function draw(time) {
    const state=getState(time);
    state.paths.forEach((pts,i)=>{
      const q=pts.map(p=>p.map(x=>x.toFixed(5)).join(' '));
      edges[i].setAttribute('d',`M${q[0]} C${q.slice(1,4).join(' ')} C${q.slice(4).join(' ')}`);
      // Keep a travelling wire visibly separate from unrelated spiders.
      if(state.u===0||state.u===1)edges[i].removeAttribute('mask');
      else {
        edges[i].setAttribute('mask',`url(#completeness-wire-clearance-${i})`);
        const gap=1.35*smooth(18*Math.min(state.u,1-state.u));
        for(const {node:n,ellipse} of clearance[i]){
          const [x,y]=state.pos[n.id],s=state.shape[n.id];
          ellipse.setAttribute('rx',n.r+gap);ellipse.setAttribute('ry',n.r+gap);
          ellipse.setAttribute('transform',`translate(${x} ${y}) rotate(${s.angle}) scale(${s.sx} ${s.sy})`);
        }
      }
    });
    data.nodes.forEach((n,i)=>{
      const [x,y]=state.pos[n.id],s=state.shape[n.id];
      nodes[i].setAttribute('transform',`translate(${x} ${y}) rotate(${s.angle}) scale(${s.sx} ${s.sy})`);
    });
    root.dataset.arrangement=String(state.k+1);
    return state;
  }
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const printView=document.documentElement.classList.contains('print-pdf');
  let paused=reduced.matches||printView, clock=0, previous=null;
  const button=root.querySelector('[data-pause]');
  function syncButton() {
    if(!button)return;
    button.textContent=paused?'Play':'Pause';
    button.setAttribute('aria-label',paused?'Play animation':'Pause animation');
  }
  function pause() {paused=true;previous=null;syncButton();return draw(clock);}
  function play() {paused=false;previous=null;syncButton();}
  if(button)button.addEventListener('click',()=>paused?play():pause());
  function tick(now) {
    const active = !window.Reveal || root.closest('section')?.classList.contains('present');
    if(previous!==null&&!paused&&active)clock=(clock+Math.min(.1,(now-previous)/1000))%duration;
    previous=now; if(active)draw(clock); requestAnimationFrame(tick);
  }
  // Deterministic export and verification; no network or runtime dependencies.
  window.completenessConnectivity={
    duration,data,getState,draw,
    seek:t=>{paused=true;previous=null;clock=((Number(t)%duration)+duration)%duration;syncButton();return draw(clock);},
    play,pause,
    get time(){return clock;},
    get paused(){return paused;},
    get state(){return getState(clock);}
  };
  draw(0);syncButton();
  if(!printView)requestAnimationFrame(tick);
})();
