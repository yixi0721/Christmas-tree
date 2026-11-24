// ── 可复用的粒子特效。时间和视角由播放器统一传入。 ──────────
function makeComet(rand, count, tint, highlight) {
  const grains = Array.from({ length: count }, () => ({
    offset: rand(), x: (rand() - .5) * 2, y: (rand() - .5) * 2,
    phase: rand() * TAU, size: .44 + rand() ** 2 * 1.25, hot: rand() > .68
  }));
  return { grains, tint: rgb(tint), core: rgb(highlight), glow: makeGlow(tint) };
}
function projectRibbonAt(f, route, u, out) {
  const index = clamp(u, 0, 1) * (route.length - 1);
  const a = route[Math.floor(index)], b = route[Math.min(route.length - 1, Math.floor(index) + 1)];
  const k = index % 1;
  return project(f, mix(a.x,b.x,k), mix(a.y,b.y,k), mix(a.z,b.z,k), out);
}
// sample(u, out) 返回屏幕位置和纵深。彗核、轨迹和四散的细尘共用同一路径。
function drawComet(f, comet, head, span, sample, intensity) {
  if (intensity < .012) return;
  const c = f.ctx, q = {}, prev = {};
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  sample(head,prev);
  for (let i = 1; i <= 25; i++) {
    const lag = i / 25, u = head - span * lag;
    sample(u,q);
    const near = clamp(.76 + q.z * .38,.24,1);
    c.globalAlpha = intensity * (1 - lag) ** 1.3 * near;
    c.strokeStyle = i < 6 ? comet.core : comet.tint;
    c.lineWidth = f.unit * (.4 + 1.45 * (1 - lag));
    c.beginPath(); c.moveTo(prev.x,prev.y); c.lineTo(q.x,q.y); c.stroke();
    prev.x = q.x; prev.y = q.y;
  }
  for (const p of comet.grains) {
    const lag = (p.offset + f.clock * .29) % 1;
    sample(head - span * lag, q);
    const width = f.unit * (1.6 + 11 * lag ** .8);
    const x = q.x + (p.x + .19 * Math.sin(p.phase + lag * 5)) * width;
    const y = q.y + (p.y + .34 * lag) * width;
    c.globalAlpha = intensity * (.18 + .78 * (1 - lag)) * clamp(.78 + q.z * .38,.25,1);
    c.fillStyle = p.hot ? comet.core : comet.tint;
    const size = p.size * f.unit;
    c.fillRect(x,y,size,size);
  }
  sample(head,q);
  const near = clamp(.78 + q.z * .36,.25,1);
  c.globalAlpha = intensity * near;
  stamp(c,comet.glow,q.x,q.y,14 * f.unit);
  gleam(c,q.x,q.y,8 * f.unit,comet.core,intensity * near,.19);
  c.restore();
}

// 有正反面的飘落物沿不同半径绕树。纹理只生成一次。
function makeFallingField(rand, count, tiles, size, fallSpeed) {
  const flakes = Array.from({length:count}, () => ({
    start: rand(), angle: rand() * TAU, speed: fallSpeed * (.59 + rand() * .78),
    orbit: .58 + rand() * .94, sway: .15 + rand() * .51, roll: rand() * TAU,
    turn: (rand() - .5) * 1.65, size: size * (.42 + rand() ** 2 * 1.03),
    tile: tiles[Math.floor(rand() * tiles.length)]
  }));
  return flakes;
}
function fallingPosition(f, p, q) {
  const fall = (p.start + f.clock * p.speed) % 1;
  const angle = p.angle + fall * TAU * p.sway + .16 * Math.sin(f.clock * .47 + p.roll);
  const orbit = p.orbit * (.79 + fall * .29);
  project(f,Math.cos(angle)*orbit,1.13-fall*1.18,Math.sin(angle)*orbit,q);
  q.fall=fall; q.angle=angle; q.turn=p.roll+f.clock*p.turn;
  return q;
}
// 雪先悬停，碎裂时淡出原雪片，最后接回落雪轨迹。碎片从锁定的位置发射。
function holdFlake(f,p,q) {
  const lock=p.frozen, age=f.clock-lock.at, ease=smooth(.91,1.72,age);
  if (ease>=1) { p.frozen=null; return; }
  q.x=mix(lock.x*f.w,q.x,ease); q.y=mix(lock.y*f.height,q.y,ease);
  q.lockAlpha=1-smooth(.47,.60,age)+smooth(1.06,1.72,age);
  if (lock.z!==undefined) {
    q.z=mix(lock.z,q.z,ease); q.turn=mix(lock.turn,q.turn,ease);
    q.angle=mix(lock.angle,q.angle,ease); q.fall=mix(lock.fall,q.fall,ease);
  }
}
function drawFallingField(f, flakes, front, intensity) {
  if (intensity < .01) return;
  const c = f.ctx, q = {};
  c.save();
  for (const p of flakes) {
    q.lockAlpha=1;
    fallingPosition(f,p,q);
    if (p.frozen) holdFlake(f,p,q);
    const {fall,angle,turn}=q;
    if ((q.z >= 0) !== front) continue;
    const fade = smooth(0,.085,fall) * (1 - smooth(.87,1,fall));
    c.globalAlpha=intensity*fade*(front?.88:.36)*q.lockAlpha;
    const radius = p.size * f.unit * clamp(.97 + q.z * .20,.68,1.24);
    const fold = .38 + .62 * Math.abs(Math.cos(turn * .82 + angle));
    c.save();
    c.translate(q.x,q.y); c.rotate(turn);
    c.drawImage(p.tile,-radius * fold,-radius,radius * 2 * fold,radius * 2);
    c.restore();
  }
  c.restore();
}

