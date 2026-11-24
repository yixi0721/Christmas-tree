// ── 平安夜灯火：松枝、玻璃球和依次通电的灯串 ──────────────
function makeBauble(light, middle, shadow) {
  const tile = document.createElement("canvas");
  tile.width = 96; tile.height = 114;
  const c = tile.getContext("2d");
  c.strokeStyle = "#c6a669"; c.lineWidth = 2.4;
  c.beginPath(); c.ellipse(48, 17, 5.7, 8, 0, 0, TAU); c.stroke();
  const glass = c.createRadialGradient(35, 47, 1, 49, 68, 39);
  glass.addColorStop(0, light); glass.addColorStop(.28, middle); glass.addColorStop(.72, shadow);
  glass.addColorStop(.89, shadow); glass.addColorStop(1, middle);
  c.fillStyle = glass;
  c.beginPath(); c.arc(48, 67, 34, 0, TAU); c.fill();
  const cap = c.createLinearGradient(38, 0, 58, 0);
  cap.addColorStop(0, "#694d2d"); cap.addColorStop(.28, "#e9c782");
  cap.addColorStop(.56, "#8a6536"); cap.addColorStop(.81, "#f5dba1"); cap.addColorStop(1, "#8c7049");
  c.fillStyle = cap; c.fillRect(38, 25, 20, 11);
  c.fillStyle = "rgba(255,245,220,.92)";
  c.beginPath(); c.ellipse(35, 48, 6.3, 3.4, -.71, 0, TAU); c.fill();
  c.fillStyle = "rgba(255,245,220,.55)";
  c.beginPath(); c.arc(42, 44, 1.8, 0, TAU); c.fill();
  c.strokeStyle = "rgba(255,220,170,.44)"; c.lineWidth = 1.65;
  c.beginPath(); c.arc(48, 67, 30.1, .23, 1.28); c.stroke();
  return tile;
}
function createScene(accent, count) {
  const seed = 251202, rand = randomFrom(seed);
  const honey = rgb(accent), cream = rgb(blend(accent, ivory, .79));
  const inks = [[78,119,95], [124,158,121], [162,183,141], accent, blend(accent, ivory, .71)].map(color => rgb(color));
  const needleColor = ["#244839", "#2b5946", "#3b7159", "#608c70", "#87a37d", "#a9b489"];
  const boughColor = ["#122b24", "#143329", "#173a2e", "#1a3d31"];
  const branches = [];
  const levels = 11;
  function branchPoint(b, s, side = 0) {
    const a = b.angle + b.curl * Math.sin(s * Math.PI);
    const r = b.length * (.10 + .90 * s);
    const lateral = side * b.length;
    return {
      x: Math.cos(a) * r - Math.sin(a) * lateral,
      z: Math.sin(a) * r + Math.cos(a) * lateral,
      y: b.y + b.lift * ((1 - s) ** 2 - .35 * Math.sin(s * Math.PI)) + s * s * b.tip
    };
  }
  for (let level = 0; level < levels; level++) {
    const u = level / levels;
    const perTier = Math.round(18 - 9 * u);
    for (let j = 0; j < perTier; j++) {
      const b = { angle: j / perTier * TAU + level * 1.83 + rand() * .105,
        length: (1 - u) ** .84 * (.91 + rand() * .15),
        y: .043 + u * .952 + (rand() - .5) * .034 * (1 - .45 * u),
        lift: .093 - .040 * u, tip: .015 + rand() * .034, curl: (rand() - .5) * .37,
        tone: Math.floor(rand() * 4) };
      b.middle = branchPoint(b, .7);
      b.edge = [];
      for (const side of [-1, 1]) {
        for (let k = 0; k <= 14; k++) {
          const s = side < 0 ? k / 14 : 1 - k / 14;
          const width = Math.sin(s * Math.PI) ** .73 * (k % 2 ? .158 : .094);
          const p = branchPoint(b, s, side * width);
          p.y -= width * .113;
          b.edge.push(p);
        }
      }
      branches.push(b);
    }
  }
  const groups = needleColor.map(() => []);
  const needles = [];
  for (let i = 0; i < count; i++) {
    const p = makeSpeck(rand);
    const b = branches[Math.floor(rand() * branches.length)];
    const s = .09 + rand() * .90, side = rand() < .5 ? -1 : 1;
    const wing = side * Math.sin(s * Math.PI) * rand() * .162;
    const from = branchPoint(b, s, wing);
    const span = (.026 + rand() * .072) * (.62 + .38 * b.length);
    const angle = b.angle + side * (.21 + rand() * .94);
    p.x = from.x + Math.cos(angle) * span;
    p.z = from.z + Math.sin(angle) * span;
    p.y = from.y + (.001 + rand() * .026) * (.48 + b.length * .5);
    p.from = from;
    p.sprig = [];
    if (i % 3 !== 1) {
      for (let j = 0; j < 3; j++) {
        const weight = .12 + j * .26;
        const start = { x: mix(from.x,p.x,weight), y: mix(from.y,p.y,weight), z: mix(from.z,p.z,weight) };
        const reach = (.65 - j * .145) * span;
        const spread = .52 + rand() * .34;
        for (const direction of [-1, 1]) {
          const a = angle + direction * spread;
          p.sprig.push([start,{ x: start.x + Math.cos(a)*reach, y: start.y + reach*.165,
            z: start.z + Math.sin(a)*reach }]);
        }
      }
    }
    const group = Math.min(5, Math.floor(rand() ** 1.4 * 5.1 + s * .79));
    groups[group].push(p);
    if (i % 4) p.tone = Math.min(2, Math.floor(rand() * 3));
    p.size *= .78; p.gem = p.gem && i % 3 === 0;
    needles.push(p);
  }
  const radiusAt = u => (1 - u) ** .82 * 1.025;
  const sag = (u, a) => .055 + .895 * u - .024 * (1 - u) * (.5 + .5 * Math.sin(3 * a - .7));
  const wire = makeRibbon(4.35, 1.87, radiusAt, sag);
  const lamps = Array.from({ length: 103 }, (_, i) => {
    const u = i / 102, a = 1.87 + u * 4.35 * TAU, r = radiusAt(u);
    return { u, x: Math.cos(a) * r, z: Math.sin(a) * r, y: sag(u,a), size: .76 + rand() ** 2 * .86, phase: rand() * TAU };
  });
  const fx = randomFrom(seed + 607);
  const champagne = blend(accent,[255,231,168],.63);
  const warmGlow = makeGlow(champagne);
  const lightRunner = makeComet(fx,Math.round(29+count/105),champagne,ivory);
  const swagRadius = u => radiusAt(u) * (1.017 + .043 * Math.sin(Math.PI * 26 * u) ** 2);
  const swagHeight = (u,a) => sag(u,a) - (.024 + .040 * (1-u)) * Math.sin(Math.PI * 26 * u) ** 2;
  const beadString = makeRibbon(4.35,1.87,swagRadius,swagHeight);
  const beadCount = Math.round(120 + count/25);
  const beads = Array.from({length:beadCount}, (_,i) => {
    const u = (i+.5)/beadCount, a = 1.87 + u*4.35*TAU, r = swagRadius(u);
    return { u, x: r*Math.cos(a), y: swagHeight(u,a), z: r*Math.sin(a), pendant: i%9 === 4 };
  });
  const drops = Array.from({length:Math.round(44+count/18)}, () => ({
    lamp: lamps[Math.floor(fx()*(lamps.length-2))], phase: fx(), speed: .32+fx()*.48,
    drop: .026+fx()**1.2*.11, angle: fx()*TAU, width: .024+fx()*.092, size: .54+fx()**2*1.45
  }));
  const flies = Array.from({length:Math.round(20+count/160)}, () => ({
    start: fx(), angle: fx()*TAU, orbit: .89+fx()*.71, life: .07+fx()*.069,
    size: .44+fx()**2*.76, phase: fx()*TAU
  }));
  // 三个花心依次离开树尖，每条余烬保留自己的速度、重力和尾色。
  const fireworkGlow=[makeGlow([255,177,70]),makeGlow([255,91,103]),makeGlow([255,238,202]),makeGlow([100,222,181])];
  const shells=[
    {x:0,y:.63,delay:0,ascent:.37,reach:.70,count:184},
    {x:-.58,y:.40,delay:.17,ascent:.46,reach:.38,count:72},
    {x:.60,y:.44,delay:.28,ascent:.48,reach:.39,count:76}
  ].map((shell,layer)=>({
    ...shell,
    sparks:Array.from({length:shell.count},(_,i)=>{
      const a=i*2.399963+(fx()-.5)*.09, depth=fx()*2-1;
      const tier=i%5, outer=tier>=2;
      const distance=(outer? .91+fx()*.12 : tier===0?.39:.66)*(outer && i%3===0?1:Math.sqrt(1-depth*depth));
      return {dx:Math.cos(a)*distance,dy:Math.sin(a)*distance,lag:fx()*.095,
        life:1.61+fx()*.97,fall:.48+fx()*.87,sway:(fx()-.5)*.19,
        phase:fx()*TAU,size:.65+fx()**2*1.46,split:i%12===3,near:.67+.33*(depth+1)*.5,
        color:layer===1 ? (i%3?1:0) : layer===2 ? (i%3?3:2) : tier===0?1:tier===1?2:i%4?0:2};
    })
  }));
  const pearls=Array.from({length:76},(_,i)=>({
    a:i*TAU/76,phase:fx()*TAU,size:.69+fx()*.84,fall:.82+fx()*.34
  }));
  const satellites=Array.from({length:7},(_,i)=>({
    angle:(i+.17)*TAU/7,at:.73+.24*(i%3)+fx()*.08,reach:.11+fx()*.075
  }));
  const willow=Array.from({length:70},(_,i)=>({
    a:i*TAU/70+fx()*.035,spread:.65+fx()*.36,drop:.71+fx()*.93,
    at:.77+fx()*.48,life:1.51+fx()*.84,drift:(fx()-.5)*.26,phase:fx()*TAU
  }));
  const balls = Array.from({ length: 27 }, (_, i) => {
    const u = .065 + .76 * ((i + rand() * .5) / 27);
    const a = .96 + i * 2.39996 + Math.sin(i * 7.21) * .13, r = radiusAt(u) * (.88 + rand() * .09);
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: u + .025, u,
      radius: (.044 + rand() * .030) * (1 - u * .45), kind: i % 5 === 2 ? 1 : 0 };
  });
  const glass = [makeBauble("#f59c78", "#bd3b41", "#480e1b"), makeBauble("#fff1be", "#d49e58", "#614229")];
  const shades = ["#fff6d2", "#a16c32", honey, cream, "#aa763c", "#ffedab", "#bc803a", cream, honey, "#f9dd9b"];
  const wideZoom=.855;
  let relays=[];
  let pullFrom, holdUntil, cameraTime, distance, velocity;
  function reset() {
    relays=[];
    pullFrom=Infinity; holdUntil=-Infinity; cameraTime=0; distance=0; velocity=0;
  }
  // 临界阻尼的解析解。连点或在回程中再点时，镜头从原位置和原速度继续。
  function followCamera(seconds,target) {
    if (seconds<=0 || (distance===target && velocity===0)) return;
    const rate=target ? 2.75 : 1.95;
    const offset=distance-target, carry=velocity+rate*offset, decay=Math.exp(-rate*seconds);
    distance=target+(offset+carry*seconds)*decay;
    velocity=(velocity-rate*carry*seconds)*decay;
    if (Math.abs(distance-target)+Math.abs(velocity)<.00004) { distance=target; velocity=0; }
  }
  function reframe(f) {
    const now=f.clock;
    const start=clamp(pullFrom,cameraTime,now), end=clamp(holdUntil,start,now);
    followCamera(start-cameraTime,0);
    followCamera(end-start,1);
    followCamera(now-end,0);
    cameraTime=now;
    const zoom=wideZoom**distance;
    f.h*=zoom; f.r*=zoom; f.unit*=zoom;
    f.base+=f.rest.r*.15*(1-zoom);
  }
  function tap(f,point) {
    let lamp=lamps[0],best=Infinity;
    const x=point.x*f.w,y=point.y*f.height,q={};
    for (const p of lamps) {
      project(f,p.x,p.y,p.z,q);
      const distance=(q.x-x)**2+(q.y-y)**2;
      if (distance<best) { best=distance; lamp=p; }
    }
    const pickup=.23, travel=.10+(1-lamp.u)*1.66, arrival=pickup+travel+.16;
    if (!f.quiet) {
      const ignition=f.clock+arrival, lead=Math.max(f.clock,ignition-1.35);
      pullFrom=f.clock>=holdUntil ? lead : Math.min(pullFrom,lead);
      holdUntil=Math.max(holdUntil,ignition+2.9);
    }
    relays=f.quiet ? [] : relays.slice(-4);
    relays.push({point,lamp,pickup,travel,arrival,at:f.clock,quiet:f.quiet});
  }
  function relayPoint(f,relay,age,out) {
    const p=relay.lamp;
    if (age<relay.pickup) {
      project(f,p.x,p.y,p.z,out);
      const v=smooth(0,relay.pickup,age);
      out.x=mix(relay.point.x*f.w,out.x,v);
      out.y=mix(relay.point.y*f.height,out.y,v)-Math.sin(v*Math.PI)*f.r*.07;
    } else if (age<relay.pickup+relay.travel) {
      projectRibbonAt(f,wire,mix(p.u,1,(age-relay.pickup)/relay.travel),out);
    } else {
      const rise=smooth(relay.pickup+relay.travel,relay.arrival,age);
      project(f,0,mix(lamps[lamps.length-1].y,.998,rise),0,out);
    }
    return out;
  }
  function drawRelays(f) {
    const q={},c=f.ctx;
    for (const relay of relays) {
      const age=f.clock-relay.at, p=relay.lamp;
      if (relay.quiet) {
        project(f,p.x,p.y,p.z,q);
        gleam(c,q.x,q.y,10*f.unit,cream,1-smooth(.4,1.2,age),.13);
        if (age<1.2) drawCrown(f,1.18,true);
        continue;
      }
      drawComet(f,lightRunner,age,.24,(t,out)=>relayPoint(f,relay,Math.max(0,t),out),
        1-smooth(relay.arrival,relay.arrival+.21,age));
      const arrivalGlow=smooth(relay.arrival-.10,relay.arrival+.06,age)*(1-smooth(relay.arrival+.07,relay.arrival+.63,age));
      if (arrivalGlow>.003) {
        project(f,0,.998,0,q); stamp(c,warmGlow,q.x,q.y,f.r*.17*arrivalGlow);
        gleam(c,q.x,q.y,f.r*(.13+.11*arrivalGlow),cream,arrivalGlow,.14);
      }
      drawCrown(f,age-relay.arrival);
    }
  }
  const entryColors=[champagne,blend(accent,[241,89,90],.84),[148,226,182]];
  const entryInks=entryColors.map(color=>rgb(color));
  const entryGlows=entryColors.map(makeGlow);
  const entryDust=entryColors.map(makeDustBrushes);
  const entryComets=entryColors.map(color=>makeComet(fx,65,color,ivory));
  function streamPoint(lane,position,time,out) {
    const a=lane*TAU/3+position*5.7+time*3.9;
    const r=1.24-.50*position+.12*Math.cos(3.8*position+lane);
    out.x=Math.cos(a)*r; out.z=Math.sin(a)*r;
    out.y=.08+position*.69+.13*Math.sin(a+.54);
    return out;
  }
  function entrance(f) {
    const progress=f.shot, power=1-smooth(.68,.99,progress);
    const c=f.ctx, q={}, tail={};
    for (let lane=0;lane<3;lane++) {
      const route=(u,out)=>{
        const v=clamp(u,0,1), source=streamPoint(lane,v,progress,out);
        const land=smooth(.43,.96,v);
        return project(f,source.x*(1-land),mix(source.y,.998,land),source.z*(1-land),out);
      };
      // 在同一股粒流里叠出细丝、尘雾和少数近景亮星。最后都向树尖收束。
      c.save(); c.globalCompositeOperation="lighter"; c.lineCap="round";
      const veil=power*(1-smooth(.53,.96,progress));
      const start=.03+.40*progress, end=.83+.17*progress;
      for (let strand=0;strand<4;strand++) {
        c.beginPath();
        for (let j=0;j<=65;j++) {
          const u=mix(start,end,j/65); route(u,q);
          const fade=Math.sin(j/65*Math.PI), offset=(strand-1.5)*f.unit*2.7*fade;
          const x=q.x+offset*Math.cos(u*14+lane+progress*4);
          const y=q.y+offset*Math.sin(u*17+lane+progress*4);
          if (j) c.lineTo(x,y); else c.moveTo(x,y);
        }
        c.strokeStyle=entryInks[lane]; c.lineWidth=f.unit*(strand===1?3.6:.70);
        c.globalAlpha=veil*(strand===1?.095:.31); c.stroke();
      }
      for (let j=1;j<111;j++) {
        const u=mix(start,end,j/111), wind=u*32+lane*2+progress*5.3;
        route(u,q); route(u-.007,tail);
        const flicker=.45+.49*Math.sin(wind*1.38)**2;
        const envelope=Math.sin(j/111*Math.PI)**.70;
        const off=f.unit*(3+j%7)*Math.sin(wind*1.7);
        const x=q.x+off*Math.cos(wind), y=q.y+off*Math.sin(wind);
        c.globalAlpha=veil*envelope*flicker*(q.z>0?.80:.49);
        stamp(c,entryDust[lane][j%12],x,y,f.unit*(6.7+4.5*flicker));
        if (j%9===2) {
          stamp(c,entryGlows[lane],x,y,f.unit*(6+6*flicker));
          c.beginPath(); c.moveTo(tail.x,tail.y); c.lineTo(x,y); c.strokeStyle=entryInks[lane];
          c.lineWidth=f.unit*.65; c.stroke();
        }
      }
      c.restore();
      drawComet(f,entryComets[lane],.14+.85*progress,.185,route,power*(lane? .84:1));
    }
  }
  function drawAssembly(f) {
    if (f.shot>=.99) return;
    const c=f.ctx, source={}, q={}, tail={};
    c.save(); c.globalCompositeOperation="lighter"; c.lineCap="round";
    for (let i=0;i<needles.length;i++) {
      const p=needles[i], lane=i%3;
      const start=.035+.37*p.y+.11*p.cluster;
      const land=smooth(start,start+.47,f.shot);
      if (land>=.998) continue;
      const loose=1-land, strength=.91*(1-smooth(.74,1,land));
      const height=p.y+.18*p.kick;
      streamPoint(lane,height,f.shot,source);
      const phi=p.phase+land*4.3, spread=(.055+.24*p.cluster)*loose;
      const x=mix(source.x,p.x,land)+Math.cos(phi)*spread;
      const z=mix(source.z,p.z,land)+Math.sin(phi)*spread;
      const y=mix(source.y,p.y,land)+p.kick*spread*.64+.071*Math.sin(land*Math.PI);
      project(f,x,y,z,q);
      const near=clamp(.73+.23*q.z,.29,1), size=f.unit*(.52+p.size*.73);
      c.globalAlpha=strength*near*(.53+.40*Math.sin(phi+f.clock*1.13)**2);
      c.fillStyle=entryInks[lane]; c.fillRect(q.x,q.y,size,size);
      if (p.gem || i%17===0) {
        stamp(c,entryGlows[lane],q.x,q.y,size*(3.1+1.6*p.cluster));
        const arc=.049*loose;
        project(f,x+source.z*arc,y-arc*.10,z-source.x*arc,tail);
        c.strokeStyle=entryInks[lane]; c.lineWidth=f.unit*.62;
        c.beginPath(); c.moveTo(tail.x,tail.y); c.lineTo(q.x,q.y); c.stroke();
        if (p.gem && p.cluster>.72) gleam(c,q.x,q.y,size*3.1,cream,strength*near,.16);
      }
    }
    c.restore();
  }
  function backdrop(c, f, random) {
    // 树后的远景压低亮度，让近处红玻璃球和灯芯保持清楚。
    for (let i = 0; i < 36; i++) {
      const x = random() * f.w;
      const y = f.base + (random() - .5) * f.h * .05;
      const h = f.h * (.038 + random() ** 2 * .18);
      c.fillStyle = i % 2 ? "rgba(6,20,18,.62)" : "rgba(13,35,31,.51)";
      c.beginPath(); c.moveTo(x, y - h);
      for (let tier = 1; tier <= 5; tier++) {
        c.lineTo(x + h * .24 * tier / 5, y - h + h * tier / 5);
        c.lineTo(x + h * .16 * tier / 5, y - h + h * tier / 5);
      }
      for (let tier = 5; tier >= 1; tier--) {
        c.lineTo(x - h * .24 * tier / 5, y - h + h * tier / 5);
        c.lineTo(x - h * .135 * tier / 5, y - h + h * (tier - 1) / 5);
      }
      c.closePath(); c.fill();
    }
    for (let i = 0; i < 34; i++) {
      const x = random() * f.w, y = f.base - random() ** 1.8 * f.h * .59;
      if (Math.abs(x - f.cx) < f.r * .85) continue;
      const radius = (1.5 + random() ** 2 * 6) * f.unit;
      softLight(c, x, y, radius * 1.8, radius * 1.8, accent, .14);
      c.fillStyle = rgb(accent, .09); c.beginPath(); c.arc(x,y,radius*.61,0,TAU); c.fill();
    }
  }
  function drawLights(f, level, front) {
    const c = f.ctx, q = {};
    for (let i = 0; i < lamps.length; i++) {
      const p = lamps[i];
      project(f, p.x, p.y, p.z, q);
      if ((q.z >= 0) !== front) continue;
      const lit = smooth(-.008, .042, level - p.u);
      const energy=(.14+.86*lit)*(front?1:.38)*smooth(-.05,.07,f.growth-p.y);
      if (energy < .014) continue;
      const breath = .91 + .09 * Math.sin(f.clock * 1.54 + p.phase);
      const r = f.unit * p.size * (6.4 + 3.8 * lit);
      c.globalAlpha = energy * breath;
      stamp(c, f.glow, q.x, q.y, r);
      for (const relay of relays) {
        const age=f.clock-relay.at;
        const fraction=(p.u-relay.lamp.u)/Math.max(.00001,1-relay.lamp.u);
        const pass=relay.pickup+fraction*relay.travel;
        if (p.u<relay.lamp.u || age<pass || relay.quiet) continue;
        const heat=(1-smooth(.04,.43,age-pass))*(front?1:.62);
        if (heat>.01) {
          c.globalAlpha=heat; stamp(c,warmGlow,q.x,q.y,r*1.85);
          gleam(c,q.x,q.y,r*.86,cream,heat,.21);
        }
      }
      if (i % 6 === 1 && lit > .8 && front) {
        gleam(c, q.x, q.y, r * .59, cream, energy * .81, .12);
      }
    }
    c.globalAlpha = 1;
  }
  function drawLampDust(f,level,front) {
    const c=f.ctx, q={}, tail={};
    c.save(); c.globalCompositeOperation="lighter"; c.lineCap="round";
    for (const p of drops) {
      const lamp=p.lamp;
      const lit=smooth(-.008,.065,level-lamp.u);
      if (lit<.01) continue;
      const u=(p.phase+f.clock*p.speed)%1, prev=Math.max(0,u-.095);
      const dx=Math.cos(p.angle)*p.width, dz=Math.sin(p.angle)*p.width;
      const y=lamp.y-p.drop*u*u;
      if (y<-.025) continue;
      project(f,lamp.x+dx*u,y,lamp.z+dz*u,q);
      if ((q.z>=0)!==front) continue;
      project(f,lamp.x+dx*prev,lamp.y-p.drop*prev*prev,lamp.z+dz*prev,tail);
      const strength=lit*smooth(0,.11,u)*(1-smooth(.65,1,u))*(front?.97:.32);
      c.globalAlpha=strength*.71; c.strokeStyle=honey; c.lineWidth=.78*f.unit;
      c.beginPath(); c.moveTo(tail.x,tail.y); c.lineTo(q.x,q.y); c.stroke();
      c.globalAlpha=strength; c.fillStyle=cream;
      c.fillRect(q.x,q.y,p.size*f.unit,p.size*f.unit);
      if (p.size>1.10) stamp(c,warmGlow,q.x,q.y,p.size*3.0*f.unit);
    }
    c.restore();
  }
  function drawBeads(f,level,front) {
    const c=f.ctx,q={};
    drawRibbon(f,beadString,Math.min(1,level),front,.66,honey,cream,.57);
    c.save(); c.globalCompositeOperation = "lighter";
    for (const bead of beads) {
      const lit = smooth(-.01,.049,level-bead.u);
      if (lit<.02) continue;
      project(f,bead.x,bead.y,bead.z,q);
      if ((q.z>=0)!==front) continue;
      const wave = .60+.39*Math.cos(bead.u*TAU*3.1 - f.clock*1.82)**2;
      c.globalAlpha=lit*wave*(front ? .98 : .27);
      c.fillStyle=cream;
      const size=(bead.pendant ? 2.12 : 1.18)*f.unit;
      c.fillRect(q.x-size/2,q.y-size/2,size,size*(bead.pendant ? 1.32 : 1));
      if (bead.pendant) {
        stamp(c,warmGlow,q.x,q.y,size*2.38);
        if (front && wave>.92) gleam(c,q.x,q.y,size*2.37,cream,lit*.82,.1);
      }
    }
    c.restore();
  }
  function drawFireflies(f) {
    const c=f.ctx, q={};
    c.save(); c.globalCompositeOperation="lighter";
    for (const p of flies) {
      const rise=(p.start+f.clock*p.life)%1;
      const angle=p.angle+rise*1.27+.14*Math.sin(f.clock*.44+p.phase);
      const orbit=p.orbit*(1-.34*rise);
      project(f,Math.cos(angle)*orbit,.025+rise*.91,Math.sin(angle)*orbit,q);
      c.globalAlpha=smooth(0,.13,rise)*(1-smooth(.76,1,rise))*(.44+.35*Math.sin(rise*9+p.phase)**2);
      stamp(c,warmGlow,q.x,q.y,p.size*f.unit*7.6);
    }
    c.restore();
  }
  function drawCrown(f,age,still=false) {
    if (age<0 || age>4.1) return;
    const c=f.ctx, tip=project(f,0,.998,0,{}), unit=f.unit;
    // 先在远景里布置烟花，再用同一镜头投影，升空过程中花球保持比例。
    const view=still ? 1 : f.r/(f.rest.r*wideZoom);
    const pivot=f.rest.base+f.rest.r*.15;
    const wideTip=pivot+(tip.y-pivot)/view;
    const wideRadius=Math.min(f.rest.r*1.22,f.w*.453);
    const radius=wideRadius*view;
    const up=Math.min(wideRadius,Math.max(8,wideTip-f.height*.045)/1.40)*view;
    const colors=["#ffc66e","#ff8186","#fff3d8","#82e5c4"];
    c.save(); c.globalCompositeOperation="lighter"; c.lineCap="round";
    const ignition=(1-smooth(.10,.63,age));
    if (ignition>.01) {
      c.globalAlpha=.68*ignition;
      stamp(c,warmGlow,tip.x,tip.y,radius*(.12+.26*ignition));
      gleam(c,tip.x,tip.y,radius*.18*ignition,cream,ignition,.14);
    }
    for (const shell of shells) {
      const elapsed=age-shell.delay;
      if (elapsed<0) continue;
      const v=clamp(elapsed/shell.ascent,0,1);
      const head=k=>({x:tip.x+radius*shell.x*k*(.65+.35*k),y:tip.y-up*shell.y*(1-(1-k)**1.46)});
      const centre=head(1), burst=elapsed-shell.ascent;
      if (burst<.27) {
        const q=head(v), fade=1-smooth(0,.27,burst);
        c.beginPath();
        for (let i=0;i<=10;i++) {
          const at=Math.max(0,v-(10-i)*.035), tail=head(at);
          if (i) c.lineTo(tail.x,tail.y); else c.moveTo(tail.x,tail.y);
        }
        c.strokeStyle=honey; c.globalAlpha=.81*fade; c.lineWidth=1.5*unit; c.stroke();
        c.globalAlpha=fade; stamp(c,warmGlow,q.x,q.y,10*unit);
      }
      if (burst<0) continue;
      const halo=smooth(0,.09,burst)*(1-smooth(.12,.65,burst));
      if (halo>.01) {
        c.globalAlpha=.57*halo; stamp(c,warmGlow,centre.x,centre.y,radius*shell.reach*.68);
        gleam(c,centre.x,centre.y,radius*.082,cream,halo,.77);
      }
      const width=radius*shell.reach, height=up*shell.reach;
      if (shell===shells[0]) drawPearlsAndWillow(f,centre,radius,up,burst);
      for (const p of shell.sparks) {
        const t=(burst-p.lag)/p.life;
        if (t<=0 || t>=1) continue;
        const alpha=smooth(0,.075,t)*(1-smooth(.62,1,t))*p.near;
        const shimmer=.78+.22*Math.sin(p.phase+t*18)**2;
        if (t<.64) {
          const u=Math.max(0,t-.31*(1-smooth(.30,.64,t))), trail=1-(1-u)**3.18;
          const v=t*.94, head=1-(1-v)**3.18;
          c.beginPath();
          c.moveTo(centre.x+width*(p.dx*trail+p.sway*Math.sin(u*Math.PI)),centre.y+height*p.dy*trail+radius*p.fall*u*u);
          c.lineTo(centre.x+width*(p.dx*head+p.sway*Math.sin(v*Math.PI)),centre.y+height*p.dy*head+radius*p.fall*v*v);
          c.strokeStyle=colors[p.color]; c.lineWidth=.62*unit;
          c.globalAlpha=.35*alpha*(1-smooth(.36,.64,t)); c.stroke();
        }
        c.beginPath();
        let px,py;
        for (let k=0;k<6;k++) {
          const u=Math.max(0,t-(5-k)*(.017+.011*t));
          const flight=1-(1-u)**3.18;
          px=centre.x+width*(p.dx*flight+p.sway*Math.sin(u*Math.PI));
          py=centre.y+height*p.dy*flight+radius*p.fall*u*u;
          if (k) c.lineTo(px,py); else c.moveTo(px,py);
          if (k===2 && p.size>1.39) {
            c.globalAlpha=alpha*.43; c.fillStyle=colors[p.color];
            c.fillRect(px+Math.sin(p.phase)*unit,py+2.2*unit,unit,unit);
          }
        }
        c.strokeStyle=t>.62?honey:colors[p.color];
        c.lineWidth=(.40+.31*p.size)*unit; c.globalAlpha=alpha*.79*shimmer; c.stroke();
        c.globalAlpha=alpha*shimmer;
        stamp(c,fireworkGlow[p.color],px,py,unit*(1.3+p.size*1.95));
        if (p.size>1.90 && t<.53) gleam(c,px,py,3.6*unit,cream,alpha*.88,p.phase);
        if (p.split && t>.22 && t<.83) {
          const fan=(t-.22)/.61, light=Math.sin(Math.PI*fan);
          for (let b=0;b<3;b++) {
            const a=p.phase+b*TAU/3, d=width*(.045+.136*fan);
            const bx=px+Math.cos(a)*d, by=py+Math.sin(a)*d+radius*.12*fan*fan;
            c.globalAlpha=.84*light; stamp(c,fireworkGlow[b%2?0:2],bx,by,unit*(2.1+p.size));
          }
        }
      }
    }
    c.restore();
  }
  function drawPearlsAndWillow(f,centre,radius,up,age) {
    const c=f.ctx, unit=f.unit;
    // 斜着的一圈星珠从主花里长出来，错开花球的正面轮廓。
    const t=clamp((age-.07)/1.78,0,1), ring=1-(1-t)**3.65;
    if (t>0 && t<1) {
      const shine=smooth(0,.13,t)*(1-smooth(.55,1,t));
      for (let i=0;i<pearls.length;i++) {
        const p=pearls[i], a=p.a+.17*t, dx=Math.cos(a), dy=Math.sin(a);
        const x=centre.x+radius*ring*(dx*.82+dy*.085);
        const y=centre.y+up*ring*(dy*.31-dx*.20)+radius*p.fall*t*t*.26;
        const light=shine*(.72+.28*Math.sin(p.phase+f.clock*2.7)**2);
        c.globalAlpha=light; stamp(c,fireworkGlow[i%5===1?2:0],x,y,unit*(2.5+p.size*1.9));
        if (i%8===0) gleam(c,x,y,(3.2+p.size)*unit,"#ffdfa3",light,.3);
      }
    }
    // 二次爆点长在主花外缘。每朵只分出少量亮芯，仍能读到中央大花。
    for (const bud of satellites) {
      const v=(age-bud.at)/.91;
      if (v<=0 || v>=1) continue;
      const x=centre.x+Math.cos(bud.angle)*radius*.65, y=centre.y+Math.sin(bud.angle)*up*.55+radius*.06;
      const extension=1-(1-v)**3.0, light=smooth(0,.09,v)*(1-smooth(.49,1,v));
      for (let j=0;j<14;j++) {
        const angle=bud.angle+j*TAU/14, reach=bud.reach*(j%2?.66:1);
        const dx=Math.cos(angle)*radius*reach,dy=Math.sin(angle)*up*reach;
        const px=x+dx*extension, py=y+dy*extension+v*v*up*.085;
        c.globalAlpha=light*.82; c.strokeStyle=j%3?"#ffcf83":"#fff4d8"; c.lineWidth=.71*unit;
        c.beginPath(); c.moveTo(px-dx*(1-v)*.31,py-dy*(1-v)*.31); c.lineTo(px,py); c.stroke();
        stamp(c,fireworkGlow[j%4?0:2],px,py,3.1*unit);
      }
    }
    // 最后一层金柳沿长抛物线下垂，树冠两侧都能看见留下的火星。
    for (const p of willow) {
      const v=(age-p.at)/p.life;
      if (v<=0 || v>=1) continue;
      const alpha=smooth(0,.16,v)*(1-smooth(.63,1,v));
      c.beginPath(); let x,y;
      for (let j=0;j<6;j++) {
        const k=Math.max(0,v-(5-j)*.043), radial=p.spread*(.65+.31*k);
        x=centre.x+radius*(Math.cos(p.a)*radial+p.drift*k+.037*Math.sin(p.phase+3.8*k)*k);
        y=centre.y+up*Math.sin(p.a)*radial*.85+radius*(p.drop*k*k+.15*k);
        if (j) c.lineTo(x,y); else c.moveTo(x,y);
        if (j===1 || j===3) {
          c.globalAlpha=alpha*.50; c.fillStyle="#ffc271"; c.fillRect(x+unit,y,unit,unit);
        }
      }
      c.lineWidth=unit*.77; c.strokeStyle="#f9bb66"; c.globalAlpha=alpha*.73; c.stroke();
      c.globalAlpha=alpha; stamp(c,warmGlow,x,y,3.5*unit);
    }
  }
  function drawBalls(f, level, front) {
    const c = f.ctx, q = {};
    for (const p of balls) {
      const formed=smooth(-.012,.07,f.growth-p.y);
      if (formed<.01) continue;
      project(f, p.x, p.y, p.z, q);
      if ((q.z >= 0) !== front) continue;
      const rad = f.r * p.radius * (.90 + .10 * q.z);
      c.globalAlpha=formed*(front?.94:.47)*(.82+.18*smooth(p.u-.15,p.u+.04,level));
      c.drawImage(glass[p.kind], q.x - rad * 48 / 34, q.y - rad * 67 / 34, rad * 96 / 34, rad * 114 / 34);
      const glint = (.5 + .5*Math.sin(f.clock*1.42 + p.u*32)) ** 6;
      if (front && glint>.43) {
        gleam(c,q.x-rad*.35,q.y-rad*.48,rad*.68,cream,
          glint*smooth(-.02,.06,level-p.u),.17);
      }
    }
    c.globalAlpha = 1;
  }
  function paintBranches(f, front) {
    const c = f.ctx, q = {};
    for (const b of branches) {
      const formed=smooth(-.015,.09,f.growth-b.y);
      if (formed<.005) continue;
      if ((project(f,b.middle.x,b.middle.y,b.middle.z,q).z >= 0) !== front) continue;
      c.beginPath();
      for (let i = 0; i < b.edge.length; i++) {
        const p = b.edge[i]; project(f,p.x,p.y,p.z,q);
        if (i) c.lineTo(q.x,q.y); else c.moveTo(q.x,q.y);
      }
      c.closePath(); c.fillStyle=boughColor[b.tone]; c.globalAlpha=(front?.80:.76)*formed; c.fill();
    }
  }
  function draw(f) {
    const c = f.ctx, q = {}, tail = {};
    f.growth=-.12+1.24*smooth(.14,.95,f.shot);
    const level=-.09+1.20*smooth(.27,.97,f.shot);
    relays=relays.filter(p=>f.clock-p.at<p.arrival+4.1);
    drawGround(f);
    drawFireflies(f);
    c.globalAlpha=smooth(-.02,.17,f.growth);
    const trunk = c.createLinearGradient(f.cx - f.r * .05, 0, f.cx + f.r * .05, 0);
    trunk.addColorStop(0,"#211d17"); trunk.addColorStop(.42,"#634431"); trunk.addColorStop(1,"#30241b");
    c.fillStyle = trunk; c.beginPath();
    c.moveTo(f.cx - .048 * f.r, f.base + f.r * .071);
    c.lineTo(f.cx + .041 * f.r, f.base + f.r * .067); c.lineTo(f.cx + .008 * f.r, f.base-f.h*clamp(f.growth,0,.92));
    c.closePath(); c.fill();
    c.globalAlpha=.76; paintBranches(f,false);
    drawBeads(f,level,false); drawBalls(f,level,false); drawLights(f,level,false); drawLampDust(f,level,false);
    c.globalAlpha=.80; paintBranches(f,true);
    for (let i = 0; i < groups.length; i++) {
      c.beginPath();
      for (const p of groups[i]) {
        if (p.y+.043*p.cluster>f.growth) continue;
        project(f,p.from.x,p.from.y,p.from.z,tail); project(f,p.x,p.y,p.z,q);
        c.moveTo(tail.x,tail.y); c.lineTo(q.x,q.y);
        for (const [start,end] of p.sprig) {
          project(f,start.x,start.y,start.z,tail); project(f,end.x,end.y,end.z,q);
          c.moveTo(tail.x,tail.y); c.lineTo(q.x,q.y);
        }
      }
      c.strokeStyle = needleColor[i]; c.lineWidth = (.51 + i * .052) * f.unit;
      c.lineCap="round"; c.globalAlpha=.67+.043*i; c.stroke();
    }
    for (let i=0;i<needles.length;i+=4) {
      const p = needles[i];
      if (p.y<=f.growth) drawSpeck(f,p,p.x,p.y,p.z,.53);
    }
    c.globalAlpha = 1;
    drawAssembly(f);
    drawRibbon(f,wire,Math.min(f.growth,1),true,.52,"#c5a371",cream,.34);
    drawRibbon(f,wire,Math.min(level,1),true,.62,honey,cream,.46);
    drawBeads(f,level,true); drawBalls(f,level,true); drawLights(f,level,true); drawLampDust(f,level,true);
    drawComet(f,lightRunner,level,.085,(u,out)=>projectRibbonAt(f,wire,u,out),
      smooth(0,.07,level)*(1-smooth(.88,1,level))*.88);
    const star=smooth(.94,1.07,level);
    project(f,0,.998,0,q);
    facetedStar(f,q.x,q.y,f.r*.114,f.yaw*.62,star,shades);
    drawRelays(f);
    return .42 + .58 * smooth(.55,1,level);
  }
  return {
    seed,inks,draw,backdrop,reset,tap,entrance,reframe,action:"轻点让最近的彩灯沿灯串点亮树顶",
    camera:{zoom:.80,focus:.35,pan:-.24,lift:-.06,pitch:-.25,direction:-1},
    cues:[{at:1.05,x:.56,y:.75},{at:6.0,x:.49,y:.30}],
    sparkColor:champagne,speed:.104,initialAngle:-.06,drift:10,snowCount:68,
    sky: { base: "#07100e", air: [46, 75, 60], star: [215, 217, 179], stars: .70,
      rings: [.67, .98, 1.23], spread: .47 }
  };
}
