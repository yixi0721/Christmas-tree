// 主题物件、旋风和信封共用这一组笔刷。所有运动都取播放器的时钟。
function makeCharmHalo(accent, light) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 160;
  const c = tile.getContext("2d");
  // 光集中在物件轮廓外，冰晶落在亮枝旁时也能看清六个尖角。
  const haze = c.createRadialGradient(80, 80, 0, 80, 80, 80);
  haze.addColorStop(0, rgb(blend(accent, [16, 18, 28], .74), .72));
  haze.addColorStop(.35, rgb(accent, .30));
  haze.addColorStop(.58, rgb(accent, .50));
  haze.addColorStop(.77, rgb(accent, .24));
  haze.addColorStop(1, rgb(accent, 0));
  c.fillStyle = haze; c.fillRect(0, 0, 160, 160);
  const rim = c.createLinearGradient(27, 117, 133, 43);
  rim.addColorStop(0, rgb(light, .78));
  rim.addColorStop(.45, rgb(accent, .14));
  rim.addColorStop(1, rgb(light, .92));
  c.strokeStyle = rim; c.lineWidth = 1.8;
  c.beginPath(); c.arc(80, 80, 62, 0, TAU); c.stroke();
  gleam(c, 131, 45, 8, rgb(light), .98, .16);
  gleam(c, 29, 115, 5.6, rgb(light), .78, .16);
  return tile;
}

