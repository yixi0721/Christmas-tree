// 信件的五个状态共享播放器时钟。正文由浏览器排版，Canvas 只绘制物件和飞行中的粒子。
function makeLetter(stage, scene, accent, text, lowMotion, onOpen, requestFrame) {
  const charm = stage.querySelector("#letter-charm"), envelope = stage.querySelector("#letter-envelope");
  const reader = stage.querySelector("#letter-reader"), page = stage.querySelector("#letter-page");
  const copy = stage.querySelector("#letter-copy"), skip = stage.querySelector("#letter-skip");
  const close = stage.querySelector("#letter-close");
  const art = makeLetterArt(scene.letter, accent, scene.seed);
  const flight = .56, writing = 2, openTime = flight + writing;
  const gather = .80, returnFlight = .56, seal = .42, closeTime = gather + returnFlight + seal;
  let state = "charm", age = 0, speed = 1, fromEnvelope = false, focusInFlight = false;
  let charmAt, envelopeAt, layout;
  charm.setAttribute("aria-label", "打开信件，" + scene.letter.name);

  // 空白用原文本节点保存，字素各占一个行内元素，保留系统字体的折行和标点规则。
  const content = String(text ?? "").replace(/\r\n?/g, "\n");
  // 让浏览器也排出最后一次回车后的空白行，正文文本本身保持原样。
  copy.classList.toggle("ends-with-break", content.endsWith("\n"));
  const parts = typeof Intl.Segmenter === "function"
    ? Array.from(new Intl.Segmenter("zh", {granularity:"grapheme"}).segment(content), part => part.segment)
    : Array.from(content);
  const glyphs = [], fragment = document.createDocumentFragment();
  for (const part of parts) {
    if (/^\s+$/u.test(part)) { fragment.append(part); continue; }
    const span = document.createElement("span");
    span.textContent = part; fragment.append(span);
    glyphs.push({span, part, opacity: 1});
  }
  copy.append(fragment);

  function change(next) {
    const active = document.activeElement;
    const carryFocus = [charm, envelope, skip, close].includes(active) || (focusInFlight && active === document.body);
    state = next; age = 0; speed = 1;
    stage.dataset.letter = state;
    charm.hidden = state !== "charm";
    reader.hidden = state === "charm" || state === "envelope";
    skip.hidden = state !== "opening";
    copy.setAttribute("aria-hidden", String(state !== "reading"));
    if (state === "reading") {
      for (const glyph of glyphs) setInk(glyph, 1);
    }
    const target = {charm, envelope, opening:skip, reading:close}[state];
    focusInFlight = carryFocus && !target;
    if (carryFocus && target) target.focus({preventScroll:true});
  }
  function setInk(glyph, value) {
    if (glyph.opacity === value) return;
    glyph.opacity = value;
    glyph.span.style.opacity = value === 1 ? "" : String(value);
  }

  function measure() {
    if (reader.hidden) return;
    const body = copy.getBoundingClientRect(), clip = page.getBoundingClientRect();
    const style = getComputedStyle(copy), size = parseFloat(style.fontSize);
    const line = parseFloat(style.lineHeight), masks = new Map();
    const sampler = document.createElement("canvas").getContext("2d", {willReadFrequently:true});
    // 只在排版变化时取样。每个字的实心笔画提供若干落点，重复字形共用一份。
    function sample(part, width, height) {
      const key = part + ":" + width + ":" + height;
      if (masks.has(key)) return masks.get(key);
      sampler.canvas.width = width; sampler.canvas.height = height;
      sampler.font = style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
      const metrics = sampler.measureText(part);
      const ascent = metrics.fontBoundingBoxAscent ?? size * .82;
      const descent = metrics.fontBoundingBoxDescent ?? size * .18;
      sampler.fillText(part, 0, (height + ascent - descent) / 2);
      const rgba = sampler.getImageData(0, 0, width, height).data, pixels = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (rgba[(y * width + x) * 4 + 3] > 80) pixels.push({x, y});
        }
      }
      const count = Math.min(14, pixels.length);
      const dots = Array.from({length:count}, (_, i) => pixels[Math.floor((i + .5) * pixels.length / count)]);
      masks.set(key, dots);
      return dots;
    }
    let inkWidth = 0;
    for (const glyph of glyphs) {
      const box = glyph.span.getBoundingClientRect();
      glyph.x = box.left - body.left; glyph.y = box.top - body.top;
      glyph.cx = glyph.x + box.width / 2; glyph.cy = glyph.y + box.height / 2;
      glyph.dots = sample(glyph.part, Math.max(1, Math.ceil(box.width)), Math.max(1, Math.ceil(box.height)));
      inkWidth = Math.max(inkWidth, glyph.x + box.width);
    }
    const width = Math.min(body.width, Math.max(inkWidth, size * 2.5));
    let first = Infinity, last = -Infinity;
    for (const glyph of glyphs) {
      glyph.crossing = glyph.cy + (glyph.cx / width - .5) * line * .80;
      first = Math.min(first, glyph.crossing); last = Math.max(last, glyph.crossing);
    }
    // 按首字和末字定时，段首或末尾的空行只影响排版。
    const start = glyphs.length ? first - line * .36 : -line * .65;
    const end = glyphs.length ? last + line * .36 : body.height + line * .65;
    layout = {x:body.left, y:body.top + page.scrollTop, width, line, clip, start, end};
  }
  function resize(home, w, height) {
    const radius = parseFloat(getComputedStyle(charm).width) / 2;
    charmAt = {x:Math.min(w - radius - 4, home.cx + home.r * 1.06),
      y:Math.min(height - radius - 4, home.base + home.r * .08), radius};
    charm.style.left = charmAt.x + "px"; charm.style.top = charmAt.y + "px";
    const box = envelope.getBoundingClientRect();
    envelopeAt = {x:box.left + box.width / 2, y:box.top + box.height / 2};
    measure();
  }
  function open() {
    if (state !== "charm" && state !== "envelope") return;
    fromEnvelope = state === "envelope";
    const origin = fromEnvelope ? envelopeAt : charmAt;
    onOpen(origin);
    change("opening"); page.scrollTop = 0; measure();
    for (const glyph of glyphs) setInk(glyph, 0);
    if (lowMotion.matches) change("reading");
    requestFrame();
  }
  function fold() {
    if (state !== "reading") return;
    change(lowMotion.matches ? "envelope" : "closing");
    requestFrame();
  }
  function advance(dt) {
    if (state !== "opening" && state !== "closing") return;
    age += dt * speed;
    if (state === "opening" && (age >= openTime || lowMotion.matches)) change("reading");
    if (state === "closing" && (age >= closeTime || lowMotion.matches)) change("envelope");
  }
  function view() {
    if (state === "opening") return smooth(0, .85, age);
    if (state === "closing") return 1 - smooth(0, gather + returnFlight, age);
    return state === "reading" ? 1 : 0;
  }
  function draw(f) {
    const c = f.ctx;
    c.save(); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    if (state === "charm") art.charm(c, charmAt, lowMotion.matches ? 0 : f.clock);
    else if (state === "envelope") art.envelope(c, envelopeAt, 1);
    else if (state !== "reading" && layout) drawMotion(c, f.clock);
    c.restore();
  }
  function drawMotion(c, time) {
    const opening = state === "opening";
    const {line, width, clip, start, end} = layout;
    const origin = {x:layout.x, y:layout.y - page.scrollTop};
    const t = opening ? clamp((age - flight) / writing, 0, 1) : 1 - clamp(age / gather, 0, 1);
    const front = mix(start, end, t);
    const head = {x:origin.x + width / 2, y:origin.y + front};
    const tilt = line * .40;
    // 实字只在几粒星尘已经碰到笔画时显现。反向收起时，同一批笔画先松开。
    c.save(); c.beginPath(); c.rect(clip.left, clip.top, clip.width, clip.height); c.clip();
    for (const glyph of glyphs) {
      const p = clamp((front - glyph.crossing) / (line * .72) + .5, 0, 1);
      setInk(glyph, smooth(.48, .96, p));
      if (p > 0 && p < 1) art.strokes(c, glyph, origin, p, time);
    }
    c.restore();
    const fullWidth = Math.max(17, width * .51), band = line * .48;
    if (opening && age < flight) {
      const at = fromEnvelope ? envelopeAt : charmAt;
      const travel = smooth(0, flight, age), arc = Math.sin(travel * Math.PI);
      const point = {x:mix(at.x, head.x, travel) + arc * (fromEnvelope ? -23 : 23),
        y:mix(at.y, head.y, travel) - arc * 36};
      if (fromEnvelope) art.envelope(c, at, 1 - smooth(0, .23, age));
      else art.charm(c, at, time, 1 - smooth(0, .22, age));
      art.wind(c, point, mix(9, fullWidth, travel), mix(8, band, travel), tilt * travel,
        time, 1, smooth(0, .13, age));
    } else if (!opening && age >= gather) {
      const travel = smooth(gather, gather + returnFlight, age), arc = Math.sin(travel * Math.PI);
      const point = {x:mix(head.x, envelopeAt.x, travel) + arc * 24,
        y:mix(Math.max(clip.top - line, head.y), envelopeAt.y, travel) - arc * 30};
      const shape = smooth(gather + returnFlight * .70, closeTime, age);
      art.wind(c, point, mix(fullWidth, 6, travel), mix(band, 3, travel), tilt * (1 - travel),
        time, -1, 1 - smooth(.05, .86, shape));
      art.envelope(c, envelopeAt, shape);
    } else {
      art.wind(c, head, fullWidth, band, tilt, time, opening ? 1 : -1,
        opening ? 1 - smooth(.89, 1, t) : 1 - smooth(.93, 1, t));
    }
  }
  charm.addEventListener("click", open);
  envelope.addEventListener("click", open);
  close.addEventListener("click", fold);
  skip.addEventListener("click", () => { speed = Math.max(speed, (openTime - age) / .48); requestFrame(); });
  change("charm");
  return {advance, draw, resize, view, reset:() => change("charm"),
    get active() { return state !== "charm" && state !== "envelope"; }};
}
