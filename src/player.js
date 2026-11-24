// ── 播放、缩放与触控 ─────────────────────────────────
function startPlayer() {
  const stage = document.getElementById("stage");
  const art = document.getElementById("art");
  const surface = document.getElementById("surface");
  const controls = stage.querySelector(".tools");
  const caption = document.getElementById("greeting");
  const pauseButton = document.getElementById("pause");
  const ctx = art.getContext("2d", { alpha: false });
  if (!ctx) {
    caption.textContent = "请用支持 Canvas 的浏览器打开。";
    surface.hidden = true;
    controls.hidden = true;
    return;
  }
  const treeColor = readColor(SETTINGS.color);
  const accent = SETTINGS.heartColor ? readColor(SETTINGS.heartColor) : treeColor;
  const quantity = Math.round(Number(SETTINGS.particleCount));
  const count = Number.isFinite(quantity) ? clamp(quantity, 400, 4800) : 2200;
  const scene = createScene(accent, count, treeColor);
  const lowMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const snow = makeSnow(randomFrom(scene.seed + 533), scene.snowCount);
  const touchSparks = makeTouchSparks(randomFrom(scene.seed + 811), Math.round(55 + count / 32), accent, scene.sparkColor);
  const passage = makePassage(randomFrom(scene.seed+842),accent,scene.sparkColor);
  const paint = scene.paint ?? {
    glow: makeGlow(accent), brushes: scene.clouds ? makeDustBrushes(accent) : null, inks: scene.inks
  };
  const f = { ctx, snow, ground: makeGround(scene), ...paint };
  const openingSeconds = 4.5;
  // shot 只走一次。环境时钟持续推进，只有按下重播才会排入演示里的点击。
  let paused = lowMotion.matches;
  let shot = paused ? 1 : 0, clock = 0, settle = null, pending = [];
  let demo = null, feedback = [], userTurn = 0, velocity = 0, drag = null;
  let picture, frameId = 0, previous = null, hideTimer = 0, skipPointerClick = false;
  surface.setAttribute("aria-label",scene.action+"，左右拖动或按方向键旋转");
  scene.reset();
  caption.textContent = String(SETTINGS.greeting ?? "");
  caption.hidden = !caption.textContent.trim();
  stage.style.setProperty("--ink", rgb(blend(accent, ivory, .71)));
  stage.style.setProperty("--haze", rgb(accent, .35));

  function requestFrame() {
    if (!frameId && !document.hidden) frameId = requestAnimationFrame(tick);
  }
  function resize() {
    const w = stage.clientWidth, height = stage.clientHeight;
    if (!w || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4800000 / (w * height)));
    if (w === f.w && height === f.height && dpr === f.dpr) return;
    const h = Math.min(height * .637, w * 1.40);
    const r = Math.min(w * .371, h * .384);
    Object.assign(f, { w, height, h, r, dpr, cx: w / 2, base: height * .49 + h * .48,
      unit: clamp(h / 455, .67, 1.63) });
    f.rest = {cx:f.cx,base:f.base,h,r,unit:f.unit};
    art.width = Math.round(w * dpr); art.height = Math.round(height * dpr);
    ctx.setTransform(art.width / w, 0, 0, art.height / height, 0, 0);
    caption.style.top = Math.min(height - 26, f.base + r * .405 + Math.max(13, height * .022)) + "px";
    picture = paintSky(f, scene);
    setCamera();
    requestFrame();
  }
  function setCamera() {
    const rest=f.rest, lens=scene.camera;
    const travel=1-smooth(.045,1,shot);
    const pullback=lens.pullbackEnd ? 1-smooth(.02,lens.pullbackEnd,shot) : travel;
    const zoom=1+lens.zoom*pullback;
    f.shot=shot; f.clock=clock; f.quiet=lowMotion.matches || paused;
    f.autoAngle=scene.initialAngle+clock*scene.speed;
    f.yaw=userTurn+f.autoAngle+lens.direction*Math.PI*travel;
    f.cos=Math.cos(f.yaw); f.sin=Math.sin(f.yaw);
    f.cx=rest.cx+rest.r*(lens.pan*travel+.24*Math.sin(Math.PI*shot));
    f.base=rest.base+rest.h*((zoom-1)*lens.focus+lens.lift*travel);
    f.r=rest.r*zoom; f.h=rest.h*zoom; f.unit=rest.unit*(1+.29*(zoom-1));
    f.parallax=.28*travel; f.pitch=lens.pitch*travel;
    if (shot===1 && scene.reframe) scene.reframe(f);
  }
  function feedbackAt(point) {
    feedback=feedback.slice(-4);
    feedback.push({point,at:clock});
  }
  function playDemo(dt) {
    if (!demo || shot<1 || paused) return;
    demo.time+=dt;
    while (demo.index<scene.cues.length && demo.time>=scene.cues[demo.index].at) {
      const point=scene.cues[demo.index++];
      feedbackAt(point); scene.tap(f,point);
    }
    if (demo.index===scene.cues.length) demo=null;
  }
  function tick(now) {
    frameId = 0;
    if (!picture || document.hidden) { previous = null; return; }
    const dt = previous === null ? 0 : Math.min(.15, Math.max(0, (now - previous) / 1000));
    previous = now;
    const startedAtRest=shot===1;
    if (!paused) {
      clock+=dt;
      if (settle) {
        settle.age+=dt;
        shot=mix(settle.from,1,smooth(0,settle.span,settle.age));
        if (shot===1) settle=null;
      } else shot=Math.min(1,shot+dt/openingSeconds);
    }
    if (!drag && Math.abs(velocity) > .012) {
      userTurn += velocity * dt;
      velocity *= Math.exp(-dt * 4.7);
    } else if (!drag) velocity = 0;
    setCamera();
    if (shot===1 && pending.length) {
      for (const point of pending) scene.tap(f,point);
      pending=[];
    }
    playDemo(startedAtRest ? dt : 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(picture, 0, 0, f.w, f.height);
    const greetingOpacity = scene.draw(f);
    drawSnow(f, snow, scene);
    drawPassage(f,passage);
    if (shot<1) scene.entrance(f);
    if (scene.overlay) scene.overlay(f);
    feedback=feedback.filter(hit=>clock-hit.at<1.42);
    for (const hit of feedback) {
      if (!lowMotion.matches) drawTouchSparks(f,touchSparks,clock-hit.at,hit.point);
    }
    caption.style.opacity=String(clamp(greetingOpacity*smooth(.67,.99,shot),0,1));
    if (!paused || velocity !== 0) requestFrame();
    else previous = null;
  }
  function updatePauseButton() {
    pauseButton.dataset.paused = String(paused);
    const action = paused ? "继续播放" : "暂停动画";
    pauseButton.setAttribute("aria-label", action); pauseButton.title = action;
  }
  function showControls() {
    stage.classList.add("awake");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => stage.classList.remove("awake"), 1850);
  }
  function interact(x=.5,y=(f.rest.base-f.rest.h*.50)/f.height) {
    const point={x:clamp(x,0,1),y:clamp(y,0,1)};
    demo=null; feedbackAt(point);
    if (shot<1 && !paused) {
      pending.push(point);
      if (!settle) settle={from:shot,age:0,span:Math.min(.50,(1-shot)*openingSeconds)};
    } else {
      if (paused) { shot=1; settle=null; }
      setCamera();
      for (const earlier of pending) scene.tap(f,earlier);
      pending=[]; scene.tap(f,point);
    }
    requestFrame();
  }
  pauseButton.addEventListener("click", () => {
    paused = !paused; previous = null;
    updatePauseButton(); showControls(); requestFrame();
  });
  document.getElementById("replay").addEventListener("click", () => {
    shot=lowMotion.matches?1:0; clock=0; userTurn=0; velocity=0;
    pending=[]; feedback=[]; settle=null; demo={time:0,index:0};
    for (const p of snow) p.frozen=null;
    scene.reset();
    paused = false; previous = null;
    updatePauseButton(); showControls(); requestFrame();
  });
  surface.addEventListener("pointerdown", e => {
    if (e.button !== 0 || !e.isPrimary || drag) return;
    const area = controls.getBoundingClientRect();
    const revealOnly = !stage.classList.contains("awake") && e.clientX >= area.left && e.clientX <= area.right &&
      e.clientY >= area.top && e.clientY <= area.bottom;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastAt: e.timeStamp,
      moved: false, speed: 0, revealOnly };
    velocity = 0;
    surface.setPointerCapture(e.pointerId);
  });
  surface.addEventListener("pointermove", e => {
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.moved = true;
    demo=null;
    surface.classList.add("is-dragging");
    const delta = (e.clientX - drag.lastX) / Math.max(80, f.r) * 1.04;
    const seconds = Math.max(.012, (e.timeStamp - drag.lastAt) / 1000);
    userTurn += delta;
    drag.speed = clamp(mix(drag.speed, delta / seconds, .56), -3.25, 3.25);
    drag.lastX = e.clientX; drag.lastAt = e.timeStamp;
    requestFrame();
  });
  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const tap = e.type === "pointerup" && !drag.moved && !drag.revealOnly && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6;
    skipPointerClick = true;
    const coast = e.type === "pointerup" && drag.moved && e.timeStamp - drag.lastAt < 90 && !paused && !lowMotion.matches;
    velocity = coast ? drag.speed : 0;
    drag = null; surface.classList.remove("is-dragging");
    if (surface.hasPointerCapture(e.pointerId)) surface.releasePointerCapture(e.pointerId);
    // 触摸浏览器在拖动后可能省略下一次合成 click。有效轻点在抬手时兑现。
    if (tap) interact(e.clientX / f.w, e.clientY / f.height);
    requestFrame();
  }
  surface.addEventListener("pointerup", endDrag);
  surface.addEventListener("pointercancel", endDrag);
  surface.addEventListener("lostpointercapture", endDrag);
  stage.addEventListener("pointerdown", () => { skipPointerClick = false; }, true);
  // 有的触屏会把后续 click 发到刚出现的播放按钮。这次轻点已经在抬手时处理。
  stage.addEventListener("click", e => {
    if (!skipPointerClick || e.detail === 0) return;
    skipPointerClick = false; e.preventDefault(); e.stopPropagation();
  }, true);
  surface.addEventListener("click", () => interact());
  surface.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault(); velocity = 0; demo=null;
    userTurn += e.key === "ArrowLeft" ? -.19 : .19;
    requestFrame();
  });
  stage.addEventListener("pointermove", showControls);
  stage.addEventListener("pointerdown", showControls);
  document.addEventListener("visibilitychange", () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0; previous = null;
    if (!document.hidden) requestFrame();
  });
  lowMotion.addEventListener("change", () => {
    paused=lowMotion.matches; previous=null; velocity=0;
    if (paused) {
      shot=1; settle=null; demo=null; feedback=[];
      for (const p of snow) p.frozen=null;
      if (scene.still) scene.still();
      else scene.reset();
    }
    updatePauseButton(); requestFrame();
  });
  window.addEventListener("resize", resize);
  updatePauseButton(); resize();
}
startPlayer();