function makeLetterArt(theme, accent, seed) {
  const ice = theme.kind === "ice", rose = theme.kind === "rose";
  const light = blend(accent, ivory, .79), core = rgb(light);
  const inks = [rgb(accent), rgb(blend(accent, ivory, .38)), core];
  const glow = makeGlow(accent), charmHalo = makeCharmHalo(accent, light), random = randomFrom(seed + 1201);
  const grains = Array.from({length: 94}, (_, i) => ({
    angle: random() * TAU, orbit: .20 + .80 * Math.sqrt(random()), layer: random() - .5,
    speed: 2.5 + random() * 1.6, size: .55 + random() ** 2 * 1.35,
    tone: i % 3, large: i % 6 === 0
  }));
  const object = document.createElement("canvas");
  object.width = object.height = 150;
  const pen = object.getContext("2d");
  pen.translate(75, 75); pen.scale(2.5, 2.5);
  pen.lineJoin = pen.lineCap = "round";
  function paint(outline, fill, edge, width = .9) {
    const path = new Path2D(outline);
    if (fill) { pen.fillStyle = fill; pen.fill(path); }
    if (edge) { pen.strokeStyle = edge; pen.lineWidth = width; pen.stroke(path); }
  }
  if (rose) {
    const petal = pen.createLinearGradient(-10, -14, 8, 6);
    petal.addColorStop(0, core); petal.addColorStop(.32, rgb(blend(accent, ivory, .30)));
    petal.addColorStop(.72, rgb(accent)); petal.addColorStop(1, rgb(blend(accent, [62, 10, 35], .66)));
    const leaf = "#799586", leafEdge = "#bbcead";
    paint("M-6 23 Q3 12 1 0", null, leafEdge, 1.55);
    paint("M-2 15 Q-12 17 -15 6 Q-5 7 -2 15 M0 11 Q5 1 13 4 Q9 12 0 11", leaf, leafEdge, .5);
    paint("M-10 -13 Q-6 -22 1 -17 Q9 -20 11 -12 Q12 -2 2 5 Q-10 4 -10 -13Z", petal, core);
    paint("M-9 -14 Q-2 -11 4 -4 Q3 1 1 4 Q-10 0 -9 -14Z", petal, core, .7);
    paint("M10 -14 Q4 -13 -2 -6 Q-3 -2 1 3 Q10 0 10 -14Z", petal, core, .75);
    paint("M-6 -15 Q0 -20 5 -14 Q1 -15 -2 -12", null, core, 1.1);
    paint("M-7 0 Q-3 3 1 2 L6 0 Q4 7 0 6Z", leaf, leafEdge, .55);
  } else if (ice) {
    stamp(pen, theme.tile, 0, 0, 24);
    for (let arm = 0; arm < 6; arm++) {
      pen.save(); pen.rotate(arm * TAU / 6);
      paint("M0 -20 L2.6 -10 L0 -5 L-2.6 -10Z", rgb(accent), core, .6);
      paint("M0 -19 L0 -6 L-2.1 -10Z", rgb(light));
      pen.restore();
    }
    paint("M0 -5 L4 0 L0 5 L-4 0Z", rgb(accent), core);
    paint("M0 -5 L0 3 L-3 0Z", core);
  } else {
    const metal = rgb(blend(accent, [82, 47, 28], .52));
    const glass = pen.createLinearGradient(0, -8, 0, 13);
    glass.addColorStop(0, rgb(accent, .35)); glass.addColorStop(.52, rgb(light, .95));
    glass.addColorStop(1, rgb(accent, .66));
    paint("M-5 -15 C-8 -27 8 -27 5 -15", null, core, 1.4);
    paint("M-11 -9 L-7 -13 L-4 -14 L-4 -17 L4 -17 L4 -14 L8 -13 L11 -9Z", metal, core);
    paint("M-9 -7 L9 -7 L7 12 L-6 12Z", glass, core, 1);
    paint("M-1 9 C-5 5 0 1 1 -3 Q1 2 3 4 Q6 9 -1 9Z", "#fff6d4");
    paint("M-9 -7 L-5 12 M9 -7 L5 12 M-10 12 L9 12 L7 16 L-7 16Z", metal, core, 1.15);
    paint("M-5 17 Q0 22 5 17", null, rgb(accent), 1.25);
  }

  function charm(c, at, time, alpha = 1) {
    if (alpha <= 0) return;
    const breath = .5 + .5 * Math.sin(time * 1.6);
    c.save(); c.translate(at.x, at.y);
    c.globalAlpha = alpha * (.76 + .24 * breath);
    stamp(c, charmHalo, 0, 0, at.radius * (.88 + .12 * breath));
    c.globalAlpha = alpha;
    c.rotate(ice ? time * .20 : (rose ? -.22 : -.10) + .06 * Math.sin(time * 1.5));
    const scale = 1.17 + .035 * breath;
    c.scale(scale, scale);
    if (rose) {
      const bloom = breath * .14 + (1 - alpha);
      for (const side of [-1, 1]) {
        c.save(); c.translate(side * (5 + 6 * bloom), -9 - 3 * bloom);
        c.rotate(side * (.30 + .85 * bloom)); c.scale(side * .75, 1);
        stamp(c, theme.tile, 0, 0, 8); c.restore();
      }
    }
    stamp(c, object, 0, 0, 29);
    c.restore();
  }

  function wind(c, at, width, height, tilt, time, direction, alpha) {
    if (alpha <= .001) return;
    c.save(); c.translate(at.x, at.y); c.globalCompositeOperation = "lighter";
    const turn = time * direction;
    // 两束很细的弧光把分散的颗粒连成绕流，前低后高的前缘掠过字位。
    for (let strand = 0; strand < 2; strand++) {
      c.beginPath();
      for (let i = 0; i <= 28; i++) {
        const a = turn * 3 + strand * Math.PI + i * .115;
        const x = Math.cos(a) * width * (.61 + .16 * strand);
        const y = Math.sin(a) * height * .63 - tilt * x / Math.max(width, 1);
        if (i) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.strokeStyle = inks[strand]; c.globalAlpha = alpha * .23; c.lineWidth = .72; c.stroke();
    }
    for (const p of grains) {
      const a = p.angle + turn * p.speed, depth = Math.sin(a);
      const x = Math.cos(a) * width * p.orbit;
      const y = (depth * p.orbit * .75 + p.layer * .72) * height - tilt * x / Math.max(width, 1);
      c.globalAlpha = alpha * (.60 + .29 * depth);
      if (p.large && theme.tile) {
        const r = (rose ? 4.3 : 3.3) + p.size * 1.8;
        c.save(); c.translate(x, y); c.rotate(a * .88);
        c.scale(.38 + .62 * Math.abs(Math.cos(a * .91)), 1);
        stamp(c, theme.tile, 0, 0, r); c.restore();
      } else if (!theme.tile && p.large) {
        c.strokeStyle = inks[1]; c.lineWidth = p.size;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + depth * 5, y - Math.cos(a) * 3); c.stroke();
        stamp(c, glow, x, y, 5);
      } else {
        c.fillStyle = inks[p.tone]; c.fillRect(x, y, p.size, ice ? p.size * 1.6 : p.size);
      }
    }
    c.restore();
  }

  // 字形上的采样点就是细粒最后的落点。倒放同一段运动时，它们从笔画脱离。
  function strokes(c, glyph, origin, progress, time) {
    const loose = 1 - progress, envelope = Math.sin(progress * Math.PI);
    c.globalAlpha = envelope * .96;
    for (let i = 0; i < glyph.dots.length; i++) {
      const dot = glyph.dots[i], phase = i * 2.4 + glyph.x * .14 + time * 6;
      const x = origin.x + glyph.x + dot.x + loose * (Math.cos(phase) * 12 - 4);
      const y = origin.y + glyph.y + dot.y + loose * (Math.sin(phase) * 5 - 8);
      c.fillStyle = inks[i % 3];
      c.fillRect(x, y, ice ? .9 : 1.25, ice ? 2 : 1.25);
    }
  }

  const tl = [-10,-7], tr = [10,-7], br = [10,7], bl = [-10,7], fold = [0,1];
  function trace(c, points, progress) {
    const head = clamp(progress, 0, 1) * (points.length - 1);
    let [x, y] = points[0];
    c.beginPath(); c.moveTo(x, y);
    for (let i = 1; i < points.length && i - 1 < head; i++) {
      const step = Math.min(1, head - i + 1);
      x = mix(points[i - 1][0], points[i][0], step);
      y = mix(points[i - 1][1], points[i][1], step);
      c.lineTo(x, y);
    }
    c.stroke();
    return {x, y};
  }
  function envelope(c, at, progress) {
    if (progress <= 0) return;
    c.save(); c.translate(at.x, at.y); c.lineWidth = 1.35; c.lineJoin = c.lineCap = "round";
    c.globalAlpha = .17 * progress; stamp(c, glow, 0, 0, 16);
    c.globalAlpha = .91; c.strokeStyle = core;
    const frame = smooth(0, .66, progress), flap = smooth(ice || rose ? .55 : .66, 1, progress);
    if (ice) {
      const corners = [tl, tr, br, bl];
      corners.forEach((corner, i) => {
        if (frame < 1) stamp(c, glow, corner[0], corner[1], 3.2);
        trace(c, [corner, corners[(i + 1) % 4]], frame);
      });
    } else {
      const lead = trace(c, [tl,tr,br,bl,tl], frame);
      if (!rose && frame < 1) stamp(c, glow, lead.x, lead.y, 4);
    }
    const left = trace(c, [tl, fold], flap), right = trace(c, [tr, fold], flap);
    if (rose && flap > 0 && flap < 1) {
      stamp(c, theme.tile, left.x, left.y, 3.3); stamp(c, theme.tile, right.x, right.y, 3.3);
    } else if (!ice && !rose && flap > 0) {
      stamp(c, glow, left.x, left.y, 2 + 3 * Math.sin(Math.PI * flap));
    }
    c.restore();
  }
  return {charm, wind, strokes, envelope};
}
