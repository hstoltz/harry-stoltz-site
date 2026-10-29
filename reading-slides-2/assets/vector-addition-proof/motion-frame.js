/* Continuous geometry for the book's row-op1.svg and row-op2.svg.
 * Coordinates are original SVG units, translated so the red output column is x=0.
 * Exact native SVG endpoints/text remain the renderer's responsibility.
 */
(() => {
  'use strict';
  const G='#d8f8d8',X='#e8a5a5',BLACK='#000',BLUE='#00f';
  const R=2.83465,thin=.3985,blueEdge=1.59404,blueNode=1.19553;
  const ys=[-37.92576,-23.74996,-9.57813,4.59766,18.76954,32.94144];
  const clamp=t=>Math.max(0,Math.min(1,Number(t)));
  const ease=t=>t*t*t*(10+t*(-15+6*t));
  const xy=(x,y)=>({x,y});
  const lerp=(a,b,t)=>xy(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
  const crossing=(a,c,b,t)=>{
    const f=(s,k,e)=>{const q=2*(e+s-2*k);return s+(e-s-q)*t+q*t*t;};
    return xy(f(a.x,c.x,b.x),f(a.y,c.y,b.y));
  };
  function base(outLength=10.6328){
    const f={nodes:[],edges:[],unions:[]};
    ys.forEach((y,i)=>{
      f.nodes.push({id:'r'+i,x:0,y,r:R,fill:X,stroke:BLACK,width:thin,kind:'spider'});
      f.nodes.push({id:'out'+i,x:outLength,y,r:0,fill:'none',stroke:'none',width:0,kind:'boundary'});
      f.edges.push({id:'lead'+i,a:'r'+i,b:'out'+i,stroke:BLACK,width:thin});
    });
    return f;
  }
  function node(f,id,x,y,fill=G,blue=false){
    f.nodes.push({id,x,y,r:R,fill,stroke:blue?BLUE:BLACK,width:blue?blueNode:thin,kind:'spider'});
  }
  function edge(f,a,b,blue=false,id=a+'-'+b){f.edges.push({id,a,b,stroke:blue?BLUE:BLACK,width:blue?blueEdge:thin});}
  const link=(f,a,ids,blue=false)=>ids.forEach(b=>edge(f,a,b,blue));
  function stage(key){
    let f;
    if(key==='A'){
      f=base(10.6328);
      node(f,'v',61.574-100.5508,-13.12106);node(f,'w',61.574-100.5508,8.14064);
      link(f,'v',['r0','r1','r2','r3']);link(f,'w',['r2','r3','r4','r5']);
    }else if(key==='B'){
      f=base(10.6328);
      node(f,'v',144.8438-183.8203,-13.12106);node(f,'w',144.8438-183.8203,8.14064);
      node(f,'g1',155.4727-183.8203,-9.57813,G,true);node(f,'g2',155.4727-183.8203,4.59766,G,true);
      node(f,'h1',173.19141-183.8203,-9.57813,X,true);node(f,'h2',173.19141-183.8203,4.59766,X,true);
      link(f,'v',['r0','r1']);link(f,'w',['r4','r5']);
      edge(f,'v','g1',true);edge(f,'w','g2',true);
      link(f,'g1',['h1','h2'],true);link(f,'g2',['h1','h2'],true);
      edge(f,'h1','r2',true);edge(f,'h2','r3',true);
    }else if(key==='C1'||key==='C2'){
      const second=key==='C2',anchor=second?42.406:279.492;
      f=base(second?53.035-anchor:290.121-anchor);
      const vx=(second?3.43:240.5156)-anchor;
      node(f,'v',vx,-13.12106,G,second);node(f,'w',vx,8.14064);
      node(f,'h',(second?14.059:251.1445)-anchor,-2.492188,X,true);
      node(f,'q',(second?24.688:261.7734)-anchor,-2.492188,G,!second);
      link(f,'v',['r0','r1'],second);link(f,'w',['r4','r5']);
      edge(f,'v','h',true);edge(f,'w','h',true);edge(f,'h','q',true);
      link(f,'q',['r2','r3'],!second);
    }else if(key==='D'){
      f=base(145.1641-134.5352);
      node(f,'w',95.555-134.5352,8.14064);node(f,'q',116.8164-134.5352,-2.492188);
      node(f,'gw',95.555-134.5352,-2.492188,G,true);node(f,'gq',116.8164-134.5352,-13.12106,G,true);
      node(f,'a0',106.188-134.5352,-30.83596,X,true);node(f,'a1',120.3594-134.5352,-23.74996,X,true);
      link(f,'w',['r4','r5']);link(f,'q',['r2','r3']);
      edge(f,'w','gw',true);edge(f,'q','gq',true);
      link(f,'gw',['a0','a1'],true);link(f,'gq',['a0','a1'],true);
      edge(f,'a0','r0',true);edge(f,'a1','r1',true);
    }else if(key==='E'||key==='F'){
      const final=key==='F',anchor=final?332.961:226.6602;
      f=base((final?343.59:237.2891)-anchor);
      node(f,'w',(final?293.9844:187.6836)-anchor,8.14064);
      node(f,'q',(final?293.9844:208.94531)-anchor,final?-13.12106:-2.492188);
      link(f,'w',['r0','r1','r4','r5']);link(f,'q',['r0','r1','r2','r3']);
    }else throw new Error('Unknown vector-addition panel: '+key);
    f.panel=key;return f;
  }
  const get=(f,id)=>f.nodes.find(n=>n.id===id);
  function put(f,id,p){const n=get(f,id);if(n){n.x=p.x;n.y=p.y;}}
  function followContext(f,from,to,u,ids){
    for(const id of ids)put(f,id,lerp(get(from,id),get(to,id),u));
  }
  function attach(f){
    const map=Object.fromEntries(f.nodes.map(n=>[n.id,n]));
    f.edges=f.edges.map(e=>({...e,points:[xy(map[e.a].x,map[e.a].y),xy(map[e.b].x,map[e.b].y)]}));
    return f;
  }
  const routes={
    '1:1':['A','B'],'1:2':['B','C1'],
    '2:1':['C2','D'],'2:2':['D','E'],'2:3':['E','F']
  };
  function frame(row,transition,raw=1){
    row=+row;transition=+transition;
    const route=routes[row+':'+transition];
    if(!route)throw new Error('Unknown vector-addition transition '+row+':'+transition);
    const t=clamp(raw),u=ease(t),a=stage(route[0]),b=stage(route[1]);
    if(t===0||t===1)return {...attach(t===0?a:b),row:+row,transition:+transition,t,u,phase:t===0?'exact-source':'exact-target'};
    let f,contactPoint;
    if(row===1&&transition===1){
      f=stage('B');f.phase='spider-unfusion';
      followContext(f,a,b,u,['v','w']);
      for(const [id,origin] of [['g1','v'],['g2','w'],['h1','r2'],['h2','r3']]){
        put(f,id,lerp(get(a,origin),get(b,id),u));f.unions.push({a:origin,b:id});
      }
    }else if(row===1&&transition===2){
      // One global clock passes through the rewrite contact, without stopping.
      const gStart=xy(get(a,'g1').x,(ys[2]+ys[3])/2),hStart=xy(get(a,'h1').x,(ys[2]+ys[3])/2);
      const center=xy((gStart.x+hStart.x)/2,-2.492188);
      const g=crossing(gStart,center,get(b,'q'),u),h=crossing(hStart,center,get(b,'h'),u);
      contactPoint=center;
      if(u<.5){
        f=stage('B');f.phase='inverse-sc-approach';
        const spread=(1-2*u)**2;
        for(const id of ['g1','g2'])put(f,id,xy(g.x,g.y+(get(a,id).y-gStart.y)*spread));
        for(const id of ['h1','h2'])put(f,id,xy(h.x,h.y+(get(a,id).y-hStart.y)*spread));
        f.unions=[{a:'g1',b:'g2'},{a:'h1',b:'h2'}];
      }else{
        f=stage('C1');f.phase='inverse-sc-pass-through';put(f,'q',g);put(f,'h',h);
      }
      followContext(f,a,b,u,['v','w']);
    }else if(row===2&&transition===1){
      const gEnd=lerp(get(b,'gw'),get(b,'gq'),.5),hEnd=lerp(get(b,'a0'),get(b,'a1'),.5);
      const center=xy(get(a,'h').x,get(a,'v').y);
      const g=crossing(get(a,'v'),center,gEnd,u),h=crossing(get(a,'h'),center,hEnd,u);
      contactPoint=center;
      if(u<.5){
        f=stage('C2');f.phase='forward-sc-approach';put(f,'v',g);put(f,'h',h);
      }else{
        f=stage('D');f.phase='forward-sc-pass-through';
        const spread=(2*u-1)**2;
        for(const id of ['gw','gq']){const n=get(b,id);put(f,id,xy(g.x+(n.x-gEnd.x)*spread,g.y+(n.y-gEnd.y)*spread));}
        for(const id of ['a0','a1']){const n=get(b,id);put(f,id,xy(h.x+(n.x-hEnd.x)*spread,h.y+(n.y-hEnd.y)*spread));}
        f.unions=[{a:'gw',b:'gq'},{a:'a0',b:'a1'}];
      }
      followContext(f,a,b,u,['w','q']);
    }else if(row===2&&transition===2){
      f=stage('D');f.phase='spider-fusion';
      followContext(f,a,b,u,['w','q']);
      for(const [id,destination] of [['gw','w'],['gq','q'],['a0','r0'],['a1','r1']]){
        put(f,id,lerp(get(a,id),get(b,destination),u));f.unions.push({a:destination,b:id});
      }
    }else{
      f=stage('F');f.phase='connectivity';followContext(f,a,b,u,['w','q']);
    }
    // Native coordinate rounding changes lead length by at most .004 units.
    // Keep every boundary fixed to the destination panel during the motion.
    for(let i=0;i<6;i++)put(f,'out'+i,get(b,'out'+i));
    // Green is drawn after red during opposite-colour contact, consistently.
    f.nodes.sort((n,m)=>(n.fill===G)-(m.fill===G));
    return {...attach(f),row:+row,transition:+transition,t,u,contactPoint,phase:f.phase};
  }
  const api={frame,stage:key=>attach(stage(key)),radius:R,ys:[...ys],
    anchors:{1:[100.5508,183.8203,279.492],2:[42.406,134.5352,226.6602,332.961]},
    durations:{'1:1':3000,'1:2':4000,'2:1':4000,'2:2':3000,'2:3':3000},sourceHold:180,
    rules:{'1:1':'sp','1:2':'sc','2:1':'sc','2:2':'sp','2:3':'connectivity'}};
  globalThis.vectorAdditionMotion=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