function makeTouchSparks(rand, count, accent, second) {
  const colors = [rgb(accent),rgb(second),rgb(blend(accent,ivory,.88))];
  const sparks = Array.from({length:count}, (_, i) => ({
    angle: rand() * TAU, distance: .23 + rand() ** .72 * .90, bend: (rand() - .5) * .65,
    delay: rand() * .20, life: .70 + rand() * .49, drop: rand() * .27,
    size: .6 + rand() ** 2 * 1.55, color: colors[i % 3]
  }));
  return { sparks, glow: makeGlow(second), core: colors[2] };
}
function drawTouchSparks(f, effect, age, origin) {
  if (age === null || age > 1.42) return;
  const c = f.ctx, x = origin.x * f.w, y = origin.y * f.height;
  c.save(); c.globalCompositeOperation = "lighter"; c.lineCap = "round";
  for (const p of effect.sparks) {
    const life = (age - p.delay) / p.life;
    if (life <= 0 || life >= 1) continue;
    const t = 1 - (1 - life) ** 2.7, prev = Math.max(0,life - .052);
    const reach = f.rest.r * .38;
    const d = t * p.distance * reach, old = (1 - (1 - prev) ** 2.7) * p.distance * reach;
    const a = p.angle + life * p.bend, b = p.angle + prev * p.bend;
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + life * life * p.drop * reach;
    const alpha = smooth(0,.08,life) * (1 - smooth(.27,1,life));
    c.globalAlpha = alpha * .67; c.strokeStyle = p.color; c.lineWidth = p.size * f.unit * .70;
    c.beginPath(); c.moveTo(x + Math.cos(b)*old,y + Math.sin(b)*old + prev*prev*p.drop*reach);
    c.lineTo(px,py); c.stroke();
    if (p.size > 1.45) {
      c.globalAlpha = alpha; stamp(c,effect.glow,px,py,p.size * f.unit * 2.1);
    }
  }
  const glint = 1 - smooth(.04,.42,age);
  c.globalAlpha = glint * .77; stamp(c,effect.glow,x,y,15*f.unit);
  gleam(c,x,y,14*f.unit,effect.core,glint,.22);
  c.restore();
}

// 三层纵深的迎面星尘。镜头穿过粒子时，近处的轨迹比远处拉得更长。
function makePassage(rand, accent, light) {
  const grains = Array.from({length:258}, () => ({
    a:rand()*TAU, r:.17+Math.sqrt(rand())*1.9, depth:rand(), side:rand()-.5,
    speed:.7+rand()*.65, size:.45+rand()**2*1.7, warm:rand()>.57
  }));
  return {grains, ink:rgb(accent), light:rgb(light), glow:makeGlow(accent)};
}
function drawPassage(f, field) {
  if (f.shot>=.90) return;
  const c=f.ctx, fade=1-smooth(.44,.90,f.shot), u=f.shot;
  const vanX=f.w*(.50+.135*Math.sin(u*TAU)), vanY=f.height*(.49+.095*Math.cos(u*4.5));
  const span=Math.min(f.w*.73,f.height*.66);
  c.save(); c.globalCompositeOperation="lighter"; c.lineCap="round";
  for (const p of field.grains) {
    const z=1-((p.depth+u*p.speed*1.48)%1), perspective=.43/(.12+z*1.6);
    const a=p.a+.43*u+.13*Math.sin(p.side*5+u*3);
    const dx=Math.cos(a)*span*p.r*perspective, dy=Math.sin(a)*span*p.r*perspective;
    const x=vanX+dx, y=vanY+dy, near=1-z;
    if (x < -16 || x > f.w+16 || y < -16 || y > f.height+16) continue;
    const power=fade*smooth(0,.18,near)*(.24+.72*near);
    c.globalAlpha=power; c.strokeStyle=p.warm?field.light:field.ink;
    c.lineWidth=(.40+p.size*perspective*.60)*f.rest.unit;
    const stretch=.006+.09*near**4;
    c.beginPath(); c.moveTo(x-dx*stretch,y-dy*stretch); c.lineTo(x,y); c.stroke();
    if (near>.64 && p.warm) stamp(c,field.glow,x,y,(2+6.8*near)*f.rest.unit);
  }
  c.restore();
}
