/* Exact BPW scalar-Hopf endpoint paths; literal wire/node rewrite motion. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const controllers = new Map();
  const timing=[{hold:180,move:1800},{hold:220,move:2600},{hold:140,move:1400},
    {hold:220,move:2800},{hold:180,move:2200}];
  const duration=timing.reduce((sum,s)=>sum+s.hold+s.move,0);
  const phaseAt=elapsed=>{
    let offset=0;
    for(let i=0;i<timing.length;i++){
      const s=timing[i];
      if(elapsed<offset+s.hold+s.move)return {index:i,t:Math.max(0,(elapsed-offset-s.hold)/s.move)};
      offset+=s.hold+s.move;
    }
    return {index:timing.length,t:1};
  };
  const clamp = t => Math.max(0, Math.min(1,t));
  const ease = t => { t=clamp(t); return t*t*t*(t*(t*6-15)+10); };
  const point = (a,b,t) => ({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  const attrs = (el,a) => {for(const [k,v] of Object.entries(a))el.setAttribute(k,String(v));};
  function controller(box) {
    if(controllers.has(box))return controllers.get(box);
    const states=JSON.parse(box.querySelector('script[data-hopf-states]').textContent);
    const svg=box.querySelector('svg'), drawing=svg.querySelector('[data-hopf-drawing]'), rhs=svg.querySelector('[data-hopf-rhs]');
    let raf=0, generation=0, lastBuild=null;
    const sample = item => {
      if(item.points)return item.points;
      const p=document.createElementNS(NS,'path');attrs(p,item.attrs);svg.appendChild(p);
      const len=p.getTotalLength(), count=item.kind?48:40;
      const points=Array.from({length:count+1},(_,i)=>{const q=p.getPointAtLength(len*i/count);return {x:q.x,y:q.y};});
      // Reveal hides inactive slides with display:none, which makes getBBox()
      // return a zero box. Path-length sampling remains valid while hidden, so
      // derive the local centre from the same points used by the morph instead.
      // All spider paths are circles, sampled at 48 evenly spaced arc positions.
      const xs=points.map(q=>q.x), ys=points.map(q=>q.y);
      item.center={x:(Math.min(...xs)+Math.max(...xs))/2,
        y:(Math.min(...ys)+Math.max(...ys))/2};
      item.points=points;p.remove();return points;
    };
    states.forEach(s=>[...s.edges,...s.nodes].forEach(sample));
    function path(item, parent=drawing){const p=document.createElementNS(NS,'path');attrs(p,item.attrs);p.dataset.hopfKey=item.key;parent.appendChild(p);return p;}
    function stop(){generation++;cancelAnimationFrame(raf);raf=0;box.dataset.hopfRunning='false';}
    function show(index){drawing.replaceChildren();for(const item of [...states[index].edges,...states[index].nodes])path(item);box.dataset.hopfStage=index;}
    function poly(points,closed){return 'M'+points.map(p=>p.x.toFixed(5)+' '+p.y.toFixed(5)).join('L')+(closed?'Z':'');}
    function prepare(index) {
      const from = states[index], to = states[index + 1];
      const oldNodes = new Map(from.nodes.map(n => [n.key, n]));
      const newNodes = new Map(to.nodes.map(n => [n.key, n]));
      const oldEdges = new Map(from.edges.map(e => [e.key, e]));
      const newEdges = new Map(to.edges.map(e => [e.key, e]));
      const pairs = [];
      drawing.replaceChildren();
    
      const xy = p => ({x:p.x, y:p.y});
      const midpoint = (a,b) => point(a,b,.5);
      const local = key => xy(oldNodes.get(key).center);
      const scaleShape = (item, c, radius = 1) => item.points.map(p => ({
        x:c.x + radius * (p.x - item.center.x),
        y:c.y + radius * (p.y - item.center.y)
      }));
      const put = (el, points, node = false) => {
        el.style.display = '';
        el.setAttribute('d', poly(points, node));
      };
      const hide = el => { el.style.display = 'none'; };
      // Translate each end separately, retaining the source curvature between them.
      const attached = (points, a, b) => points.map((p,i) => {
        const u = i / (points.length - 1);
        return {
          x:p.x + (a.x-points[0].x)*(1-u) + (b.x-points.at(-1).x)*u,
          y:p.y + (a.y-points[0].y)*(1-u) + (b.y-points.at(-1).y)*u
        };
      });
      const resample = (points, count = 40) => {
        const lengths = [0];
        for(let i=1;i<points.length;i++) lengths.push(lengths.at(-1) +
          Math.hypot(points[i].x-points[i-1].x, points[i].y-points[i-1].y));
        const total = lengths.at(-1);
        if(total < 1e-8) return Array.from({length:count+1}, () => xy(points[0]));
        let j=1;
        return Array.from({length:count+1}, (_,i) => {
          const distance = total*i/count;
          while(j<lengths.length-1 && lengths[j]<distance) j++;
          const length = lengths[j]-lengths[j-1];
          return point(points[j-1], points[j], length ? (distance-lengths[j-1])/length : 0);
        });
      };
      const interpolate = (a,b,t) => a.map((p,i) => point(p,b[i],t));
    
      // Make independently addressable endpoint paths, with every wire behind every
      // spider. Intermediate scenes reuse them; exact endpoints retain native d's.
      function endpointScene() {
        const old = new Map(), next = new Map();
        for(const item of from.edges) old.set(item.key,{item,el:path(item)});
        for(const item of to.edges) next.set(item.key,{item,el:path(item)});
        for(const item of from.nodes) old.set(item.key,{item,el:path(item)});
        for(const item of to.nodes) next.set(item.key,{item,el:path(item)});
        const clear = () => {for(const q of [...old.values(),...next.values()])hide(q.el);};
        const exact = atEnd => {
          clear();
          for(const q of (atEnd?next:old).values()) {attrs(q.el,q.item.attrs);q.el.style.display='';}
        };
        clear();
        return {old,next,clear,exact};
      }
    
      // Insert two identity expansions on the *existing* right-hand wire. It is
      // partitioned into three consecutive pieces, never removed and rebuilt.
      if(index === 0) {
        const scene=endpointScene();
        const loop=oldEdges.get('green--red#1');
        const continuous=loop.points;
        const at = u => {
          const x=u*(continuous.length-1), i=Math.min(continuous.length-2,Math.floor(x));
          return point(continuous[i],continuous[i+1],x-i);
        };
        const section = (a,b) => Array.from({length:41},(_,i)=>at(a+(b-a)*i/40));
        const insertGreen=at(1/3), insertRed=at(2/3);
        const insertion={
          'green-extra':insertGreen,'green-unit':insertGreen,
          'scalar-red':insertRed,'red-unit':insertRed
        };
        const pieces=[
          {points:section(0,1/3),key:'green-extra--red#0'},
          {points:section(1/3,2/3),key:'green-extra--scalar-red#0'},
          {points:section(2/3,1),key:'green--scalar-red#0'}
        ];
        return raw => {
          const t=clamp(raw);
          if(t===0||t===1) {scene.exact(t===1);return;}
          scene.clear();
          const u=ease(t), growth=ease(clamp(t/.38));
          const poses=new Map();
          for(const [key,n] of newNodes) {
            const a=oldNodes.get(key);
            poses.set(key,{center:point(a?a.center:insertion[key],n.center,u),radius:a?1:growth});
          }
          const attach = (points,ends) => attached(points,
            poses.get(ends[0])?.center || points[0],
            poses.get(ends[1])?.center || points.at(-1));
          // The left loop, external input/output wires, and isolated scalar retain
          // their identities; only the connected green spider changes position.
          for(const key of ['green--red#0','bottom--red#0','green--top#0']) {
            const a=oldEdges.get(key), b=newEdges.get(key);
            const bp=a.ends[0]===b.ends[0]?b.points:[...b.points].reverse();
            put(scene.old.get(key).el,attach(interpolate(a.points,bp,u),a.ends));
          }
          // A single wire becomes three sections with inserted spiders at the two
          // join points. Each join stays connected while its spider grows.
          for(const piece of pieces) {
            const b=newEdges.get(piece.key);
            put(scene.next.get(piece.key).el,attach(interpolate(piece.points,b.points,u),b.ends));
          }
          // The one-legged units grow out of their own newly inserted spiders.
          for(const key of ['green-extra--green-unit#0','red-unit--scalar-red#0']) {
            const b=newEdges.get(key), origin=insertion[b.ends[0]];
            const pts=b.points.map(p=>point(origin,p,u));
            put(scene.next.get(key).el,attach(pts,b.ends));
          }
          for(const [key,p] of poses) {
            const q=oldNodes.has(key)?scene.old.get(key):scene.next.get(key);
            put(q.el,scaleShape(q.item,p.center,p.radius),true);
          }
        };
      }
    
      // Let the two colours pass through one another. Both halves share a
      // nonzero tangent at contact; easing is applied once to the whole move.
      // The normalization scalar stays in its own component on the left.
      if(index === 1) {
        const scene=endpointScene();
        const event={x:61.03237,y:38.63867};
        const outer=[
          ['green--top#0','red--top#0',true],
          ['bottom--red#0','bottom--green#0',false],
          ['green-extra--green-unit#0','green-unit--red#0',false],
          ['red-unit--scalar-red#0','green--red-unit#0',false]
        ];
        const internalOld=['green--red#0','green-extra--scalar-red#0',
          'green-extra--red#0','green--scalar-red#0'];
        const hermite=(a,b,ma,mb,t)=>{
          const t2=t*t,t3=t2*t;
          return {x:(2*t3-3*t2+1)*a.x+(t3-2*t2+t)*ma.x+(-2*t3+3*t2)*b.x+(t3-t2)*mb.x,
            y:(2*t3-3*t2+1)*a.y+(t3-2*t2+t)*ma.y+(-2*t3+3*t2)*b.y+(t3-t2)*mb.y};
        };
        const crossing=(a,b,u)=>{
          const tangent={x:0,y:(b.y-event.y)*1.7};
          if(u<.5)return hermite(a,event,{x:event.x-a.x,y:event.y-a.y},
            {x:tangent.x/2,y:tangent.y/2},u*2);
          return hermite(event,b,{x:tangent.x/2,y:tangent.y/2},
            {x:b.x-event.x,y:b.y-event.y},u*2-1);
        };
        // New scalar red starts behind its green partner, then slides out.
        drawing.insertBefore(scene.next.get('scalar-red').el,scene.old.get('scalar-green').el);
        return raw => {
          const t=clamp(raw);
          if(t===0||t===1){scene.exact(t===1);return;}
          scene.clear();
          const u=ease(t), before=u<.5, after=clamp(2*u-1);
          const poses=new Map();
          for(const key of ['green-unit','red-unit','scalar-green'])
            poses.set(key,point(oldNodes.get(key).center,newNodes.get(key).center,u));
          for(const key of ['green','green-extra','red','scalar-red']) {
            const colour=key.startsWith('green')?'green':'red';
            poses.set(key,crossing(oldNodes.get(key).center,newNodes.get(colour).center,u));
          }
          for(const [aKey,bKey,reverse] of outer) {
            const a=oldEdges.get(aKey),b=newEdges.get(bKey);
            const bp=reverse?[...b.points].reverse():b.points;
            const bEnds=reverse?[...b.ends].reverse():b.ends;
            const pts=interpolate(a.points,bp,u);
            const tips=[0,1].map(i=>poses.get((before?a.ends:bEnds)[i])||pts[i?pts.length-1:0]);
            put(scene.old.get(aKey).el,attached(pts,tips[0],tips[1]));
          }
          if(before) {
            for(const key of internalOld) {
              const a=oldEdges.get(key);
              const pts=a.points.map(p=>point(p,event,2*u));
              put(scene.old.get(key).el,attached(pts,poses.get(a.ends[0]),poses.get(a.ends[1])));
            }
          } else {
            const b=newEdges.get('green--red#0');
            put(scene.next.get(b.key).el,attached(b.points,poses.get(b.ends[0]),poses.get(b.ends[1])));
            const sg=poses.get('scalar-green');
            const sr=point(sg,newNodes.get('scalar-red').center,after);
            const scalar=newEdges.get('scalar-green--scalar-red#0');
            put(scene.next.get(scalar.key).el,attached(scalar.points,sr,sg));
            put(scene.next.get('scalar-red').el,scaleShape(newNodes.get('scalar-red'),sr),true);
          }
          for(const key of ['green-unit','red-unit','scalar-green','green','red',
              ...(before?['green-extra','scalar-red']:[])])
            put(scene.old.get(key).el,scaleShape(oldNodes.get(key),poses.get(key)),true);
        };
      }

      // Copy by transporting a full-size red state along the incident wire.
      // At contact the two copies coincide; they then travel along the two
      // outgoing wires. No red spider shrinks away or reappears at a new site.
      if(index === 3) {
        const scene=endpointScene();
        const whole=e=>attached(e.points,
          oldNodes.get(e.ends[0])?.center||e.points[0],
          oldNodes.get(e.ends[1])?.center||e.points.at(-1));
        const nextWhole=e=>attached(e.points,
          newNodes.get(e.ends[0])?.center||e.points[0],
          newNodes.get(e.ends[1])?.center||e.points.at(-1));
        const incoming=resample([...whole(oldEdges.get('green--red-unit#0'))].reverse());
        const upper=resample([...whole(oldEdges.get('green--red#0'))].reverse());
        const lower=resample([...whole(oldEdges.get('green--green-split#0')),
          ...whole(oldEdges.get('bottom--green-split#0')).slice(1)]);
        // Once the green identity disappears, gently round its former join.
        // Endpoints stay fixed, so rounding never detaches a wire from a spider.
        let roundedLower=lower.map(xy);
        for(let pass=0;pass<8;pass++)roundedLower=roundedLower.map((p,i,a)=>
          i===0||i===a.length-1?p:{x:(a[i-1].x+2*p.x+a[i+1].x)/4,
            y:(a[i-1].y+2*p.y+a[i+1].y)/4});
        const upperEnd=resample(nextWhole(newEdges.get('red--red-copy#0')));
        const lowerEnd=resample([...nextWhole(newEdges.get('bend--red-unit#0')),
          ...nextWhole(newEdges.get('bend--bottom#0')).slice(1)]);
        const at=(points,u)=>{
          const f=clamp(u)*(points.length-1),i=Math.min(points.length-2,Math.floor(f));
          return point(points[i],points[i+1],f-i);
        };
        const tail=(points,u)=>Array.from({length:41},(_,i)=>at(points,u+(1-u)*i/40));
        // Keep the incoming red in front as it passes over the green copy site.
        drawing.appendChild(scene.old.get('red-unit').el);
        const contact=.43;
        return raw => {
          const t=clamp(raw);
          if(t===0||t===1){scene.exact(t===1);return;}
          scene.clear();
          const u=ease(t);
          if(u<contact) {
            for(const q of scene.old.values()){attrs(q.el,q.item.attrs);q.el.style.display='';}
            const travel=u/contact, remaining=tail(incoming,travel);
            put(scene.old.get('green--red-unit#0').el,remaining);
            put(scene.old.get('red-unit').el,scaleShape(oldNodes.get('red-unit'),remaining[0]),true);
            return;
          }
          const v=(u-contact)/(1-contact), relax=ease(clamp((v-.18)/.82));
          const up=interpolate(tail(upper,.5*v),upperEnd,relax);
          const lowerCurve=interpolate(lower,roundedLower,ease(clamp(v/.2)));
          const down=interpolate(tail(lowerCurve,.5*v),lowerEnd,relax);
          put(scene.next.get('red--red-copy#0').el,up);
          // One unbroken curved tail passes through the former identity site.
          put(scene.next.get('bend--red-unit#0').el,down);
          for(const key of ['green-unit--red#0','red--top#0']) {
            const a=oldEdges.get(key),b=newEdges.get(key);
            put(scene.old.get(key).el,interpolate(a.points,b.points,relax));
          }
          for(const key of ['red','green-unit'])
            put(scene.old.get(key).el,scaleShape(oldNodes.get(key),
              point(oldNodes.get(key).center,newNodes.get(key).center,relax)),true);
          put(scene.next.get('red-copy').el,scaleShape(newNodes.get('red-copy'),up[0]),true);
          put(scene.old.get('red-unit').el,scaleShape(oldNodes.get('red-unit'),down[0]),true);
          // Remove the two-legged green identity locally, before its wire bends.
          const identityRadius=1-ease(clamp(v/.18));
          if(identityRadius>0)put(scene.old.get('green-split').el,
            scaleShape(oldNodes.get('green-split'),oldNodes.get('green-split').center,identityRadius),true);
          // B1 consumes the separate normalization scalar at this same rewrite.
          // Contract only that component, never its wires across the main graph.
          const shrink=1-ease(clamp(v/.62));
          if(shrink>0){
            const g=oldNodes.get('scalar-green'),r=oldNodes.get('scalar-red');
            const c=midpoint(g.center,r.center),gc=point(c,g.center,shrink),rc=point(c,r.center,shrink);
            put(scene.old.get('scalar-green--scalar-red#0').el,
              attached(oldEdges.get('scalar-green--scalar-red#0').points,rc,gc));
            put(scene.old.get('scalar-green').el,scaleShape(g,gc,shrink),true);
            put(scene.old.get('scalar-red').el,scaleShape(r,rc,shrink),true);
          }
        };
      }

      // This branch has two independent connected components. In particular, the
      // upper red spiders must never be identified with the separate lower red unit.
      if(index === 4) {
        const red = oldNodes.get('red'), copy = oldNodes.get('red-copy');
        const green = oldNodes.get('green-unit'), unit = oldNodes.get('red-unit');
        const gNext = newNodes.get('green-unit'), uNext = newNodes.get('red-unit');
        const rg = oldEdges.get('green-unit--red#0'); // green -> upper red
        const rt = oldEdges.get('red--top#0');        // upper red -> top
        const cr = oldEdges.get('red--red-copy#0');   // red copy -> upper red
        const ub = oldEdges.get('bend--red-unit#0');  // lower red -> bend
        const bb = oldEdges.get('bend--bottom#0');    // bend -> bottom
        const gt = newEdges.get('green-unit--top#0'); // top -> green
        const ut = newEdges.get('bottom--red-unit#0');// lower red -> bottom
        const old = [...from.edges, ...from.nodes].map(item => ({item, el:path(item)}));
        const elements = new Map(old.map(q => [q.item.key, q.el]));
        const topWire = path(gt), bottomWire = path(ut);
        hide(topWire); hide(bottomWire);
        // New wires stay behind their surviving spider fills.
        drawing.insertBefore(topWire, drawing.firstChild);
        drawing.insertBefore(bottomWire, drawing.firstChild);
        const joinedTop = resample([
          ...[...rt.points].reverse(), xy(red.center), ...[...rg.points].reverse()
        ]);
        const joinedBottom = resample([...ub.points, ...bb.points.slice(1)]);
        const exactFinal = () => {
          for(const q of old) hide(q.el);
          for(const [el,item] of [[topWire,gt],[bottomWire,ut],
              [elements.get('green-unit'),gNext],[elements.get('red-unit'),uNext]]) {
            attrs(el,item.attrs); el.style.display='';
          }
        };
        return raw => {
          const t=clamp(raw);
          if(t===0) {
            for(const q of old) { attrs(q.el,q.item.attrs); q.el.style.display=''; }
            hide(topWire); hide(bottomWire); return;
          }
          if(t===1) { exactFinal(); return; }
          // 0-.32: fuse the one-legged red copy into its adjacent red spider.
          // The external upper wires and both other spiders remain fixed.
          if(t<.32) {
            for(const q of old) { attrs(q.el,q.item.attrs); q.el.style.display=''; }
            hide(topWire); hide(bottomWire);
            const u=ease(t/.32), c=point(copy.center,red.center,u);
            const radius=1-ease(clamp((u-.72)/.28));
            put(elements.get('red-copy'),scaleShape(copy,c,radius),true);
            const tip0={
              x:c.x+radius*(cr.points[0].x-copy.center.x),
              y:c.y+radius*(cr.points[0].y-copy.center.y)
            };
            const tip1=point(cr.points.at(-1),red.center,u);
            put(elements.get(cr.key),attached(cr.points,tip0,tip1));
            return;
          }
          // .32-.58: remove the resulting two-legged red identity locally. Its
          // two incident wire tips extend to the shrinking circle's centre.
          if(t<.58) {
            for(const q of old) { attrs(q.el,q.item.attrs); q.el.style.display=''; }
            hide(topWire); hide(bottomWire);
            hide(elements.get('red-copy')); hide(elements.get(cr.key));
            const u=ease((t-.32)/.26), radius=1-u;
            put(elements.get('red'),scaleShape(red,red.center,radius),true);
            put(elements.get(rg.key),attached(rg.points,rg.points[0],point(rg.points.at(-1),red.center,u)));
            put(elements.get(rt.key),attached(rt.points,point(rt.points[0],red.center,u),rt.points.at(-1)));
            return;
          }
          // .58-1: the top is now one continuous green-ended wire. Straighten
          // both connected components into the exact final source diagram.
          for(const q of old) hide(q.el);
          const u=ease((t-.58)/.42);
          put(topWire,interpolate(joinedTop,gt.points,u));
          put(bottomWire,interpolate(joinedBottom,ut.points,u));
          put(elements.get('green-unit'),scaleShape(green,point(green.center,gNext.center,u)),true);
          put(elements.get('red-unit'),scaleShape(unit,point(unit.center,uNext.center,u)),true);
        };
      }
    
      // The remaining move is the backwards green-spider fusion: split one
      // green spider along its existing output, retaining every other component.
      const rewriteCenter=midpoint(local('red'),local('green'));
      const anchor=key=>key==='green-split'?local('green'):xy(rewriteCenter);
      function pose(key,t) {
        const a=oldNodes.get(key),b=newNodes.get(key);
        if(a&&b)return {center:point(a.center,b.center,ease(t)),radius:1};
        if(a){const u=ease(clamp(2*t));return {center:point(a.center,anchor(key),u),radius:1-u};}
        if(b){const u=ease(clamp(2*t-1));return {center:point(anchor(key),b.center,u),radius:u};}
        return null;
      }
      const edgeAliases={'bottom--green#0':'bottom--green-split#0'};
      const endpointAliases={'green':'green-split'};
      const used=new Set();
      function addPair(a,b,family) {
        let bPoints=b?.points, bEnds=b?.ends;
        if(a&&b&&family==='edges') {
          // Preserve the direction of common external endpoints. The copying
          // rewrite changes the green node into two red units, so this is not a
          // nearest-colour correspondence.
          const same=(x,y) => x===y || endpointAliases[x]===y;
          const straight=Number(same(a.ends[0],b.ends[0]))+Number(same(a.ends[1],b.ends[1]));
          const reverse=Number(same(a.ends[0],b.ends[1]))+Number(same(a.ends[1],b.ends[0]));
          if(reverse>straight) { bPoints=[...b.points].reverse(); bEnds=[...b.ends].reverse(); }
        }
        const item=a||b;
        pairs.push({a,b,ap:a?.points,bp:bPoints,bEnds,el:path(item),node:family==='nodes'});
      }
      // Draw all edges before spiders.
      for(const a of from.edges) {
        const key=edgeAliases[a.key]||a.key, b=newEdges.get(key);
        if(b) used.add(key);
        addPair(a,b,'edges');
      }
      for(const b of to.edges) if(!used.has(b.key)) addPair(null,b,'edges');
      for(const key of new Set([...oldNodes.keys(),...newNodes.keys()]))
        addPair(oldNodes.get(key),newNodes.get(key),'nodes');
    
      function attachedTip(item, points, ends, end, t) {
        if(!item) return null;
        const node=(oldNodes.get(ends[end]) || newNodes.get(ends[end]));
        // Offsets belong to the endpoint state, not whichever map contains a key.
        const stateNodes=item===oldEdges.get(item.key) ? oldNodes : newNodes;
        const endpointNode=stateNodes.get(ends[end]);
        if(!node||!endpointNode) return null;
        const p=points[end ? points.length-1 : 0], q=pose(ends[end],t);
        return {x:q.center.x+(p.x-endpointNode.center.x)*q.radius,
          y:q.center.y+(p.y-endpointNode.center.y)*q.radius};
      }
      return raw => {
        const t=clamp(raw);
        for(const q of pairs) {
          if(t===0 || t===1) {
            const item=t===0?q.a:q.b;
            if(item) {attrs(q.el,item.attrs);q.el.style.display='';} else hide(q.el);
            continue;
          }
          if(q.node) {
            const item=q.a||q.b, p=pose(item.key,t);
            if((!q.b&&t>=.5)||(!q.a&&t<=.5)) {hide(q.el);continue;}
            put(q.el,scaleShape(item,p.center,p.radius),true);continue;
          }
          let points;
          if(q.a&&q.b) points=interpolate(q.ap,q.bp,ease(t));
          else if(q.a) {
            if(t>=.5) {hide(q.el);continue;}
            points=q.ap.map(p=>point(p,rewriteCenter,ease(2*t)));
          } else {
            if(t<=.5) {hide(q.el);continue;}
            points=q.bp.map(p=>point(rewriteCenter,p,ease(2*t-1)));
          }
          const tips=[0,1].map(end => {
            const a=q.a&&attachedTip(q.a,q.ap,q.a.ends,end,t);
            const b=q.b&&attachedTip(q.b,q.bp,q.bEnds,end,t);
            if(a&&b) {
              if(q.a.ends[end]===q.bEnds[end]) return point(a,b,ease(t));
              return t<=.5?a:b;
            }
            return a||b||points[end?points.length-1:0];
          });
          put(q.el,attached(points,tips[0],tips[1]));
        }
      };
    }
    function setRhs(visible){rhs.style.opacity=visible?'1':'0';rhs.setAttribute('aria-hidden',String(!visible));}
    function finish(){stop();setRhs(false);show(states.length-1);}
    function reset(){stop();setRhs(true);show(0);}
    function play(){
      stop();setRhs(false);show(0);
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
      box.dataset.hopfRunning='true';const token=generation,start=performance.now();let previous=-1,tween=null;
      function tick(now){
        if(token!==generation)return;
        const elapsed=now-start;
        if(elapsed>=duration){show(5);box.dataset.hopfRunning='false';raf=0;return;}
        const {index,t}=phaseAt(elapsed);
        if(index!==previous){show(index);tween=null;previous=index;box.dataset.hopfStage=index;}
        if(t>0){if(!tween)tween=prepare(index);tween(t);}
        raf=requestAnimationFrame(tick);
      }
      raf=requestAnimationFrame(tick);
    }
    function sync(build,active=true){
      if(!active){lastBuild=null;reset();return;}
      if(build===lastBuild)return;
      lastBuild=build;
      if(build<2)reset();else if(build===2)play();else finish();
    }
    // Deterministic timeline inspection uses the identical rewrite functions.
    function seek(elapsed){
      stop();setRhs(false);
      if(elapsed>=duration){show(states.length-1);return;}
      const {index,t}=phaseAt(Math.max(0,elapsed));
      show(index);if(t>0)prepare(index)(t);
    }
    const result={box,play,reset,finish,sync,seek,duration,timing,show:index=>{stop();setRhs(false);show(index);},get stage(){return Number(box.dataset.hopfStage)}};
    controllers.set(box,result);return result;
  }
  function init(){
    document.querySelectorAll('[data-hopf-animation]').forEach(box=>{
      const ctl=controller(box),section=box.closest('section');
      if(!section)return;
      const update=()=>ctl.sync(Number(section.dataset.build||0),!window.Reveal||!Reveal.isReady()||Reveal.getCurrentSlide()===section);
      new MutationObserver(update).observe(section,{attributes:true,attributeFilter:['data-build','class']});update();
    });
  }
  window.HopfAnimation={init,sync(section,build){init();section?.querySelectorAll('[data-hopf-animation]').forEach(box=>controller(box).sync(build,true));},finish(){controllers.forEach(c=>c.finish());},reset(){controllers.forEach(c=>c.reset());},play(){controllers.forEach(c=>c.play());},show(index){controllers.forEach(c=>c.show(index));},controllers};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
