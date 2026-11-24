// ── 画布、空间坐标与光点 ──────────────────────────────
// 树脚高度为 0，树尖为 1。横向和纵深坐标以树脚半径为单位。
const TAU = Math.PI * 2;
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
const mix = (a, b, t) => a + (b - a) * t;
function smooth(low, high, value) {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
}
function randomFrom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const blend = (a, b, n) => a.map((v, i) => Math.round(mix(v, b[i], n)));
const rgb = (c, a = 1) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
const ivory = [255, 250, 235];
function readColor(hex) {
  const match = /^#?([\da-f]{6})$/i.exec(String(hex).trim());
  const n = parseInt(match ? match[1] : "ffe0b0", 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

function softLight(ctx, x, y, rx, ry, tint, strength) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, rgb(tint, strength));
  gradient.addColorStop(.38, rgb(tint, strength * .55));
  gradient.addColorStop(1, rgb(tint, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}
function makeGlow(tint) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 64;
  const c = tile.getContext("2d");
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, rgb(ivory));
  g.addColorStop(.075, rgb(blend(tint, ivory, .72), .98));
  g.addColorStop(.19, rgb(tint, .61));
  g.addColorStop(.43, rgb(tint, .17));
  g.addColorStop(1, rgb(tint, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return tile;
}
// 一枚笔刷包含细尘、晕光和几粒亮晶。同一片枝层叠印后仍有颗粒感。
function makeDustBrushes(accent) {
  const rand = randomFrom(89617);
  return Array.from({ length: 12 }, (_, variant) => {
    const tile = document.createElement("canvas");
    tile.width = tile.height = 64;
    const c = tile.getContext("2d");
    const pale = blend(accent, ivory, .76);
    softLight(c,32,32,30,23,accent,.095 + (variant % 3) * .015);
    for (let i = 0; i < 61; i++) {
      const x = 32 + (rand() + rand() + rand() - 1.5) * 24;
      const y = 32 + (rand() + rand() + rand() - 1.5) * 17;
      const s = .66 + rand() ** 2 * 2.55;
      c.fillStyle = rgb(i % 3 ? accent : pale, .34 + .62 * rand());
      c.fillRect(x, y, s, s);
    }
    c.fillStyle = rgb(pale, .94);
    c.fillRect(31,31,2.45,2.45);
    return tile;
  });
}
function stamp(ctx, tile, x, y, radius) {
  ctx.drawImage(tile, x - radius, y - radius, radius * 2, radius * 2);
}

function makeSpeck(rand) {
  return {
    x: 0, y: 0, z: 0, size: .43 + rand() ** 2 * 1.26, phase: rand() * TAU,
    speed: .8 + rand() * 2.4, tone: Math.floor(rand() * 5),
    bright: .52 + rand() * .48, gem: rand() < .068,
    kick: rand() * 2 - 1,
    brush: Math.floor(rand() * 12), cluster: rand() ** 1.2
  };
}
function project(f, x, y, z, out) {
  const across = x * f.cos + z * f.sin;
  const depth = z * f.cos - x * f.sin;
  out.x = f.cx + across * f.r * (1 + depth * (.055 + f.parallax));
  out.y = f.base - y * f.h + depth * f.r * (.178 + (.5 - y) * .078 + f.pitch);
  out.z = depth;
  return out;
}
const pixel = {};
function drawSpeck(f, p, x, y, z, opacity = 1, grain = 1, paint = f) {
  if (opacity <= .008) return;
  const q = project(f, x, y, z, pixel);
  const near = clamp(.72 + q.z * .28, .34, 1.15);
  const twinkle = .74 + .26 * Math.sin(f.clock * p.speed + p.phase);
  const side = Math.max(.70, p.size * f.unit * (.89 + near * .34));
  const c = f.ctx;
  const light = clamp(opacity * p.bright * near * (.83 + .26 * twinkle), 0, 1);
  if (paint.brushes && p.cluster > .18) {
    c.globalAlpha = Math.min(1, light * (.76 + p.cluster * .24)) * grain;
    const spread = f.unit * (4.7 + 6.9 * p.cluster);
    stamp(c, paint.brushes[p.brush], q.x, q.y, spread);
  }
  c.globalAlpha = light;
  c.fillStyle = paint.inks[p.tone];
  c.fillRect(q.x - side / 2, q.y - side / 2, side, side);
  if (p.gem && twinkle > .75) {
    c.globalAlpha *= .88;
    stamp(c, paint.glow, q.x, q.y, side * (1.65 + twinkle * 2.3));
    if (p.cluster > .69 && twinkle > .89) gleam(c,q.x,q.y,side * 3.6,paint.inks[3],light * twinkle,.15);
  }
}

function gleam(c, x, y, radius, tint, alpha = 1, angle = 0) {
  if (alpha < .01 || radius < .2) return;
  c.save();
  c.globalAlpha = clamp(alpha, 0, 1);
  c.translate(x, y);
  c.rotate(angle);
  c.fillStyle = tint;
  c.beginPath();
  c.moveTo(0, -radius);
  const thin = radius * .042;
  c.bezierCurveTo(thin,-thin,thin,-thin,radius * .80,0);
  c.bezierCurveTo(thin,thin,thin,thin,0,radius);
  c.bezierCurveTo(-thin,thin,-thin,thin,-radius * .80,0);
  c.bezierCurveTo(-thin,-thin,-thin,-thin,0,-radius);
  c.fill();
  c.restore();
}
function facetedStar(f, x, y, r, turn, alpha, shades) {
  if (alpha < .012) return;
  const c = f.ctx;
  const stretch = .44 + .56 * Math.abs(Math.cos(turn));
  const ridge = Math.sin(turn) * r * .25;
  const points = [];
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 - Math.PI / 2;
    const radius = (i % 2 ? .43 : 1) * r;
    points.push([Math.cos(a) * radius * stretch, Math.sin(a) * radius]);
  }
  c.save();
  c.globalAlpha = alpha;
  stamp(c, f.glow, x, y, r * 2.65);
  c.translate(x, y);
  for (let i = 0; i < 10; i++) {
    const next = points[(i + 1) % 10];
    c.fillStyle = shades[(i + (Math.sin(turn) < 0 ? 2 : 0)) % shades.length];
    c.beginPath();
    c.moveTo(ridge, -r * .05);
    c.lineTo(points[i][0], points[i][1]);
    c.lineTo(next[0], next[1]);
    c.closePath();
    c.fill();
  }
  c.restore();
}

// 一条光带分背面和正面绘制，中间插入树身，旋转时保留前后遮挡。
function makeRibbon(turns, phase, radiusAt, yAt = u => .025 + u * .94) {
  const points = [];
  const steps = Math.ceil(Math.abs(turns) * 72);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = phase + u * turns * TAU;
    const r = radiusAt(u);
    points.push({ x: Math.cos(a) * r, y: yAt(u, a), z: Math.sin(a) * r, u });
  }
  return points;
}
function drawRibbon(f, points, end, front, width, tint, core, strength) {
  if (strength < .01 || end <= 0) return;
  const c = f.ctx;
  const q = {};
  let penDown = false;
  c.beginPath();
  for (const p of points) {
    if (p.u > end) break;
    project(f, p.x, p.y, p.z, q);
    if ((q.z >= 0) !== front) { penDown = false; continue; }
    if (penDown) c.lineTo(q.x, q.y);
    else c.moveTo(q.x, q.y);
    penDown = true;
  }
  c.lineCap = "round";
  c.strokeStyle = tint;
  c.lineWidth = width * f.unit * 4;
  c.globalAlpha = strength * (front ? .12 : .033);
  c.stroke();
  c.lineWidth = Math.max(.48, width * f.unit);
  c.globalAlpha = strength * (front ? .84 : .21);
  c.stroke();
  c.lineWidth = Math.max(.4, width * f.unit * .39);
  c.strokeStyle = core;
  c.globalAlpha = strength * (front ? .87 : .15);
  c.stroke();
  c.globalAlpha = 1;
}

