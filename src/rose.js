// ── 玫瑰星愿：同一组粒子在心形和树形之间流动 ──────────────
function makePetal(light, base, rim) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 80;
  const c = tile.getContext("2d");
  const silk = c.createLinearGradient(16,14,59,68);
  silk.addColorStop(0,rgb(rim)); silk.addColorStop(.20,rgb(light));
  silk.addColorStop(.57,rgb(base)); silk.addColorStop(.81,rgb(blend(base,[76,12,51],.48)));
  silk.addColorStop(1,rgb(rim));
  c.fillStyle = silk;
  c.beginPath(); c.moveTo(62,66);
  c.bezierCurveTo(53,59,19,56,13,32); c.bezierCurveTo(7,14,19,9,30,15);
  c.bezierCurveTo(42,13,51,12,56,22); c.bezierCurveTo(67,37,56,55,62,66); c.fill();
  c.beginPath(); c.moveTo(15,26); c.bezierCurveTo(24,42,45,37,62,66);
  c.strokeStyle = rgb(rim,.75); c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.moveTo(16,20); c.quadraticCurveTo(21,13,30,17);
  c.strokeStyle = rgb(ivory,.84); c.lineWidth = 1.55; c.stroke();
  return tile;
}
// 光核在左、尾端在右。宽幅色晕包住细亮芯，末段分成两缕渐隐的光丝。
function makeMeteorPaint(hue) {
  const tile=document.createElement("canvas");
  tile.width=320; tile.height=48;
  const c=tile.getContext("2d"), mid=tile.height/2;
  const tint=c.createLinearGradient(0,0,tile.width,0);
  tint.addColorStop(0,rgb(blend(hue,[255,249,246],.66)));
  tint.addColorStop(.18,rgb(hue,.98)); tint.addColorStop(.55,rgb(hue,.69));
  tint.addColorStop(.83,rgb(hue,.26)); tint.addColorStop(1,rgb(hue,0));
  c.fillStyle=tint;
  for (const [width,alpha] of [[22,.12],[12,.24],[5.3,.56],[2.45,.94]]) {
    c.globalAlpha=alpha; c.beginPath(); c.moveTo(0,mid);
    c.bezierCurveTo(10,mid-width,118,mid-width*.41,320,mid);
    c.bezierCurveTo(122,mid+width*.37,8,mid+width,0,mid); c.fill();
  }
  c.strokeStyle=tint; c.globalAlpha=.31; c.lineWidth=1.3;
  for (const side of [-1,1]) {
    c.beginPath(); c.moveTo(8,mid);
    c.bezierCurveTo(86,mid+2*side,179,mid+10*side,250,mid+7*side);
    c.quadraticCurveTo(288,mid+6*side,319,mid+11*side); c.stroke();
  }
  const mist=document.createElement("canvas");
  mist.width=80; mist.height=40;
  softLight(mist.getContext("2d"),40,20,40,20,hue,.59);
  return {tail:tile,mist,glow:makeGlow(hue),ink:rgb(hue)};
}
function createScene(accent, count, treeAccent = accent) {
  const seed = 271211, rand = randomFrom(seed);
  const pearl=blend(accent,[250,243,248],.80), gold=blend(accent,[255,222,166],.84);
  const white=blend(pearl,[248,245,246],.58);
  const treePearl = blend(treeAccent, ivory, .64);
  const treeTint = rgb(treeAccent), treeCore = rgb(treePearl);
  // 变形时按每颗粒子的进度选取颜色，笔刷只在场景创建时生成。
  const materials = [0, .25, .5, .75, 1].map(amount => {
    const body = blend(accent, treeAccent, amount);
    const crown = blend(pearl, treePearl, amount);
    const shadow = blend([99, 35, 81], [113, 81, 43], amount);
    const tones = [blend(body, shadow, .54), body, blend(body, crown, .44), crown, blend(white, ivory, amount)];
    const inks = tones.map(tone => rgb(tone));
    return {
      body: { inks, brushes: makeDustBrushes(body), glow: makeGlow(body) },
      crown: { inks, brushes: makeDustBrushes(crown), glow: makeGlow(crown) }
    };
  });
  const pearlGlow = materials[0].crown.glow;
  const lampColor=[255,231,179], lampGlow=makeGlow([255,222,161]);
  const lampInk=rgb(lampColor), lampCore=rgb([255,250,222]);
  const radiusAt = u => Math.pow(1 - u, .86);
  const turns = 3.45, phase = 1.65;
  const ribbon = makeRibbon(turns, phase, u => radiusAt(u) * 1.045);
  const hem = makeRibbon(turns, phase + .105, u => radiusAt(u) * (1.065 + .038 * Math.sin(u * TAU * 4)),
    u => .037 + u * .931);
  const tint = rgb(accent), thread = rgb(gold), core = rgb(pearl);
  const fx = randomFrom(seed + 705);
  const plum = blend(accent,[116,22,82],.64);
  const petalTiles = [makePetal(pearl,accent,pearl),makePetal(accent,plum,pearl),
    makePetal(gold,blend(gold,accent,.45),ivory)];
  const petals = makeFallingField(fx,Math.round(17+count/124),petalTiles,8.2,.071);
  const roseComet = makeComet(fx,Math.round(43 + count / 64),accent,pearl);
  const goldComet = makeComet(fx,Math.round(34 + count / 82),gold,ivory);
  const orbit = makeRibbon(2.32,-1.10,u => (1-u) ** .76 * 1.17 + .046);
  const outer = makeRibbon(-1.90,2.18,u => (1-u) ** .73 * 1.085 + .043);
  const dust=[], roseGrains=[], pearlGrains=[], material=randomFrom(seed+227);
  const heartCurve = a => ({
    x: Math.sin(a) ** 3, y: (13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a)) / 16 + .14
  });
  const boundary=[{length:0,...heartCurve(0)}];
  for (let i=1;i<=320;i++) {
    const prev=boundary[i-1], next=heartCurve(i*TAU/320);
    boundary.push({...next,length:prev.length+Math.hypot(next.x-prev.x,next.y-prev.y)});
  }
  const rimPoints=Array.from({length:640},(_,i)=>{
    const distance=boundary[320].length*i/640;
    const hi=boundary.findIndex(p=>p.length>=distance), a=boundary[Math.max(0,hi-1)], b=boundary[hi];
    const k=(distance-a.length)/Math.max(.00001,b.length-a.length);
    return {x:mix(a.x,b.x,k),y:mix(a.y,b.y,k)};
  });
  for (let i = 0; i < count; i++) {
    const p = makeSpeck(rand);
    // 上枝多分一些细尘，宽阔的下摆仍有一半采样向树脚集中。
    const heightSample=rand(), stratum=i%8;
    const u=stratum<2 ? Math.sqrt(heightSample) : stratum<4 ? heightSample : 1-Math.sqrt(heightSample);
    const band = rand() < .26;
    const a = band ? phase + u * turns * TAU + (rand() - .5) * .78 : rand() * TAU;
    const pleat = .5 + .5 * Math.cos(u * TAU * 7 + .75 * Math.sin(3 * a) + a * .56);
    let r = radiusAt(u) * (.56 + .38 * pleat ** .72 + rand() * .09);
    if (band) r = radiusAt(u) * (1.015 + (rand() - .5) * .08);
    p.x = Math.cos(a) * r;
    p.z = Math.sin(a) * r;
    p.y = .025 + u * .94 - (band ? 0 : .016 * (1 - u) * Math.cos(a * 3));
    if (!band && i%3!==0 && (u<.82 || i%2===0)) {
      const tier = Math.floor(u * 8) / 8;
      const tip = 1 - rand() ** 1.75;
      const lobe = Math.cos(a * 5 + tier * 17);
      const edge = radiusAt(tier) * (.36 + .62 * tip) * (.97 + .052 * lobe);
      p.x = edge * Math.cos(a); p.z = edge * Math.sin(a);
      p.y = .046 + tier * .931 + .11 * (1 - tip) ** 1.3 + .017 * Math.sin(a * 3 + tier * 21)
        + .019 * tip * lobe + (rand() - .5) * .016;
      if (tip > .74) { p.bright = .76 + rand() * .24; p.tone = i % 3 ? 2 : 3; }
    }
    p.y+=.025*smooth(.81,.98,u);
    p.ribbonU=band ? u : -1;
    if (band) { p.tone = rand() < .64 ? 4 : 3; p.bright = .65 + .35 * rand(); }
    const edge = rand() < .47;
    if (edge) {
      const rim=rimPoints[Math.floor(rand()*rimPoints.length)], inset=1.052+(rand()-.5)*.053;
      p.hx=rim.x*inset; p.hy=rim.y*inset;
    } else {
      let x,y,angle;
      do {
        x=rand()*2-1; y=rand()*1.86-.93; angle=Math.asin(Math.cbrt(x));
      } while (y>heartCurve(angle).y || y<heartCurve(Math.PI-angle).y);
      p.hx=x*1.047; p.hy=y*1.047;
    }
    const hx=clamp(p.hx/1.052,-1,1), angle=Math.asin(Math.cbrt(hx));
    const ceiling=heartCurve(angle).y, floor=heartCurve(Math.PI-angle).y;
    const at=clamp((p.hy/1.052-floor)/Math.max(.001,ceiling-floor),0,1);
    const thickness=.56*(1-hx*hx)**.58*Math.sin(Math.PI*at)**.64;
    p.hz=edge?(rand()-.5)*.085:(rand()<.5?-1:1)*thickness*(.56+.44*rand());
    p.edge = edge;
    const crown=smooth(.43,.92,p.y);
    const pale=material()<.075+.69*crown+.08*smooth(.22,.87,p.hy)+(band?.10:0);
    if (pale) {
      p.tone=material()<.50+crown*.30 ? 4 : 3;
      p.bright=.14+.76*p.bright;
    } else if (p.tone===4) p.tone=2;
    p.crown=crown; p.size*=1-.19*crown;
    p.delay=0;
    dust.push(p);
    (pale?pearlGrains:roseGrains).push(p);
  }
  // 灯锚在真实枝点上，变形时跟着同一颗粒子飞到爱心中的位置。
  const lamps=[], lampCount=Math.round(6+count*.0054);
  for (let i=0;i<lampCount;i++) {
    const u=.065+.83*(i+.5)/lampCount, a=phase+i*2.39996, r=radiusAt(u)*.94;
    const x=Math.cos(a)*r, z=Math.sin(a)*r, y=.025+.94*u;
    let best, distance=Infinity;
    for (const p of dust) {
      const d=(p.x-x)**2+(p.z-z)**2+5*(p.y-y)**2;
      if (!p.lamp && d<distance) { best=p; distance=d; }
    }
    best.lamp={size:1.50+material()*.85, phase:material()*TAU};
    lamps.push(best.lamp);
  }
  function drawLamps(f,tree,visibility) {
    const c=f.ctx;
    c.save();
    for (const lamp of lamps) {
      const near=smooth(-.64,.30,lamp.z);
      const breathe=.84+.16*Math.sin(f.clock*1.43+lamp.phase);
      const light=visibility*(.68+.32*tree)*(.29+.71*near)*breathe;
      const r=f.unit*lamp.size*(.94+.18*near);
      c.globalAlpha=light; stamp(c,lampGlow,lamp.x,lamp.y,r*5.5);
      c.fillStyle=lampInk; c.beginPath(); c.arc(lamp.x,lamp.y,r,0,TAU); c.fill();
      c.fillStyle=lampCore; c.beginPath(); c.arc(lamp.x-r*.08,lamp.y-r*.10,r*.59,0,TAU); c.fill();
      gleam(c,lamp.x,lamp.y,r*3.05,lampCore,light*(.33+.37*near),.20);
    }
    c.restore();
  }
  const heartLine = Array.from({ length: 201 }, (_, i) => heartCurve(i / 200 * TAU));
  const threads = Array.from({ length: 42 }, (_, i) => {
    const x = -.974 + 1.948 * (i + rand() * .7) / 42;
    const angle = Math.asin(Math.cbrt(x));
    const upper = heartCurve(angle).y, lower = heartCurve(Math.PI-angle).y;
    return { x, top: Math.max(upper,lower), bottom: mix(Math.max(upper,lower), Math.min(upper,lower), .26 + rand() * .72),
      phase: rand(), speed: .09 + rand() * .12 };
  });
  const shells = Array.from({ length: 104 }, (_, i) => {
    const angle = i / 104 * TAU + fx() * .06, ring = i % 3;
    return { angle, reach: (.53 + ring*.22 + .21*Math.cos(angle*5 + ring*.74))*(.86 + fx()*.26),
      speed: .73 + fx() * .49, curl: (fx() - .5) * .58, pale: fx() > .63, split: i % 7 === 2 };
  });
  function firework(f, t, start, side, scale) {
    const age = (t - start) / 2.08;
    if (age <= 0 || age >= 1) return;
    const light = smooth(0,.14,age) * (1 - smooth(.51,1,age));
    const x = f.cx + side * Math.min(f.r * 1.13, f.w * .305);
    const y = f.base - f.h * (side > 0 ? .80 : .90);
    const r = f.r * .405 * scale, c = f.ctx;
    const glow = side < 0 ? roseComet.glow : goldComet.glow;
    c.save(); c.globalCompositeOperation = "lighter"; c.lineCap = "round";
    c.globalAlpha = light*.17; stamp(c,glow,x,y,r*.86);
    for (const s of shells) {
      c.strokeStyle = s.pale ? core : side < 0 ? tint : thread;
      c.lineWidth = (s.pale ? .80 : .57) * f.unit;
      c.beginPath();
      for (let k = 0; k < 5; k++) {
        const v = Math.max(0,age - (4-k) * .039);
        const d = r * s.reach * (1 - (1-v) ** 3.15), a = s.angle + s.curl * v;
        const px = x + Math.cos(a)*d, py = y + Math.sin(a)*d + v*v*r*.40*s.speed;
        if (k) c.lineTo(px,py); else c.moveTo(px,py);
        if (k === 4) {
          c.globalAlpha = light; stamp(c,glow,px,py,(s.pale ? 4.4 : 2.9)*f.unit);
          if (s.split && age>.25) {
            const fork=(age-.25)*r*.37;
            for (const sign of [-1,1]) {
              const b=a+sign*.84;
              stamp(c,glow,px+Math.cos(b)*fork,py+Math.sin(b)*fork+age*fork*.25,2.25*f.unit);
            }
          }
        }
      }
      c.globalAlpha = light * .76; c.stroke();
    }
    c.restore();
  }
  const skyRand=randomFrom(seed+1883), grainRand=randomFrom(seed+1884);
  const meteorTints=[white,blend(accent,white,.43),blend(gold,white,.44)];
  const meteorPaint=meteorTints.map(makeMeteorPaint);
  const waveSpacing=2.65, waveCount=12, skyPeriod=waveCount*waveSpacing;
  const meteors=[];
  for (let wave=0;wave<waveCount;wave++) {
    const members=wave%3===1 ? 3 : 2, spacing=.32+skyRand()*.20;
    for (let i=0;i<members;i++) {
      // 近景的长流星隔一阵才出现一次，交替从树梢左右的留白划过。
      const lead=wave%2===0 && i===(wave/2)%members;
      const depth=lead ? .84+.16*skyRand() : .12+.52*skyRand();
      const angle=(lead ? .15 : .21)+(lead ? .12 : .23)*skyRand();
      const flight=1.26+.52*depth+.24*skyRand(), trainLife=.69+.45*depth;
      const travel=.46+.38*depth+.08*skyRand();
      const x=lead ? (wave%4===0 ? .25 : .73)+.065*skyRand() : (i+.14+.72*skyRand())/members;
      const y=lead ? .12+.18*skyRand() : .075+.45*skyRand()**1.32;
      const paint=meteorPaint[i===1 && wave%3===0 ? 2 : (wave+i)%3===0 ? 1 : 0];
      const total=Math.round((29+51*depth)*(.73+.27*count/4600));
      const packets=Math.ceil(total/4), phase=skyRand(), wake=[];
      let duration=flight+trainLife;
      for (let j=0;j<packets;j++) {
        const born=flight*(.025+.93*(j+.18+.57*grainRand())/packets);
        const life=1.32+.75*depth+.37*grainRand(), roll=phase*TAU+born/flight*7.4;
        const grains=Array.from({length:Math.min(4,total-j*4)},()=>({
          delay:flight/packets*.38*grainRand(), life:life*(.80+.29*grainRand()),
          side:grainRand()*2-1, carry:.034+.087*grainRand(),size:.58+1.56*grainRand()**2
        }));
        wake.push({born,life,roll,grains});
        duration=grains.reduce((end,p)=>Math.max(end,born+p.delay+p.life),Math.max(duration,born+life));
      }
      meteors.push({at:wave*waveSpacing+i*spacing+skyRand()*.14,flight,trainLife,duration,depth,
        angle,dx:Math.cos(angle),dy:Math.sin(angle),x,y,travel,paint,wake,phase});
    }
  }
  // 在当前投影中给主体留出柔和的暗部，变形时在两个轮廓之间平滑过渡。
  function meteorSkyLight(f,m,tree,along) {
    const x=m.x*f.w+along*m.dx-f.cx, y=m.y*f.height-along*m.dy;
    const u=clamp((f.base-y)/f.h,0,1), edge=f.r*(.12+radiusAt(u));
    const top=f.base-f.h, feather=f.r*.31;
    const canopy=(1-smooth(edge,edge+feather,Math.abs(x)))*
      smooth(top-feather,top+feather*.40,y)*(1-smooth(f.base,f.base+feather,y));
    const heartDistance=Math.hypot(x/(f.r*1.10),(y-f.base+f.h*.51)/f.r);
    const heart=1-smooth(.89,1.35,heartDistance);
    return 1-.66*mix(heart,canopy,tree);
  }
  // 每一粒余尘在星核经过时释放，随后只带少量前冲速度。位置和淡出都取自播放时钟。
  function drawMeteorDust(f,m,tree,elapsed,travel,speed,fan) {
    const c=f.ctx, unit=f.rest.unit;
    c.fillStyle=m.paint.ink;
    for (const packet of m.wake) {
      const age=elapsed-packet.born;
      if (age<=0) continue;
      const origin=(.5-packet.born/m.flight)*travel;
      const skyLight=meteorSkyLight(f,m,tree,origin);
      const v=Math.min(1,age/packet.life), curl=fan*.27*v*Math.sin(packet.roll+2.45*v);
      if (v<1) {
        const x=origin-speed*.050*(1-Math.exp(-2.55*age));
        const rx=travel/m.wake.length*(.94+.48*v), ry=unit*1.35+fan*(.040+.19*v);
        c.globalAlpha=smooth(0,.14,age)*(1-smooth(.10,1,v))*(.12+.095*m.depth)*skyLight;
        c.drawImage(m.paint.mist,x-rx,curl-ry,rx*2,ry*2);
      }
      for (const p of packet.grains) {
        const lived=age-p.delay;
        if (lived<=0 || lived>=p.life) continue;
        const progress=lived/p.life, opening=progress*(1.47-.47*progress);
        const along=origin-speed*(p.delay+p.carry*(1-Math.exp(-2.55*lived)));
        const cross=curl+fan*opening*p.side+unit*3.5*progress*progress;
        const light=smooth(0,.10,lived)*(1-smooth(.11,1,progress))*(.44+.29*m.depth)*skyLight;
        const size=unit*p.size*(.67+.38*m.depth)*(1-.25*progress);
        if (p.size>1.48) {
          c.globalAlpha=light*.72;
          stamp(c,m.paint.glow,along,cross,size*(2.36+.35*(1-progress)));
        }
        c.globalAlpha=light; c.fillRect(along-size*.72,cross-size*.40,size*(1.55-.41*progress),size*.80);
      }
    }
  }
  function drawMeteorShower(f,tree) {
    const c=f.ctx, unit=f.rest.unit, span=Math.min(f.w,f.height*1.08);
    const now=(f.clock+.94)%skyPeriod;
    c.save(); c.globalCompositeOperation="lighter";
    for (const m of meteors) {
      const elapsed=(now-m.at+skyPeriod)%skyPeriod;
      if (elapsed<=0 || elapsed>=m.duration) continue;
      const travel=span*m.travel, speed=travel/m.flight;
      const emittedUntil=Math.min(elapsed,m.flight), progress=emittedUntil/m.flight;
      const after=elapsed-emittedUntil, headX=(.5-progress)*travel;
      c.save(); c.translate(m.x*f.w,m.y*f.height); c.rotate(-m.angle);
      const fan=span*(.043+.073*m.depth);
      drawMeteorDust(f,m,tree,elapsed,travel,speed,fan);
      // 刚飞过的轨迹形成亮带。星核熄灭后，先释放的那段最早消散。
      if (after<m.trainLife) {
        const oldest=Math.max(0,elapsed-m.trainLife), length=(emittedUntil-oldest)*speed;
        const headRoom=meteorSkyLight(f,m,tree,headX);
        const trailRoom=Math.min(headRoom,meteorSkyLight(f,m,tree,headX+length*.42));
        const strength=smooth(0,.15,elapsed)*(.46+.31*m.depth)*trailRoom*
          (1-.56*smooth(.79,1,progress))*(1-smooth(0,m.trainLife,after));
        const width=unit*(2.6+3.90*m.depth)*(1+.40*after/m.trainLife);
        c.globalAlpha=strength;
        c.drawImage(m.paint.tail,headX,-width,length,width*2);
        for (let i=0;i<2;i++) {
          const pulse=(m.phase+elapsed*.73+i*.50)%1;
          const centre=headX+length*pulse, reach=length*(.087+.045*m.depth);
          c.globalAlpha=strength*Math.sin(Math.PI*pulse)**2*(.47-.23*pulse);
          c.drawImage(m.paint.glow,centre-reach,-width*.43,reach*2,width*.86);
        }
        const headLight=smooth(0,.12,progress)*(1-smooth(.80,1,progress))*(.50+.38*m.depth)*headRoom;
        if (headLight>.005) {
          const glow=unit*(4.2+5.4*m.depth);
          c.globalAlpha=headLight; stamp(c,m.paint.glow,headX,0,glow);
          gleam(c,headX,0,glow*.65,m.paint.ink,headLight*(.46+.31*m.depth),m.angle+.17);
        }
      }
      c.restore();
    }
    c.restore();
  }
  function backdrop(c, f, random) {
    // 天顶的珍珠色细星只在尺寸变化时画一次，给近处较长的流星留出暗部。
    softLight(c,f.cx-f.r*.92,f.height*.22,Math.max(f.w*.32,f.r*1.7),f.height*.19,
      blend(accent,[103,70,143],.69),.16);
    softLight(c,f.cx+f.r*.84,f.height*.38,Math.max(f.w*.29,f.r*1.27),f.height*.15,accent,.061);
    const stars=Math.round(clamp(f.w*f.height/850,140,1150)*(.72+.28*count/4600));
    for (let i=0;i<stars;i++) {
      const x=random()*f.w, y=random()**1.43*f.height, power=random()**2;
      const fade=1-.85*smooth(.44,.90,y/f.height);
      const size=(.45+power*1.15)*f.unit, ink=i%9===0 ? thread : i%4===0 ? tint : core;
      c.globalAlpha=(.20+.58*power)*fade; c.fillStyle=ink;
      c.fillRect(x,y,size,size);
      if (i%23===0 && power>.40) {
        stamp(c,pearlGlow,x,y,size*2.9);
        gleam(c,x,y,size*2.47,ink,fade*.61,.17);
      }
    }
    c.globalAlpha=1;
    const span = Math.max(f.w*.55,f.r*1.54);
    const dustHaze=blend(accent,[107,78,134],.57);
    for (let i=0;i<11;i++) {
      const u=(i-5)/5, y=f.base-f.h*(.71+.26*u+.075*Math.sin(u*4.6));
      softLight(c,f.cx+span*u,y,span*.31,f.h*(.07+.035*Math.cos(i*1.6)),dustHaze,.042);
    }
    for (let i = 0; i < 1150; i++) {
      const u = random()*2-1, spread = (random()+random()+random()-1.5)*.13;
      const x = f.cx + span*u, y = f.base - f.h*(.71 + .26*u + .075*Math.sin(u*4.6) + spread);
      const size = (.31 + random() ** 3 * .96)*f.unit;
      c.fillStyle = rgb(i%4 ? accent : gold,(.08 + random()*.30) * (.52 + .48*Math.abs(u)));
      c.fillRect(x,y,size,size);
    }
  }
  let form, morph, queued, celebration, settledAt;
  const morphSeconds=2.8;
  let groundBasis, lastHeartBasis, lastTreeWeight;
  function reset() {
    form=0; morph=null; queued=null; celebration=-Infinity; settledAt=null;
    groundBasis=0; lastHeartBasis=0; lastTreeWeight=0;
  }
  function heartBasis(f) {
    const t=settledAt===null?0:Math.max(0,f.clock-settledAt);
    return f.autoAngle-.34*(t-1+Math.exp(-t));
  }
  function still() {
    if (morph) form=queued?morph.from:morph.to;
    morph=null; queued=null; celebration=-Infinity;
  }
  function heartbeat(clock) {
    const beat=(clock*.76)%1;
    return 1+.027*Math.exp(-((beat-.16)**2)/.006)+.011*Math.exp(-((beat-.34)**2)/.008);
  }
  function startMorph(f,point) {
    const basis=heartBasis(f), q={}, cos=Math.cos(basis), sin=Math.sin(basis), beat=heartbeat(f.clock);
    let closest=Infinity, farthest=0;
    for (const p of dust) {
      if (form) project(f,p.x,p.y,p.z,q);
      else project(f,(p.hx*cos-p.hz*sin)*beat,.51+p.hy*f.r/f.h*beat,(p.hx*sin+p.hz*cos)*beat,q);
      p.delay=Math.hypot(q.x-point.x*f.w,q.y-point.y*f.height);
      closest=Math.min(closest,p.delay); farthest=Math.max(farthest,p.delay);
    }
    for (const p of dust) p.delay=(p.delay-closest)/Math.max(1,farthest-closest)*.43;
    morph={from:form,to:1-form,at:f.clock};
    celebration=-Infinity;
  }
  function advance(f) {
    if (!morph || f.clock-morph.at<morphSeconds) return;
    form=morph.to; morph=null;
    if (form) celebration=f.clock;
    if (queued) { const next=queued; queued=null; startMorph(f,next); }
  }
  function tap(f,point) {
    advance(f);
    if (f.quiet) {
      const target=morph ? (queued ? morph.from : morph.to) : form;
      form=1-target; morph=null; queued=null; celebration=-Infinity;
    } else if (morph) queued=queued?null:point;
    else startMorph(f,point);
  }
  function entrance(f) {
    const power=1-smooth(.30,.70,f.shot);
    if (power<.01) return;
    for (let arm=0;arm<2;arm++) {
      const route=(u,out)=>{
        const a=u*4.7+arm*Math.PI, r=1.18-.56*u;
        return project(f,Math.cos(a)*r,.30+u*.28+.13*Math.sin(a),Math.sin(a)*r,out);
      };
      drawComet(f,arm?goldComet:roseComet,.24+f.shot,.18,route,power*(arm?.76:.92));
    }
  }
  function drawBurstStreams(f,progress) {
    if (!morph) return;
    const power=Math.sin(progress*Math.PI)**1.22;
    const radius=Math.min(1.61,f.w*.51/f.r);
    for (let arm=0;arm<3;arm++) {
      const route=(u,out)=>{
        const flight=Math.sin(clamp(u,0,1)*Math.PI);
        const a=arm*TAU/3+u*(morph.to?5.7:-5.7), r=flight*(radius-arm*.105);
        return project(f,Math.cos(a)*r,.29+.48*u+Math.sin(a+.3)*.155*flight,Math.sin(a)*r,out);
      };
      drawComet(f,arm===1?goldComet:roseComet,progress,.17,route,power*(arm===2?.73:1));
    }
  }
  // 两道光沿缎带向上游走。光扫过的枝点用同一相位变亮，背面随深度减弱。
  function drawRibbonFlow(f,head,silk) {
    const c=f.ctx, last={}, q={};
    c.save(); c.globalCompositeOperation="lighter"; c.lineCap="round";
    for (let i=0;i<2;i++) {
      const end=(head+i*.50)%1, span=.077;
      const power=silk*smooth(0,.055,end)*(1-smooth(.955,1,end));
      projectRibbonAt(f,ribbon,end,last);
      const near=smooth(-.26,.38,last.z);
      c.globalAlpha=power*(.32+.61*near); stamp(c,pearlGlow,last.x,last.y,9.5*f.unit);
      for (let k=1;k<=21;k++) {
        const lag=k/21, u=end-lag*span;
        if (u<0) break;
        projectRibbonAt(f,ribbon,u,q);
        const strength=power*(1-lag)**1.5*(.12+.88*smooth(-.26,.38,q.z));
        c.beginPath(); c.moveTo(last.x,last.y); c.lineTo(q.x,q.y);
        c.strokeStyle=i ? thread : treeTint; c.lineWidth=(3.0+3.8*(1-lag))*f.unit;
        c.globalAlpha=strength*.18; c.stroke();
        c.strokeStyle=treeCore; c.lineWidth=(.53+1.48*(1-lag))*f.unit;
        c.globalAlpha=strength*.78; c.stroke();
        last.x=q.x; last.y=q.y;
      }
    }
    c.restore();
  }
  function draw(f) {
    const c = f.ctx, q = {};
    if (f.shot===1 && settledAt===null) settledAt=f.clock;
    advance(f);
    const progress=morph ? clamp((f.clock-morph.at)/morphSeconds,0,1) : 1;
    const tree=morph ? mix(morph.from,morph.to,smooth(0,1,progress)) : form;
    const heart=(1-smooth(.04,.66,tree))*smooth(.43,.89,f.shot);
    const basis=heartBasis(f), hcos=Math.cos(basis), hsin=Math.sin(basis);
    // 爱心和树的转速不同。只累计本帧的角度差，长时间自转后切换也能连续。
    groundBasis+=(basis-lastHeartBasis)*(1-(lastTreeWeight+tree)*.5);
    lastHeartBasis=basis; lastTreeWeight=tree;
    drawMeteorShower(f,tree);
    drawGround(f,f.yaw-groundBasis);
    const beat=heartbeat(f.clock), heartScale=f.r/f.h*beat;
    const petalsIn=smooth(.40,.92,f.shot);
    drawFallingField(f,petals,false,.86*petalsIn);
    if (heart > .01) {
      c.beginPath();
      heartLine.forEach((p, i) => {
        project(f, p.x * 1.052 * hcos*beat, .51 + p.y * heartScale * 1.052, p.x * 1.052 * hsin*beat, q);
        if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y);
      });
      c.strokeStyle = tint; c.lineWidth = f.unit * 4.8; c.globalAlpha = .14 * heart; c.stroke();
      c.strokeStyle = core; c.lineWidth = f.unit * .86; c.globalAlpha = .75 * heart; c.stroke();
      const end = {};
      c.beginPath();
      for (const v of threads) {
        project(f,v.x*1.05*hcos,.51+v.top*heartScale*1.05,v.x*1.05*hsin,q);
        project(f,v.x*1.05*hcos,.51+v.bottom*heartScale*1.05,v.x*1.05*hsin,end);
        c.moveTo(q.x,q.y); c.lineTo(end.x,end.y);
      }
      c.lineWidth = .55 * f.unit; c.strokeStyle = tint; c.globalAlpha = .18 * heart; c.stroke();
      c.fillStyle = core; c.globalAlpha = .62 * heart;
      for (const v of threads) {
        const y = mix(v.top,v.bottom,(f.clock*v.speed+v.phase)%1);
        project(f,v.x*1.05*hcos,.51+y*heartScale*1.05,v.x*1.05*hsin,q);
        c.fillRect(q.x,q.y,.77*f.unit,1.55*f.unit);
      }
      c.globalAlpha = 1;
    }
    const silk = smooth(.26,.97,tree), flowHead=(f.clock*.096+.14)%1;
    const gathering=1-smooth(.14,.85,f.shot);
    const burstRadius=Math.min(1.72,f.w*.52/f.r);
    drawRibbon(f, ribbon, 1, false, 1.5, treeTint, treeCore, silk);
    drawRibbon(f, outer, 1, false, .68, thread, treeCore, silk * .45);
    const shaping=Boolean(morph) || gathering>0;
    for (const grains of [roseGrains,pearlGrains]) {
      // 主色细尘叠光，高光细粒用透明度覆盖，树梢能看见单颗粒的边缘。
      const pale = grains === pearlGrains;
      c.globalCompositeOperation=pale ? "source-over" : "lighter";
      for (const p of grains) {
        const hx=(p.hx*hcos-p.hz*hsin)*beat, hz=(p.hx*hsin+p.hz*hcos)*beat;
        const hy=.51+p.hy*heartScale;
        let weight=form, swirl=0, x=form?p.x:hx, y=form?p.y:hy, z=form?p.z:hz;
        if (shaping) {
          if (morph) weight=mix(morph.from,morph.to,smooth(p.delay,p.delay+.57,progress));
          swirl=(4*weight*(1-weight))**.72;
          const wind=(p.kick<0?0:Math.PI)+p.y*6.4+weight*5.3+gathering*2.4;
          const radius=burstRadius*(.58+.46*p.cluster)+.11*p.kick;
          const scatter=gathering*(.55+1.21*p.cluster), dx=Math.sin(wind), dz=Math.cos(wind);
          x=mix(mix(hx,p.x,weight),dx*radius,swirl)+dx*scatter;
          z=mix(mix(hz,p.z,weight),dz*radius,swirl)+dz*scatter;
          const mid=.22+.62*p.y+.12*Math.cos(wind+.3)+.084*p.kick;
          y=mix(mix(hy,p.y,weight),mid,swirl)+gathering*(p.y-.44)*.88;
        }
        const shimmer=p.ribbonU<0 ? 0 : silk*(1-smooth(0,.077,(flowHead-p.ribbonU+1)%.5));
        const light=((p.edge?1.06:.94)+swirl*.21+shimmer*.31)*(1-(pale?.14:.29)*p.crown*weight);
        const grain=mix(p.edge?.19:.42,pale?.62:.78,weight);
        const material = materials[Math.round(weight * (materials.length - 1))];
        drawSpeck(f, p, x, y, z, light, grain + swirl * .28, pale ? material.crown : material.body);
        if (p.lamp) project(f,x,y,z,p.lamp);
        if (swirl>.24 && p.gem) {
          project(f,x,y,z,q); c.globalAlpha=swirl*.72;
          const glow=p.kick<0?goldComet.glow:roseComet.glow;
          stamp(c,glow,q.x,q.y,(3.2+4.4*p.cluster)*f.unit);
          if (p.cluster>.72) gleam(c,q.x,q.y,f.unit*(3.5+p.size*1.9),thread,swirl*.85,p.phase);
        }
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    drawLamps(f,tree,1-.91*gathering);
    drawRibbon(f, ribbon, 1, true, 1.52, treeTint, treeCore, silk);
    drawRibbon(f, hem, 1, true, .65, thread, treeCore, silk * .91);
    drawRibbon(f, outer, 1, true, .68, thread, treeCore, silk * .52);
    drawBurstStreams(f,progress);
    if (heart > .03) {
      for (let i = 0; i < 2; i++) {
        const onHeart = (u,out) => {
          const p = heartCurve((i ? -1 : 1)*u*TAU);
          return project(f,p.x*1.055*hcos*beat,.51+p.y*heartScale*1.055,p.x*1.055*hsin*beat,out);
        };
        const reverseTrace=morph && morph.to===0;
        const head=reverseTrace ? .03+.47*smooth(.04,.99,progress) :
          .5*smooth(.48,.95,f.shot)+Math.max(0,f.clock-4.5)*.046;
        drawComet(f,i ? goldComet : roseComet,head,.128,onHeart,heart*(reverseTrace ? 1 : .80));
      }
    }
    if (silk > .015) {
      drawRibbonFlow(f,flowHead,silk);
      for (let i = 0; i < 7; i++) {
        const at = (i / 7 + f.clock * .028) % 1;
        const p = ribbon[Math.floor(at * (ribbon.length - 1))];
        project(f, p.x, p.y, p.z, q);
        if (q.z > 0) gleam(c, q.x, q.y, f.unit * (2.6 + Math.sin(at * 19) * 1.3), core, silk * .8);
      }
      const a = (f.clock*.172+.13)%1, b = (f.clock*.133+.62)%1;
      c.save(); c.globalCompositeOperation = "lighter";
      for (let i=0;i<72;i++) {
        const at=(i+.34)/72;
        projectRibbonAt(f,outer,at,q);
        const light=(.40+.46*Math.sin(at*TAU*2.5-f.clock*1.65)**2)*silk;
        c.globalAlpha = light * (q.z < 0 ? .24 : .94);
        c.fillStyle = thread;
        const size=f.unit*(i%4 ? 1.0 : 1.67);
        c.fillRect(q.x-size/2,q.y-size/2,size,size);
        if (i%4===0) stamp(c,goldComet.glow,q.x,q.y,3.55*f.unit);
      }
      c.restore();
      drawComet(f,roseComet,a,.165,(u,out)=>projectRibbonAt(f,orbit,u,out),
        silk * smooth(0,.11,a) * (1-smooth(.90,1,a)));
      drawComet(f,goldComet,b,.142,(u,out)=>projectRibbonAt(f,outer,u,out),
        silk * smooth(0,.10,b) * (1-smooth(.90,1,b)));
    }
    c.globalAlpha = 1;
    firework(f,f.clock,celebration+.08,-1,.97); firework(f,f.clock,celebration+.46,1,.82);
    // 这颗星贯穿入场和两次变形，逆向时在树梢多停半拍。
    const climb=morph ? (morph.to ? smooth(.02,.84,progress) : 1-smooth(.41,1,progress)) : form;
    const starPath=(v,out)=>{
      const entry=1-smooth(.055,.91,f.shot), a=f.shot*TAU*.78;
      const arc=Math.sin(v*Math.PI);
      return project(f,entry*(.41*Math.cos(a)-.12)+arc*.27,.51+.488*v+entry*(.12+.08*Math.sin(a)),
        entry*(.28+.55*Math.sin(a))+arc*.21,out);
    };
    if (f.shot<.96) {
      const lead=(u,out)=>{
        const entry=1-smooth(.055,.91,u), a=u*TAU*.78;
        return project(f,entry*(.41*Math.cos(a)-.12),.51+entry*(.12+.08*Math.sin(a)),entry*(.28+.55*Math.sin(a)),out);
      };
      drawComet(f,goldComet,f.shot,.125,lead,.92*(1-smooth(.73,.96,f.shot)));
    }
    if (morph) {
      const sign=morph.to?1:-1;
      drawComet(f,goldComet,climb*sign,.11,(u,out)=>starPath(clamp(u*sign,0,1),out),Math.sin(progress*Math.PI)*.88);
    }
    starPath(climb,q);
    const radius=f.rest.r*(.058+.066*climb+.034*(1-f.shot));
    const crownLight=smooth(.50,1,climb), breath=.94+.06*Math.sin(f.clock*1.28);
    c.save(); c.globalCompositeOperation="lighter";
    c.globalAlpha=.93-.61*crownLight; stamp(c,goldComet.glow,q.x,q.y,radius*2.28);
    c.globalAlpha=.32*crownLight; stamp(c,roseComet.glow,q.x,q.y,radius*2.54);
    c.globalAlpha=.64*crownLight*breath; stamp(c,pearlGlow,q.x,q.y,radius*1.31);
    gleam(c,q.x,q.y,radius*1.03,"#ffe5aa",.95-.63*crownLight,.12);
    gleam(c,q.x,q.y,radius*(.56+.61*crownLight),core,.71*breath,.24);
    gleam(c,q.x,q.y,radius*(.44+.31*crownLight),core,.65,1.01);
    c.restore();
    drawFallingField(f,petals,true,.95*petalsIn);
    return 1;
  }
  return {
    seed, paint: materials[0].body, draw, backdrop, reset, still, tap, entrance, action:"轻点切换爱心与圣诞树",
    camera:{zoom:1.10,focus:.49,pan:-.36,lift:.02,pitch:-.22,direction:-1},
    cues:[{at:1.25,x:.47,y:.53},{at:6.90,x:.56,y:.60}],
    sparkColor:gold,speed:.115,initialAngle:0,drift:4,snowCount:59,
    sky: { base: "#100811", air: blend(accent, [63, 16, 53], .74), star: pearl,
      stars: 1.05, rings: [.76, 1.02, 1.27], spread: .19 }
  };
}
