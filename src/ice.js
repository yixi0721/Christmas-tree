// ── 冰晶回旋：螺旋的前端决定每一层枝晶何时出现 ─────────────
function makeCrystal(tint, kind) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 80;
  const c = tile.getContext("2d");
  c.translate(40,40); c.lineCap = "round"; c.lineJoin = "round";
  const pattern = new Path2D();
  for (let arm = 0; arm < 6; arm++) {
    const a = (arm/6 - .25) * TAU, dx = Math.cos(a), dy = Math.sin(a);
    pattern.moveTo(0,0); pattern.lineTo(dx*31,dy*31);
    for (let j = 0; j < 3; j++) {
      const at = 10 + j*7, len = (kind === 1 ? 11.5 : 8.9) - j*1.55;
      for (const side of [-1,1]) {
        const b = a + side * .92;
        pattern.moveTo(dx*at,dy*at); pattern.lineTo(dx*at+Math.cos(b)*len,dy*at+Math.sin(b)*len);
      }
    }
    if (kind !== 0) {
      const b = a + TAU/6, r = kind === 1 ? 8.1 : 13;
      pattern.moveTo(dx*r,dy*r); pattern.lineTo(Math.cos(b)*r,Math.sin(b)*r);
    }
  }
  c.strokeStyle = rgb(tint,.25); c.lineWidth = 6; c.stroke(pattern);
  c.strokeStyle = rgb(tint,.94); c.lineWidth = 2.5; c.stroke(pattern);
  c.strokeStyle = "#efffff"; c.lineWidth = 1.22; c.stroke(pattern);
  return tile;
}
function makeAurora(mint, lilac, layer) {
  const tile = document.createElement("canvas");
  tile.width = 850; tile.height = 360;
  const c = tile.getContext("2d"), rand = randomFrom(230917+layer);
  c.globalCompositeOperation = "lighter";
  // 每根极光射线从同一条发光下缘向上变细，两层折出不同颜色的褶皱。
    for (let x = 0; x < tile.width; x += 1.65) {
      const u = x/tile.width;
      const fold = Math.sin(TAU*(1.18*u+.08*layer) + .48*Math.sin(15*u+layer));
      const foot = 208 + 39*fold + 23*Math.sin(12*u+layer) + layer*33;
      const ray = .48 + .37*Math.sin(31*u+layer)**2 + .15*Math.sin(97*u+.4*layer)**2;
      const lift = (64 + 95*ray + 10*Math.sin(57*u+layer) + rand()*4) * (layer ? .66 : 1);
      const lean = 23 + 41*Math.sin(7*u+layer);
      const fade = smooth(0,.16,u)*(1-smooth(.84,1,u));
      const hue = blend(mint,lilac,clamp(.50+.49*Math.sin(5.6*u+layer*2.4),0,1));
      const power = (.24 + .51*ray**2)*fade*(layer ? .70 : 1);
      const glow = c.createLinearGradient(0,foot-lift,0,foot+14);
      glow.addColorStop(0,rgb(hue,0)); glow.addColorStop(.51,rgb(hue,power*.22));
      glow.addColorStop(.83,rgb(hue,power*.66)); glow.addColorStop(.91,rgb(hue,power));
      glow.addColorStop(1,rgb(hue,0));
      c.fillStyle = glow; c.beginPath(); c.moveTo(x,foot+14);
      c.quadraticCurveTo(x+lean*.24,foot-lift*.51,x+lean,foot-lift);
      c.lineTo(x+lean+1.6,foot-lift); c.quadraticCurveTo(x+lean*.24+2.2,foot-lift*.51,x+2.2,foot+14);
      c.closePath(); c.fill();
    }
  const haze = document.createElement("canvas");
  haze.width=101; haze.height=77;
  haze.getContext("2d").drawImage(tile,0,0,haze.width,haze.height);
  const veil = document.createElement("canvas");
  veil.width=tile.width; veil.height=tile.height;
  const v=veil.getContext("2d"); v.imageSmoothingQuality="high";
  v.drawImage(haze,0,0,veil.width,veil.height);
  v.globalCompositeOperation="lighter"; v.globalAlpha=.32;
  v.drawImage(tile,0,0);
  return veil;
}
function createScene(accent, count) {
  const seed = 912241, rand = randomFrom(seed);
  const frost = blend(accent, [249, 254, 255], .79);
  const deep = blend(accent, [26, 74, 113], .65);
  const inks = [deep, accent, blend(accent, frost, .46), frost, [240, 254, 255]].map(color => rgb(color));
  const tint = rgb(accent), core = rgb(frost), cold = rgb(deep);
  const fx = randomFrom(seed + 719);
  const mint = blend(accent,[66,240,183],.70), lilac = blend(accent,[177,128,252],.70);
  const auroras = [makeAurora(mint,lilac,0),makeAurora(mint,lilac,1)];
  const crystals = makeFallingField(fx,Math.round(18+count/108),
    [makeCrystal(frost,0),makeCrystal(mint,1),makeCrystal(lilac,2)],10.8,.054);
  const comet = makeComet(fx,Math.round(51+count/53),mint,frost);
  const frostGlow=makeGlow(frost);
  const blueGlow=makeGlow(blend(accent,[60,125,255],.57));
  const splinters=Array.from({length:90},(_,i)=>({
    arm:i%6, length:.13+.87*fx(), drift:(fx()-.5)*.91, lift:.55+fx()*1.03,
    phase:fx(), size:.67+fx()**2*1.62
  }));
  const waveCircle=makeGroundArc(0,TAU);
  const groundSparks=Array.from({length:143},()=>{
    const angle=fx()*TAU;
    return {x:Math.cos(angle),z:Math.sin(angle),shift:(fx()-.5)*.068,lift:fx(),size:.55+fx()**2*1.55};
  });
  const turns = 4.8, phase = 1.06;
  // 投影里的方位角是枝条方位减去镜头 yaw。镜头收回、自转和导光都沿螺旋前进。
  const winding = Math.sign(turns);
  const radiusAt = u => Math.pow(1 - u, .81);
  const ribbon = makeRibbon(turns, phase, u => radiusAt(u) * 1.045);
  const filament = makeRibbon(turns, phase - .081, u => radiusAt(u) * (1.051 + .016 * Math.sin(u * 54)),
    u => .033 + u * .937);
  const landing=.018;
  const foot=ribbon[Math.round(landing*(ribbon.length-1))];
  const openingGrowth=shot=>landing+(1-landing)*smooth(.20,.885,shot);
  // 彗核、冰上的倒影和冰裂纹共享一条滑行路线。负位置留给首帧的拖尾。
  function skate(position,out) {
    const bend=Math.sin(Math.PI*position);
    out.x=mix(.55,foot.x,position)-.19*bend;
    out.z=mix(-.89,foot.z,position)+.16*bend;
    out.y=.051+.018*bend;
    return out;
  }
  function openingPoint(f,shot,out,mirror=false) {
    const progress=openingGrowth(shot), index=progress*(ribbon.length-1), i=Math.floor(index);
    const a=ribbon[i], b=ribbon[Math.min(i+1,ribbon.length-1)], k=index-i;
    let x=mix(a.x,b.x,k), y=mix(a.y,b.y,k), z=mix(a.z,b.z,k);
    if (shot<.28) {
      const ground=skate(.13+shot*3.3,out), join=smooth(.105,.28,shot);
      x=mix(ground.x,x,join); y=mix(ground.y,y,join); z=mix(ground.z,z,join);
    } else if (shot>.855) {
      const cap=smooth(.855,.946,shot);
      x*=1-cap; z*=1-cap; y=mix(y,1.006,cap);
    }
    return project(f,x,mirror ? -y : y,z,out);
  }
  const iceRand=randomFrom(seed+1303), cracks=[], splintersAtFloor=[];
  function fracture(x,z,dx,dz,start,steps,depth) {
    for (let i=0;i<steps;i++) {
      const flex=(iceRand()-.5)*.61, length=.11+iceRand()*.20;
      const dir=Math.atan2(dz,dx)+flex;
      const nx=x+Math.cos(dir)*length, nz=z+Math.sin(dir)*length;
      cracks.push({x,z,nx,nz,at:start,span:.020+iceRand()*.017,depth});
      if (!depth && i%2===1) {
        const side=dir+(iceRand()>.5?1:-1)*(.66+iceRand()*.47);
        fracture(nx,nz,Math.cos(side),Math.sin(side),start+.015,2,1);
      }
      if (!depth && i%2===0) {
        splintersAtFloor.push({x:nx,z:nz,at:start+.014,high:.029+iceRand()**2*.082,
          width:.032+iceRand()*.053,lean:(iceRand()-.5)*.085,phase:iceRand()*TAU});
      }
      x=nx; z=nz; dx=Math.cos(dir); dz=Math.sin(dir); start+=.016;
    }
  }
  for (const position of [-.15,.16,.48,.83]) {
    const onIce=skate(position,{});
    for (const side of [0,1]) {
      const angle=position*3.65+.64+side*(2.67+.59*iceRand());
      fracture(onIce.x,onIce.z,Math.cos(angle),Math.sin(angle),(position-.13)/3.3,5,0);
    }
  }
  const iceViolet=rgb(lilac), iceTurquoise=rgb(mint);
  function drawPrism(c,x,y,dx,dy,width,alpha) {
    const tipX=x+dx, tipY=y+dy;
    const shoulderX=x+dx*.69, shoulderY=y+dy*.69, ridge=shoulderX+width*.12;
    c.fillStyle=iceViolet; c.globalAlpha=alpha*.46;
    c.beginPath(); c.moveTo(x-width*.55,y); c.lineTo(shoulderX-width*.62,shoulderY);
    c.lineTo(ridge,shoulderY+width*.19); c.lineTo(x+width*.10,y+width*.09); c.closePath(); c.fill();
    c.fillStyle=iceTurquoise; c.globalAlpha=alpha*.32;
    c.beginPath(); c.moveTo(x+width*.10,y+width*.09); c.lineTo(ridge,shoulderY+width*.19);
    c.lineTo(shoulderX+width*.48,shoulderY+width*.07); c.lineTo(x+width*.45,y-width*.08); c.closePath(); c.fill();
    c.fillStyle=core; c.globalAlpha=alpha*.74;
    c.beginPath(); c.moveTo(shoulderX-width*.62,shoulderY); c.lineTo(tipX,tipY);
    c.lineTo(ridge,shoulderY+width*.19); c.closePath(); c.fill();
    c.fillStyle=tint; c.globalAlpha=alpha*.63;
    c.beginPath(); c.moveTo(ridge,shoulderY+width*.19); c.lineTo(tipX,tipY);
    c.lineTo(shoulderX+width*.48,shoulderY+width*.07); c.closePath(); c.fill();
    c.strokeStyle=core; c.globalAlpha=alpha*.83; c.lineWidth=Math.max(.48,width*.044);
    c.beginPath(); c.moveTo(x+width*.10,y+width*.09); c.lineTo(ridge,shoulderY+width*.19);
    c.lineTo(tipX,tipY); c.stroke();
  }
  function drawIceFloor(f) {
    const t=f.shot, fade=1-smooth(.29,.70,t);
    if (fade<.002) return;
    const c=f.ctx, a={}, b={}, tip={};
    c.save(); c.lineCap="round"; c.lineJoin="round"; c.globalCompositeOperation="lighter";
    for (const line of cracks) {
      project(f,line.x,0,line.z,a); project(f,line.nx,0,line.nz,b);
      c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y);
      c.strokeStyle=cold; c.lineWidth=f.unit*(line.depth?.62:1.1); c.globalAlpha=fade*.48; c.stroke();
      const run=clamp((t-line.at)/line.span,0,1);
      if (run<=0) continue;
      const shine=fade*(1-.83*smooth(.040,.22,t-line.at))*(line.depth?.66:1);
      c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(mix(a.x,b.x,run),mix(a.y,b.y,run));
      c.lineWidth=4.3*f.unit; c.strokeStyle=line.depth?iceViolet:tint; c.globalAlpha=shine*.22; c.stroke();
      c.lineWidth=(line.depth?.62:1.0)*f.unit; c.strokeStyle=line.depth?tint:core; c.globalAlpha=shine*.91; c.stroke();
    }
    for (const shard of splintersAtFloor) {
      const grow=smooth(shard.at-.024,shard.at+.087,t);
      if (grow<.01) continue;
      project(f,shard.x,0,shard.z,a);
      project(f,shard.x+shard.lean*grow,shard.high*grow,shard.z+.032*grow,tip);
      const width=shard.width*f.r*grow, power=fade*grow;
      const dx=tip.x-a.x, dy=tip.y-a.y;
      drawPrism(c,a.x,a.y,dx,-dy*.55,width,power*.20);
      if (shard.phase>3.8) drawPrism(c,a.x+width*.24,a.y,dx*.38+width*.71,dy*.63,width*.59,power*.81);
      drawPrism(c,a.x,a.y,dx,dy,width,power);
      if (shard.high>.069) gleam(c,tip.x,tip.y,3.8*f.unit,core,power*(.58+.30*Math.sin(t*19+shard.phase)),.22);
    }
    const reflect=1-smooth(.24,.51,t);
    if (reflect>.01) {
      openingPoint(f,t,tip,true);
      c.globalAlpha=reflect*.65; softLight(c,tip.x,tip.y,27*f.unit,3.6*f.unit,accent,.77);
      c.strokeStyle=tint; c.lineWidth=.92*f.unit;
      for (let i=1;i<=19;i++) {
        const lag=i/19; openingPoint(f,t-.09*lag,a,true);
        const span=(2.1+4.5*(1-lag))*f.unit;
        c.globalAlpha=reflect*.58*(1-lag);
        c.beginPath(); c.moveTo(a.x-span,a.y); c.lineTo(a.x+span,a.y); c.stroke();
      }
    }
    c.restore();
  }
  const dust = [];
  for (let i = 0; i < count; i++) {
    const p = makeSpeck(rand);
    const u = i % 3 ? 1 - Math.sqrt(rand()) : rand();
    const a = rand() * TAU;
    const tier = (u * 8.2 + .17 * Math.cos(a * 3) + .12 * Math.sin(a * 5)) % 1;
    const r = radiusAt(u) * (.54 + .41 * Math.pow(1 - tier, .58) + rand() * .088);
    p.x = r * Math.cos(a); p.z = r * Math.sin(a);
    p.y = .026 + .94 * u - .016 * Math.sin(a * 3 + u * 11) * (1 - u);
    if (i % 5 !== 0 && i % 4 !== 1) {
      const layer = Math.floor(u * 8.2) / 8.2;
      const tip = 1 - rand() ** 1.9;
      const scallop = Math.cos(4 * a + 23 * layer) * .63 + Math.sin(7 * a - 4 * layer) * .37;
      const edge = radiusAt(layer) * (.38 + .61 * tip) * (.966 + .055 * scallop);
      p.x = edge * Math.cos(a); p.z = edge * Math.sin(a);
      p.y = .047 + layer * .93 + .100 * (1 - tip) ** 1.6 + .028 * scallop * tip + (rand() - .5) * .018;
      if (tip > .65) { p.tone = i % 3 ? 3 : 4; p.bright = .83 + rand() * .17; }
    }
    if (i % 5 === 0) {
      const angle = phase + u * turns * TAU + (rand() - .5) * .96;
      const edge = radiusAt(u) * (.975 + rand() * .093);
      p.x = edge * Math.cos(angle); p.z = edge * Math.sin(angle);
      p.y = .025 + .94 * u + (rand() - .5) * .018;
      p.tone = rand() < .78 ? 3 : 4; p.bright = .75 + .25 * rand();
    }
    p.u = clamp((p.y - .025) / .94,0,1);
    dust.push(p);
  }
  // 短小的枝脉在不同角度接住光，让树冠有起伏的枝尖。
  const ribs = [];
  for (let layer = 0; layer < 9; layer++) {
    const u = .045 + layer * .102;
    const branches = Math.round(17 - layer * .94);
    for (let j = 0; j < branches; j++) {
      const a = (j + .18 * layer) / branches * TAU + rand() * .09;
      const outer = radiusAt(u) * (.84 + .17 * rand());
      const curve = [];
      for (let k = 0; k < 7; k++) {
        const s = k / 6, theta = a + .38 * (1 - s);
        const r = outer * (.58 + .42 * s);
        curve.push({ x: r * Math.cos(theta), y: u + .074 * (1 - s) ** 2 + .024 * s * s,
          z: r * Math.sin(theta) });
      }
      ribs.push({ u, curve });
    }
  }
  const shards = Array.from({ length: 24 }, () => {
    const u = rand() * .89, a = rand() * TAU, r = radiusAt(u) * (.9 + rand() * .14);
    return { x: r * Math.cos(a), y: .045 + u * .95, z: r * Math.sin(a), phase: rand() * TAU, size: 2 + rand() * 4.3 };
  });
  const shades = [rgb(frost), rgb(deep), rgb(blend(accent, [73, 138, 166], .4)),
    "#fbffff", rgb(accent), "#d9f2f5", cold, core, tint, "#f4ffff"];
  function drawSky(f, opened) {
    const c = f.ctx;
    const far=1-smooth(.12,.92,f.shot), crest=Math.sin(Math.PI*smooth(.78,1,f.shot));
    const width=Math.max(f.w*1.06,f.rest.r*3.73)*(1+.11*far);
    const height=Math.min(f.rest.h*.70,width*.45);
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i=0;i<auroras.length;i++) {
      const drift = Math.sin(f.clock*(i ? .24 : .17) + i*2.4);
      const breathe = 1 + .034*Math.sin(f.clock*.19+i);
      c.globalAlpha=(.24+.35*opened+.18*crest)*(i?.89:1);
      const left=f.rest.cx-width*(.50+.064*drift)+f.rest.r*.075*far;
      const top=f.rest.base-f.rest.h*(1.25-i*.012-.25*far)+drift*f.rest.unit*7;
      c.drawImage(auroras[i],left,top,
        width,height*breathe);
    }
    c.restore();
  }
  function drawGroundWave(f, t, start) {
    const v = (t-start)/2.06;
    if (v <= 0 || v >= 1) return;
    const radius=.38+1.20*(1-(1-v)**2), level=groundLevel(f), arc=Math.sin(v*Math.PI);
    const c=f.ctx, alpha=arc**.68, q={};
    c.save(); c.globalCompositeOperation="lighter"; c.strokeStyle=tint;
    c.lineWidth=f.unit*.8; c.globalAlpha=alpha*.43;
    drawGroundArc(f,level,radius,waveCircle);
    for (const p of groundSparks) {
      const r=radius+p.shift, lift=arc*p.lift**2*.095*f.r/f.h;
      project(f,p.x*r,level+lift,p.z*r,q);
      c.globalAlpha=alpha*(.25+.63*p.lift);
      c.fillStyle=p.lift>.59 ? core : tint; c.fillRect(q.x,q.y,p.size*f.unit,p.size*f.unit);
      if (p.lift>.90) stamp(c,comet.glow,q.x,q.y,3.6*f.unit);
    }
    c.restore();
  }
  let flowers=[], previousShot=1, waveAt=null;
  function reset() {
    flowers=[]; previousShot=1; waveAt=null;
    for (const flake of crystals) flake.frozen=null;
  }
  function tap(f,point) {
    const flower={x:point.x,y:point.y,at:f.clock,angle:-Math.PI/2+.22*Math.sin(point.x*15+point.y*7),
      quiet:f.quiet,captures:[]};
    flowers=f.quiet ? [] : flowers.filter(a=>f.clock-a.at<2.1).slice(-4);
    flowers.push(flower);
    const centreX=point.x*f.w, centreY=point.y*f.height, reach=f.rest.r*.74;
    function catchNearby(p,q) {
      if (p.frozen) holdFlake(f,p,q);
      if (Math.hypot(q.x-centreX,q.y-centreY)<reach) {
        p.frozen={...q,x:q.x/f.w,y:q.y/f.height,at:f.clock};
        flower.captures.push({x:p.frozen.x,y:p.frozen.y,phase:(q.x*.37+q.y*.65)%TAU});
      }
    }
    for (const p of f.snow) catchNearby(p,snowPosition(f,p,8.5,{}));
    for (const p of crystals) catchNearby(p,fallingPosition(f,p,{}));
  }
  function overlay(f) {
    const c=f.ctx, s=f.rest.unit, radius=f.rest.r*.51;
    flowers=flowers.filter(p=>f.clock-p.at<2.1);
    for (const flower of flowers) {
      const age=f.clock-flower.at, still=flower.quiet;
      const grow=still?1:smooth(0,.45,age), breakUp=still?0:smooth(.53,1.34,age);
      const bright=(1-breakUp)*(still?.70:1)*(1-smooth(1.42,2.08,age));
      const x=flower.x*f.w, y=flower.y*f.height;
      c.save(); c.translate(x,y); c.lineCap="round"; c.lineJoin="round"; c.globalCompositeOperation="lighter";
      if (bright>.008) {
        c.globalAlpha=bright*(.38+.32*grow); stamp(c,comet.glow,0,0,radius*1.32);
        const path=new Path2D();
        for (let i=0;i<6;i++) {
          const a=flower.angle+i*TAU/6, dx=Math.cos(a), dy=Math.sin(a);
          const tip=grow*radius*(1+.037*Math.sin(2.2+i*3));
          path.moveTo(0,0); path.lineTo(dx*tip,dy*tip);
          for (let j=1;j<=4;j++) {
            const at=radius*(.12+j*.145);
            const reach=radius*(.30-j*.038)*smooth(at,at+radius*.23,tip);
            if (reach<=0) continue;
            for (const side of [-1,1]) {
              const b=a+side*.94, bx=dx*at, by=dy*at;
              path.moveTo(bx,by); path.lineTo(bx+Math.cos(b)*reach,by+Math.sin(b)*reach);
              if (j<4 && reach>radius*.09) {
                path.moveTo(bx+Math.cos(b)*reach*.56,by+Math.sin(b)*reach*.56);
                path.lineTo(bx+Math.cos(b)*reach*.56+dx*reach*.40,by+Math.sin(b)*reach*.56+dy*reach*.40);
              }
            }
          }
          const ring=radius*.20*smooth(.20,.48,grow), b=a+TAU/6;
          path.moveTo(dx*ring,dy*ring); path.lineTo(Math.cos(b)*ring,Math.sin(b)*ring);
          gleam(c,dx*tip,dy*tip,s*(2+3*grow),core,bright*.82,a);
        }
        c.globalAlpha=bright*.28; c.strokeStyle=rgb(mint); c.lineWidth=5.1*s; c.stroke(path);
        c.globalAlpha=bright*.90; c.strokeStyle=tint; c.lineWidth=1.75*s; c.stroke(path);
        c.globalAlpha=bright; c.strokeStyle="#f4ffff"; c.lineWidth=.75*s; c.stroke(path);
        gleam(c,0,0,9*s,core,bright,.22);
      }
      if (age>.47 && !still) {
        for (const flake of flower.captures) {
          const v=clamp((age-.48)/1.13,0,1);
          if (v<=0 || v>=1) continue;
          const startX=flake.x*f.w-x, startY=flake.y*f.height-y;
          const alpha=smooth(0,.06,v)*(1-smooth(.42,1,v));
          for (let k=0;k<4;k++) {
            const a=flake.phase+k*TAU/4;
            const dx=Math.cos(a)*radius*.29*Math.sin(v*1.65);
            const dy=Math.sin(a)*radius*.13*v-radius*(.47+.12*k)*v**1.35;
            c.globalAlpha=alpha*(k===0?.87:.63); c.strokeStyle=k%2?core:tint; c.lineWidth=s*(k===0?1.16:.76);
            c.beginPath(); c.moveTo(startX+dx*.96,startY+dy+v*s*3);
            c.lineTo(startX+dx,startY+dy); c.stroke();
            if (k===0) stamp(c,frostGlow,startX+dx,startY+dy,3.7*s);
          }
        }
        for (const p of splinters) {
          const v=clamp((age-.47-p.phase*.22)/1.36,0,1);
          if (v<=0 || v>=1) continue;
          const a=flower.angle+p.arm*TAU/6, arc=Math.sin(v*Math.PI), d=p.length*radius;
          const px=Math.cos(a)*d*(1+.27*v)+arc*p.drift*radius;
          const py=Math.sin(a)*d-radius*(p.lift*v**1.38+p.phase*.12*arc);
          const strength=smooth(0,.13,v)*(1-smooth(.48,1,v));
          c.globalAlpha=strength; c.fillStyle=p.arm%2?core:tint;
          c.fillRect(px,py,p.size*s,p.size*s);
          if (p.size>1.53) {
            stamp(c,frostGlow,px,py,p.size*s*3);
            gleam(c,px,py,p.size*s*2.3,core,strength*.86,a+v);
          }
        }
      }
      c.restore();
    }
  }
  function entrance(f) {
    const t=f.shot, c=f.ctx, q={}, tail={};
    const power=1-smooth(.914,1,t);
    if (power<.002) return;
    const route=(v,out)=>openingPoint(f,v,out);
    const span=mix(.125,.071,smooth(.18,.66,t));
    c.save(); c.globalCompositeOperation="lighter"; c.lineCap="round";
    // 冰棱把同一条彗尾分成蓝紫、薄荷两道细光，前端始终与结晶的枝尖相连。
    for (const side of [-1,1]) {
      c.beginPath();
      for (let i=0;i<=38;i++) {
        const lag=i/38, u=t-lag*span, offset=side*f.unit*(1.5+7*lag)*Math.sin(lag*Math.PI);
        openingPoint(f,u,q); openingPoint(f,u-.0018,tail);
        const dx=q.x-tail.x, dy=q.y-tail.y, length=Math.max(.001,Math.hypot(dx,dy));
        const x=q.x-dy/length*offset, y=q.y+dx/length*offset;
        if (i) c.lineTo(x,y); else c.moveTo(x,y);
      }
      c.strokeStyle=side<0?iceViolet:iceTurquoise;
      c.lineWidth=3.6*f.unit; c.globalAlpha=.18*power; c.stroke();
      c.lineWidth=.92*f.unit; c.globalAlpha=.79*power; c.stroke();
    }
    openingPoint(f,t,q);
    const size=f.rest.unit*(11+5*(1-smooth(.10,.48,t)));
    c.globalAlpha=power*.85; stamp(c,blueGlow,q.x,q.y,size*2.6);
    const seed=1-smooth(.17,.40,t);
    if (seed>.01) {
      c.save(); c.translate(q.x,q.y); c.rotate(.65+t*5.6);
      const facetWidth=size*(.58+.24*Math.cos(t*19));
      drawPrism(c,0,size*.68,0,-size*1.52,facetWidth,seed);
      c.restore();
    }
    gleam(c,q.x,q.y,size*1.22,core,power,.26);
    c.restore();
    drawComet(f,comet,t,span,route,power);
    const crown=smooth(.81,.926,t)*(1-smooth(.926,1,t));
    if (crown>.008) {
      project(f,0,1.006,0,q);
      c.save(); c.globalCompositeOperation="lighter"; c.globalAlpha=crown*.64;
      stamp(c,frostGlow,q.x,q.y,f.rest.r*.205);
      gleam(c,q.x,q.y,f.rest.r*.135,core,crown,.19);
      gleam(c,q.x,q.y,f.rest.r*.092,iceTurquoise,crown*.83,1.05);
      c.restore();
    }
  }
  function draw(f) {
    const c = f.ctx, q = {};
    const growth=openingGrowth(f.shot);
    const opened=(growth-landing)/(1-landing);
    const pulse=flowers.reduce((v,a)=>Math.max(v,Math.sin(Math.PI*clamp((f.clock-a.at)/1.46,0,1))),0);
    drawSky(f,opened+.82*pulse);
    drawGround(f);
    if (f.shot<.70) drawIceFloor(f);
    if (previousShot<.84 && f.shot>=.84) waveAt=f.clock;
    previousShot=f.shot;
    if (waveAt!==null) drawGroundWave(f,f.clock,waveAt);
    drawFallingField(f,crystals,false,.87);
    drawRibbon(f, ribbon, growth, false, 1.66, tint, core, 1);
    c.beginPath();
    for (const rib of ribs) {
      if (rib.u + .04 > growth) continue;
      rib.curve.forEach((p, i) => {
        project(f, p.x, p.y, p.z, q);
        if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y);
      });
    }
    c.strokeStyle=core; c.lineWidth=.57*f.unit; c.globalAlpha=.11+.14*pulse; c.stroke();
    c.globalCompositeOperation = "lighter";
    const iceFront=1-smooth(.79,.925,f.shot);
    for (const p of dust) {
      const behind=growth-p.u;
      const appearance=1-smooth(growth-.032,growth+.025,p.u);
      const wave=.95+.22*Math.max(0,1-Math.abs(behind)*9);
      if (iceFront>0 && behind<.045) {
        const frozen=smooth(-.115,.045,behind);
        if (frozen<.01) continue;
        const loose=(1-frozen)*iceFront, turn=winding*loose*(.58+p.cluster*.76);
        const spread=1+loose*(.23+.24*p.cluster);
        const x=(p.x*Math.cos(turn)+p.z*Math.sin(turn))*spread;
        const z=(p.z*Math.cos(turn)-p.x*Math.sin(turn))*spread;
        drawSpeck(f,p,x,p.y+loose*(.045+.065*p.kick),z,mix(appearance*wave,frozen*(1.14+.24*loose),iceFront));
      } else {
        drawSpeck(f,p,p.x,p.y,p.z,appearance*wave);
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    drawRibbon(f,ribbon,growth,true,1.66,tint,core,1);
    drawRibbon(f,filament,growth,true,.65,tint,core,.89);
    for (const p of shards) {
      if (p.y > growth) continue;
      project(f,p.x,p.y,p.z,q);
      const glint=(.5+.5*Math.sin(f.clock*1.58+p.phase))**4;
      if (q.z>-.16) gleam(c,q.x,q.y,p.size*f.unit*(.4+.8*glint),core,.14+.8*glint,.22);
    }
    const trace=(u,out)=>projectRibbonAt(f,ribbon,u,out);
    const chase=(f.clock*.128+.38)%1;
    const idle=smooth(.90,1,f.shot);
    drawComet(f,comet,chase,.138,trace,idle*smooth(0,.09,chase)*(1-smooth(.91,1,chase)));
    const light=smooth(.94,1,growth);
    project(f,0,1.006,0,q);
    facetedStar(f,q.x,q.y,f.r*.116,f.yaw-winding*f.clock*.21,light,shades);
    c.globalAlpha = 1;
    drawFallingField(f,crystals,true,.98);
    return .18 + .82 * smooth(.64, .99, growth);
  }
  return {
    seed,inks,draw,reset,tap,overlay,entrance,action:"轻点在指尖结出六枝冰花",
    camera:{zoom:.65,pullbackEnd:.36,focus:.19,pan:-.20,lift:-.105,pitch:.070,direction:winding},
    cues:[{at:1.18,x:.65,y:.53},{at:5.40,x:.39,y:.58}],
    sparkColor:mint,clouds:true,speed:-winding*.137,initialAngle:.08,drift:8.5,snowCount:74,
    sky: { base: "#050b14", air: blend(accent, [12, 39, 60], .81), star: frost,
      stars: 1.16, rings: [.92, 1.14, 1.39, 1.66], spread: .054 }
  };
}