function paintSky(f, scene) {
  const { w, height, cx, base, r, h } = f;
  const tile = document.createElement("canvas");
  const scale = Math.min(f.dpr, 1.45);
  tile.width = Math.ceil(w * scale);
  tile.height = Math.ceil(height * scale);
  const c = tile.getContext("2d", { alpha: false });
  c.scale(tile.width / w, tile.height / height);
  const sky = scene.sky;
  const rand = randomFrom(scene.seed + 23);
  c.fillStyle = sky.base;
  c.fillRect(0, 0, w, height);
  softLight(c, cx, base - h * .46, Math.max(r * 2.65, w * .39), h * 1.02, sky.air, .38);
  softLight(c, cx - r * .67, base - h * .27, r * 1.53, h * .48, sky.air, .20);
  softLight(c, cx + r * .42, base - h * .83, r * 1.8, h * .41, sky.air, .18);
  const stars = Math.round(clamp(w * height / 2650, 78, 560) * sky.stars);
  for (let i = 0; i < stars; i++) {
    const x = rand() * w, y = rand() * height;
    const size = .35 + rand() ** 3 * 1.05;
    c.fillStyle = rgb(i % 5 ? sky.star : ivory, .15 + rand() * .47);
    c.beginPath(); c.arc(x, y, size, 0, TAU); c.fill();
    if (i % 38 === 2) gleam(c, x, y, size * 3.35, rgb(sky.star), .42);
  }
  if (scene.backdrop) scene.backdrop(c, f, rand);
  return tile;
}
// 地面星尘用树脚半径作单位。只生成一次坐标；镜头、自转和拖动都走树身的投影。
function makeGroundArc(start,end) {
  const steps=Math.ceil((end-start)*14);
  return Array.from({length:steps+1},(_,i)=>{
    const a=mix(start,end,i/steps);
    return {x:Math.cos(a),z:Math.sin(a)};
  });
}
function makeGround(scene) {
  const {sky}=scene, rand=randomFrom(scene.seed+193);
  const groups=[sky.star,ivory].flatMap(tint=>
    Array.from({length:6},(_,i)=>({ink:rgb(tint,.13+i*.095),points:[]})));
  const arcs=[], glints=[];
  sky.rings.forEach((radius,i)=>{
    const clusters=Array.from({length:3},()=>rand()*TAU);
    for (const a of clusters) {
      glints.push({x:radius*Math.cos(a),z:radius*Math.sin(a),size:1.2+rand()*.87});
    }
    if (sky.spread<.10) {
      arcs.push({radius,points:makeGroundArc(.1+i*.47,Math.PI*(1.88-i*.06)),
        ink:rgb(sky.star,.12/(1+i*.3))});
    }
    const total=Math.round(220+radius*175);
    for (let j=0;j<total;j++) {
      // 少量密集的星点给每一圈留下可以跟随的亮斑。
      const angle=j%7===0 ? clusters[j%3]+(rand()+rand()-1)*.16 : rand()*TAU;
      const r=radius+(rand()-.5)*sky.spread*(1+i*.15);
      const light=(.12+rand()*.48)*(1-i*.075);
      const index=clamp(Math.round((light-.13)/.095),0,5)+(rand()>.83 ? 6 : 0);
      groups[index].points.push({x:Math.cos(angle)*r,z:Math.sin(angle)*r,
        offset:(rand()-.5)*2.3,size:.48+rand()**2*1.24});
    }
  });
  const haze=document.createElement("canvas");
  haze.width=192; haze.height=48;
  softLight(haze.getContext("2d"),96,24,96,24,sky.air,.40);
  return {groups,arcs,glints,haze,ink:rgb(sky.star)};
}
function groundLevel(f) { return -.085*f.r/f.h; }
function drawGroundArc(f,level,radius,points) {
  const c=f.ctx, q={};
  c.beginPath();
  for (let i=0;i<points.length;i++) {
    const p=points[i];
    project(f,p.x*radius,level,p.z*radius,q);
    if (i) c.lineTo(q.x,q.y); else c.moveTo(q.x,q.y);
  }
  c.stroke();
}
function drawGround(f,yaw=f.yaw) {
  const view=yaw===f.yaw ? f : {...f,cos:Math.cos(yaw),sin:Math.sin(yaw)};
  const c=f.ctx, ground=f.ground, level=groundLevel(f), q={};
  c.save();
  c.globalAlpha=1;
  c.drawImage(ground.haze,f.cx-f.r*1.72,f.base-f.r*.17,f.r*3.44,f.r*.54);
  c.lineWidth=.69*f.unit;
  for (const arc of ground.arcs) {
    c.strokeStyle=arc.ink;
    drawGroundArc(view,level,arc.radius,arc.points);
  }
  for (const group of ground.groups) {
    c.fillStyle=group.ink;
    c.beginPath();
    for (const p of group.points) {
      project(view,p.x,level,p.z,q);
      const size=p.size*f.unit;
      c.rect(q.x-size*.5,q.y+(p.offset-p.size*.37)*f.unit,size,size*.74);
    }
    c.fill();
  }
  for (const p of ground.glints) {
    project(view,p.x,level,p.z,q);
    const size=p.size*f.unit, light=.60+.16*clamp(q.z,-1,1);
    c.globalAlpha=light; stamp(c,f.glow,q.x,q.y,size*2.45);
    gleam(c,q.x,q.y,size*1.85,ground.ink,light,.2);
  }
  c.restore();
}
function makeSnow(rand, count) {
  return Array.from({ length: count }, () => ({
    x: rand(), y: rand(), phase: rand() * TAU, speed: .5 + rand(),
    radius: .48 + rand() ** 3 * 1.85, alpha: .14 + rand() * .38
  }));
}
function snowPosition(f, p, drift, out) {
  out.x = p.x * f.w + Math.sin(f.clock * .22 * p.speed + p.phase) * 10 * f.unit;
  out.y = ((p.y * (f.height + 24) + f.clock * drift * p.speed) % (f.height + 24)) - 12;
  return out;
}
function drawSnow(f, snow, scene) {
  const c = f.ctx, q = {};
  c.fillStyle = rgb(scene.sky.star);
  for (const p of snow) {
    q.lockAlpha=1;
    snowPosition(f,p,scene.drift,q);
    if (p.frozen) holdFlake(f,p,q);
    const {x,y} = q;
    const radius = p.radius * f.unit;
    c.globalAlpha=p.alpha*(.85+.15*Math.sin(p.phase+f.clock*.9))*q.lockAlpha;
    c.beginPath(); c.arc(x, y, radius * .62, 0, TAU); c.fill();
    if (p.radius > 1.91) stamp(c, f.glow, x, y, radius * 2.5);
  }
  c.globalAlpha = 1;
}
