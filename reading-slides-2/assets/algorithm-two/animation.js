/* Algorithm 2: one click runs the complete worked example.
 * seek(stage,t) samples a transition deterministically; frames/semanticFrames
 * expose all endpoints for the independent tensor and diagram checks.
 */
(() => {
  const svg=document.getElementById('algorithm-two-example');
  if(!svg)return;
  const section=svg.closest('section'),NS='http://www.w3.org/2000/svg';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*x*(10-15*x+6*x*x);};
  const point=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const N=(x,y,c,r=6.2)=>({p:[x,y],c,r});
  const E=(...es)=>es.map(e=>e.split('-'));
  const boundary={in1:N(90,55,'boundary',0),in2:N(90,140,'boundary',0),in3:N(90,245,'boundary',0),out1:N(865,45,'boundary',0),out2:N(865,100,'boundary',0),out3:N(865,175,'boundary',0),out4:N(865,255,'boundary',0)};
  const ambient={E:N(460,145,'X'),F:N(565,145,'Z'),I:N(670,45,'X'),H:N(670,175,'X'),J:N(670,255,'X'),K:N(280,245,'Z'),L:N(510,280,'Z')};
  const fixed=E('in3-K','K-I','K-H','K-J','L-I','L-H');
  const tails=[...E('E-F','F-H','F-J','I-out1','I-out2','H-out3','J-out4'),...fixed];
  const initial={nodes:{...boundary,...ambient,B:N(280,95,'X'),D:N(380,95,'Z'),Q:N(42,190,'Z')},edges:[...E('in1-B','in2-B','B-D','D-E','D-I'),...tails],scalar:'1'};
  const clean={nodes:{...boundary,...ambient,B:N(280,95,'X'),D:N(380,95,'Z')},edges:initial.edges,scalar:'2'};
  const firstExpanded={nodes:{...boundary,...ambient,A:N(280,55,'Z'),C:N(280,140,'Z'),XE:N(405,145,'X'),XI:N(600,45,'X')},edges:[...E('in1-A','in2-C','A-XE','A-XI','C-XE','C-XI','XE-E','XI-I'),...tails],scalar:'2√2'};
  const firstFused={nodes:{...boundary,...ambient,A:N(280,55,'Z'),C:N(280,140,'Z')},edges:[...E('in1-A','in2-C','A-E','A-I','C-E','C-I'),...tails],scalar:'2√2'};
  const survivors={...boundary,A:N(280,55,'Z'),C:N(280,140,'Z'),I:ambient.I,H:ambient.H,J:ambient.J,K:ambient.K,L:ambient.L};
  const secondExpanded={nodes:{...survivors,ZA:N(340,100,'Z'),ZC:N(340,195,'Z'),XH:N(600,130,'X'),XJ:N(600,210,'X')},edges:[...E('in1-A','in2-C','A-I','C-I','A-ZA','C-ZC','ZA-XH','ZA-XJ','ZC-XH','ZC-XJ','XH-H','XJ-J','I-out1','I-out2','H-out3','J-out4'),...fixed],scalar:'4'};
  const secondFused={nodes:survivors,edges:[...E('in1-A','in2-C','A-I','C-I','A-H','A-J','C-H','C-J','I-out1','I-out2','H-out3','J-out4'),...fixed],scalar:'4'};
  const final={nodes:{...secondFused.nodes,G:N(590,100,'Z'),R:N(670,100,'X')},edges:[...E('in1-A','in2-C','A-I','C-I','A-H','A-J','C-H','C-J','I-out1','I-G','G-R','R-out2','H-out3','J-out4'),...fixed],scalar:'4'};
  const frames=[initial,clean,clean,firstExpanded,firstFused,firstFused,secondExpanded,secondFused,secondFused,final,final];
  const timing={sourceHold:0,durations:[0,2400,1600,3700,4200,1600,3700,4200,2000,3200,1200]};
  const holds=[0,800,650,900,900,650,900,900,200,900,0];
  let cursor=0;
  const timeline=timing.durations.slice(1).map((duration,i)=>{const stage=i+1,holdBefore=(stage===3||stage===6)?250:stage===9?300:0,holdAfter=holds[stage],entry={stage,start:cursor,holdBefore,duration,holdAfter,end:cursor+holdBefore+duration+holdAfter};cursor=entry.end;return entry;});
  const totalDuration=cursor;
  let stage=0,progress=1,raf=0,motionId=0,sampledFrame=null,running=false,elapsed=0,playbackPhase='idle';
  const wireLayer=svg.querySelector('.algorithm-example-wires'),nodeLayer=svg.querySelector('.algorithm-example-nodes'),scalarLayer=svg.querySelector('.algorithm-example-scalar');
  const wirePool=[],nodePool=[],maskPool=[];
  function element(name,attributes){const el=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attributes||{}))el.setAttribute(k,v);return el;}
  const defs=element('defs');svg.prepend(defs);
  const scalarObject=element('foreignObject',{x:2,y:162,width:80,height:56});
  const scalarValue=document.createElementNS('http://www.w3.org/1999/xhtml','div');
  scalarValue.className='algorithm-example-scalar-value';scalarObject.append(scalarValue);scalarLayer.append(scalarObject);
  let displayedScalar=null;
  function copyFrame(f){return {nodes:Object.fromEntries(Object.entries(f.nodes).map(([k,v])=>[k,{...v,p:[...v.p]}])),edges:f.edges.map(e=>[...e]),scalar:f.scalar};}
  function sameEdge(e,a,b){return e[0]===a&&e[1]===b||e[0]===b&&e[1]===a;}
  const cubic=(p,c1,c2,q)=>`M${p[0]} ${p[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${q[0]} ${q[1]}`;
  const edgeKey=e=>e.join('-');
  const arc=(p,q,bow=0)=>[p,point(p,q,1/3).map((v,i)=>v+(i?4*bow/3:0)),point(p,q,2/3).map((v,i)=>v+(i?4*bow/3:0)),q];
  const blendPath=(a,b,t)=>a.map((p,i)=>point(p,b[i],t));
  const splitPath=(p,t)=>{
    const a=point(p[0],p[1],t),b=point(p[1],p[2],t),c=point(p[2],p[3],t),d=point(a,b,t),e=point(b,c,t),m=point(d,e,t);
    return [[p[0],a,d,m],[m,e,c,p[3]]];
  };
  function wireGeometry(f,e){
    if(f.paths?.[edgeKey(e)])return f.paths[edgeKey(e)];
    const [a,b]=e,p=f.nodes[a].p,q=f.nodes[b].p;
    // Boundary forks are one convex bow: no outward-and-back lobe.
    if(a==='in1'||a==='in2')return [p,[p[0]+55,p[1]],[q[0]-20,p[1]],q];
    if(a==='in3'||b.startsWith('out')&&b!=='out2')return arc(p,q);
    if(a==='I'&&b==='out2')return [p,[p[0]+85,p[1]],[q[0]-40,q[1]],q];
    // Each long leg has its own departure and arrival direction. In particular,
    // the fixed context is never bundled into a shared horizontal tangent.
    const controls={
      'D-I':[[475,55],[570,15]],
      'K-I':[[370,230],[575,160]],
      'K-H':[[410,245],[570,220]],
      'K-J':[[410,255],[610,266]],
      'L-I':[[555,220],[645,120]],
      'L-H':[[610,280],[670,225]],
      'F-H':[[605,145],[645,160]],
      'F-J':[[600,185],[625,245]],
      'I-G':[[670,90],[625,100]]
    }[edgeKey(e)];
    if(controls)return [p,...controls,q];
    const aliases={XI:'I',XE:'E',ZA:'A',ZC:'C',XH:'H',XJ:'J'};
    const key=`${aliases[a]||a}-${aliases[b]||b}`;
    const bows={'A-I':-30,'C-I':8,'A-H':0,'C-H':10,'A-J':15,'C-J':15,'A-E':-5,'C-E':8};
    const path=arc(p,q,bows[key]||0);
    if(key==='A-J')path[2]=[q[0]-60,q[1]-35];
    if(key==='C-J')path[2]=[q[0]-60,q[1]-11];
    return path;
  }
  function wirePath(f,e){return cubic(...wireGeometry(f,e));}
  function movedPath(path,p,q){
    const dp=[p[0]-path[0][0],p[1]-path[0][1]],dq=[q[0]-path[3][0],q[1]-path[3][1]];
    return path.map((v,i)=>[v[0]+dp[0]*(1-i/3)+dq[0]*i/3,v[1]+dp[1]*(1-i/3)+dq[1]*i/3]);
  }
  function draw(f,focusNodes=[],focusEdges=[]){
    sampledFrame=copyFrame(f);
    for(let k=0;k<f.edges.length;k++){
      const e=f.edges[k];let path=wirePool[k];if(!path){path=element('path');wireLayer.append(path);wirePool[k]=path;}
      path.style.display='';path.setAttribute('d',wirePath(f,e));path.dataset.from=e[0];path.dataset.to=e[1];
      // As in the connectivity animation, a moving wire passes behind an
      // unrelated spider with visible clearance rather than appearing joined.
      if(progress>0&&progress<1&&[3,4,6,7,9].includes(stage)){
        let entry=maskPool[k];
        if(!entry){
          const mask=element('mask',{id:`algorithm-wire-clearance-${k}`,maskUnits:'userSpaceOnUse',x:-100,y:-100,width:1112,height:500});
          mask.append(element('rect',{x:-100,y:-100,width:1112,height:500,fill:'white'}));
          defs.append(mask);entry=maskPool[k]={mask,circles:[]};
        }
        const a=f.nodes[e[0]],b=f.nodes[e[1]],gap=3.5*smooth(18*Math.min(progress,1-progress));
        let count=0;
        for(const [id,n]of Object.entries(f.nodes)){
          if(n.c==='boundary'||e.includes(id)||n.r<=0)continue;
          // Spiders coalescing in the rewrite keep their incident wires intact.
          if(Math.hypot(n.p[0]-a.p[0],n.p[1]-a.p[1])<n.r+a.r+3||Math.hypot(n.p[0]-b.p[0],n.p[1]-b.p[1])<n.r+b.r+3)continue;
          let hole=entry.circles[count];if(!hole){hole=element('circle',{fill:'black'});entry.mask.append(hole);entry.circles[count]=hole;}
          hole.style.display='';hole.setAttribute('cx',n.p[0]);hole.setAttribute('cy',n.p[1]);hole.setAttribute('r',n.r+gap);count++;
        }
        entry.circles.slice(count).forEach(hole=>hole.style.display='none');
        path.setAttribute('mask',`url(#algorithm-wire-clearance-${k})`);
      }else path.removeAttribute('mask');
      path.classList.toggle('is-active',focusEdges.some(z=>sameEdge(e,z[0],z[1])));
    }
    wirePool.slice(f.edges.length).forEach(p=>p.style.display='none');
    const entries=Object.entries(f.nodes).filter(([,n])=>n.c!=='boundary');
    entries.forEach(([id,n],k)=>{let circle=nodePool[k];if(!circle){circle=element('circle');nodeLayer.append(circle);nodePool[k]=circle;}circle.style.display='';circle.setAttribute('cx',n.p[0]);circle.setAttribute('cy',n.p[1]);circle.setAttribute('r',Math.max(0,n.r));circle.setAttribute('fill',n.c==='Z'?'#d8f8d8':'#e8a5a5');circle.dataset.node=id;circle.classList.toggle('is-active',focusNodes.includes(id));});
    nodePool.slice(entries.length).forEach(n=>n.style.display='none');
    if(displayedScalar!==f.scalar){displayedScalar=f.scalar;if(f.scalar==='1')scalarValue.replaceChildren();else katex.render(f.scalar==='2√2'?'2\\sqrt{2}':f.scalar,scalarValue,{throwOnError:false,output:'html'});}
    svg.dataset.stage=String(stage);svg.dataset.progress=String(progress);
  }
  function fuse(source,target,pairs,t){
    if(t>=1)return copyFrame(target);
    const f=copyFrame(source),u=smooth(t),rename=Object.fromEntries(pairs);f.paths={};
    for(const [from,to]of pairs)f.nodes[from].p=point(source.nodes[from].p,target.nodes[to].p,u);
    for(const e of source.edges){
      const mapped=e.map(id=>rename[id]||id);
      const end=mapped[0]===mapped[1]?Array.from({length:4},()=>target.nodes[mapped[0]].p):wireGeometry(target,mapped);
      f.paths[edgeKey(e)]=blendPath(wireGeometry(source,e),end,u);
    }
    return f;
  }
  function complementarity(source,target,red,green,newGreens,newReds,contact,t){
    const split=.42,removed=new Set([red,green]),created=new Set([...newGreens,...newReds]);
    const collapsed=e=>{
      const [a,b]=e;
      if(removed.has(a)&&removed.has(b))return Array.from({length:4},()=>contact);
      return movedPath(wireGeometry(source,e),removed.has(a)?contact:source.nodes[a].p,removed.has(b)?contact:source.nodes[b].p);
    };
    if(t<split){
      const f=copyFrame(source),u=smooth(t/split);f.paths={};
      f.nodes[red].p=point(source.nodes[red].p,contact,u);f.nodes[green].p=point(source.nodes[green].p,contact,u);
      for(const e of source.edges)f.paths[edgeKey(e)]=blendPath(wireGeometry(source,e),collapsed(e),u);
      return f;
    }
    const f=copyFrame(target),u=smooth((t-split)/(1-split));f.paths={};
    for(const id of created)f.nodes[id].p=point(contact,target.nodes[id].p,u);
    for(const e of target.edges){
      let start;
      if(created.has(e[0])&&created.has(e[1]))start=Array.from({length:4},()=>contact);
      else if(created.has(e[0])||created.has(e[1])){
        const outside=created.has(e[0])?e[1]:e[0];
        const old=source.edges.find(x=>x.includes(outside)&&x.some(id=>removed.has(id)));
        start=collapsed(old);if(old[0]===outside&&e[1]===outside||old[1]===outside&&e[0]===outside)start=start.slice().reverse();
      } else start=wireGeometry(source,e);
      f.paths[edgeKey(e)]=blendPath(start,wireGeometry(target,e),u);
    }
    return f;
  }
  function repairBoundary(t){
    const u=smooth(t),f=copyFrame(final);f.paths={};
    // Insert both identities on the existing curve, then gently arrange the
    // new green spider to the left of its two red neighbours.
    const old=wireGeometry(secondFused,['I','out2']);
    const [first,remainder]=splitPath(old,.36),[middle,last]=splitPath(remainder,.61);
    const starts={'I-G':first,'G-R':middle,'R-out2':last};
    f.nodes.G.p=point(first[3],final.nodes.G.p,u);f.nodes.R.p=point(middle[3],final.nodes.R.p,u);
    f.nodes.G.r=f.nodes.R.r=6.2*smooth(clamp(t/.18));
    for(const e of final.edges)if(starts[edgeKey(e)])f.paths[edgeKey(e)]=blendPath(starts[edgeKey(e)],wireGeometry(final,e),u);
    return f;
  }
  function chart(step='',edge=''){
    // Only one algorithm item is active: a box while working, an arrow while moving.
    section.querySelectorAll('[data-algorithm-step]').forEach(e=>e.classList.toggle('is-active',!!step&&e.dataset.algorithmStep===step));
    section.querySelectorAll('[data-algorithm-edge]').forEach(e=>e.classList.toggle('is-active',!step&&!!edge&&e.dataset.algorithmEdge===edge));
    section.querySelectorAll('[data-algorithm-traveller]').forEach(e=>e.remove());
  }
  function seek(s,t=1){
    stage=Math.min(10,Math.max(0,Math.round(Number(s)||0)));progress=clamp(Number(t));
    let f=copyFrame(frames[stage]),nodes=[],edges=[];
    if(stage===0)chart();
    if(stage===1){
      const q=clamp((progress-.25)/.75);chart(progress<.25?'':'cleanup',progress<.25?'input':'');
      if(q<1){f=copyFrame(initial);f.nodes.Q.r=6.2*(1-smooth(q));if(progress>=.25)nodes=['Q'];}else f=copyFrame(clean);
    }
    if(stage===2){chart(progress<.5?'':'sc',progress<.5?'next':'');if(progress>=.5){nodes=['B','D'];edges=E('B-D');}}
    if(stage===3){chart('sc');f=complementarity(clean,firstExpanded,'B','D',['A','C'],['XE','XI'],[325,95],progress);nodes=progress<.42?['B','D']:['A','C','XE','XI'];edges=progress<.42?E('B-D'):E('A-XE','A-XI','C-XE','C-XI');}
    if(stage===4){chart(progress<.24?'':'cleanup',progress<.24?'loop':'');f=fuse(firstExpanded,firstFused,[['XE','E'],['XI','I']],clamp((progress-.24)/.76));if(progress>=.24&&progress<1){nodes=['XE','E','XI','I'];edges=E('XE-E','XI-I');}}
    if(stage===5){chart(progress<.5?'':'sc',progress<.5?'next':'');if(progress>=.5){nodes=['E','F'];edges=E('E-F');}}
    if(stage===6){chart('sc');f=complementarity(firstFused,secondExpanded,'E','F',['ZA','ZC'],['XH','XJ'],[515,145],progress);nodes=progress<.42?['E','F']:['ZA','ZC','XH','XJ'];edges=progress<.42?E('E-F'):E('ZA-XH','ZA-XJ','ZC-XH','ZC-XJ');}
    if(stage===7){chart(progress<.24?'':'cleanup',progress<.24?'loop':'');f=fuse(secondExpanded,secondFused,[['ZA','A'],['ZC','C'],['XH','H'],['XJ','J']],clamp((progress-.24)/.76));if(progress>=.24&&progress<1){nodes=['ZA','A','ZC','C','XH','H','XJ','J'];edges=E('ZA-A','ZC-C','XH-H','XJ-J');}}
    if(stage===8){chart(progress>=.35&&progress<.6?'sc':'',progress<.35?'next':progress>=.6?'else':'');}
    if(stage===9){chart('boundary');f=repairBoundary(progress);if(progress<1){nodes=['G','R'];edges=E('I-G','G-R','R-out2');}}
    if(stage===10)chart('',progress<1?'output':'');
    draw(f,nodes,edges);
  }
  function pause(){if(raf)cancelAnimationFrame(raf);raf=0;motionId++;running=false;if(playbackPhase!=='finished')playbackPhase='paused';}
  function finish(){pause();elapsed=totalDuration;playbackPhase='finished';seek(10,1);}
  function reset(){pause();elapsed=0;playbackPhase='idle';seek(0,1);}
  function sampleTimeline(ms){
    elapsed=Math.max(0,Math.min(totalDuration,ms));
    const entry=timeline.find(e=>elapsed<e.end)||timeline[timeline.length-1];
    const relative=elapsed-entry.start;
    playbackPhase=relative<entry.holdBefore?'before':relative<entry.holdBefore+entry.duration?'motion':'after';
    seek(entry.stage,clamp((relative-entry.holdBefore)/entry.duration));
    if(elapsed>=totalDuration){playbackPhase='finished';seek(10,1);}
  }
  function play(){
    reset();if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    running=true;const token=motionId,start=performance.now();
    const tick=now=>{if(token!==motionId)return;sampleTimeline(now-start);if(elapsed<totalDuration)raf=requestAnimationFrame(tick);else {raf=0;running=false;}};
    sampleTimeline(0);raf=requestAnimationFrame(tick);
  }
  function boot(){
    if(!window.Reveal?.isReady()){setTimeout(boot,20);return;}
    Reveal.on('fragmentshown',e=>{if(e.fragment.matches('.algorithm-trigger')&&e.fragment.closest('section')===section)play();});
    Reveal.on('fragmenthidden',e=>{if(e.fragment.matches('.algorithm-trigger')&&e.fragment.closest('section')===section)reset();});
    Reveal.on('slidechanged',e=>{pause();if(e.currentSlide===section&&!section.querySelector('.algorithm-trigger.visible'))reset();});
    if(section.querySelector('.algorithm-trigger.visible'))finish();else reset();
  }
  function semanticGraph(f){
    const colors={},ports={},edges=[];
    for(const[id,n]of Object.entries(f.nodes))if(n.c!=='boundary')colors[id]=n.c;
    for(const[a,b]of f.edges){if(f.nodes[a].c==='boundary')ports[a]=b;else if(f.nodes[b].c==='boundary')ports[b]=a;else edges.push([a,b]);}
    return {colors,ports,edges,scalar_sqrt2_exponent:{'1':0,'2':2,'2√2':3,'4':4}[f.scalar]};
  }
  window.algorithmTwo={
    seek:(s,t=1)=>{pause();seek(s,t);},seekTime:ms=>{pause();sampleTimeline(ms);},play,finish,pause,reset,timing,
    timeline:timeline.map(e=>({...e})),duration:totalDuration,frames:frames.map(copyFrame),semanticFrames:frames.map(semanticGraph),
    get sampledGraph(){return sampledFrame&&semanticGraph(sampledFrame);},get stage(){return stage;},get progress(){return progress;},
    get playback(){return {running,elapsed,duration:totalDuration,phase:playbackPhase,stage,progress};},
    get state(){return {stage,progress,frame:copyFrame(frames[stage]),activeBox:section.querySelector('[data-algorithm-step].is-active')?.dataset.algorithmStep||'',activeEdge:section.querySelector('[data-algorithm-edge].is-active')?.dataset.algorithmEdge||'',playback:{running,elapsed,duration:totalDuration,phase:playbackPhase}};}
  };
  seek(0,1);boot();
})();
