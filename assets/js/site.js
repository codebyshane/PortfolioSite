(function () {
  var lab = document.querySelector(".lab");
  var track = document.querySelector(".shore");
  var mulletCanvas = document.querySelector(".mullet");
  if (!lab || !track) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SPRITES = {
    walk: "images/pets/dog-walk.gif",
    walkFast: "images/pets/dog-walk-fast.gif",
    run: "images/pets/dog-run.gif"
  };

  function randBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function petWidth() {
    return lab.offsetWidth || 55;
  }

  function maxX() {
    return Math.max(track.clientWidth - petWidth(), 0);
  }

  function face(dir) {
    lab.style.transform = "scaleX(" + dir + ")";
  }

  function place(x) {
    lab.style.left = x + "px";
  }

  function setSprite(faceName) {
    var src = SPRITES[faceName];
    if (!src) return;
    if (lab.getAttribute("data-face") === faceName) return;
    lab.setAttribute("data-face", faceName);
    lab.src = src;
  }

  // Easter eggs stay off for reduced motion — no lingering pets.
  if (reduce.matches) {
    lab.style.display = "none";
    if (mulletCanvas) mulletCanvas.style.display = "none";
    return;
  }

  var dir = 1;
  var x = -80;
  var speed = 3;
  var gait = "walk";
  var last = 0;
  var mode = "idle";
  var modeUntil = 0;
  var leapsLeft = 0;
  var leap = null;
  var splashWait = 0;
  var drops = [];
  var mctx = mulletCanvas ? mulletCanvas.getContext("2d") : null;
  var MW = 220;
  var MH = 130;
  var waterY = MH - 18;

  function hideAll() {
    mode = "idle";
    leap = null;
    drops = [];
    lab.style.opacity = "0";
    lab.style.pointerEvents = "none";
    if (mulletCanvas) {
      mulletCanvas.style.opacity = "0";
      if (mctx) mctx.clearRect(0, 0, MW, MH);
    }
  }

  function scheduleQuiet() {
    hideAll();
    // Long gaps so the shore usually looks empty.
    modeUntil = performance.now() + randBetween(90000, 240000);
  }

  function beginLab() {
    mode = "lab";
    leap = null;
    drops = [];
    if (mctx) mctx.clearRect(0, 0, MW, MH);
    dir = Math.random() < 0.5 ? 1 : -1;
    gait = Math.random() < 0.35 ? "run" : "walk";
    speed = (gait === "run" ? 4.2 : 2.8) * randBetween(0.9, 1.2);
    x = dir > 0 ? -petWidth() - 8 : maxX() + petWidth() + 8;
    setSprite(gait === "run" ? (Math.random() < 0.5 ? "run" : "walkFast") : "walk");
    face(dir);
    place(x);
    lab.style.opacity = "1";
    if (mulletCanvas) mulletCanvas.style.opacity = "0";
  }

  function beginFish() {
    mode = "fish";
    leapsLeft = Math.random() < 0.7 ? 1 : 2;
    splashWait = randBetween(0.4, 1.1);
    leap = null;
    drops = [];
    if (mctx) mctx.clearRect(0, 0, MW, MH);
    lab.style.opacity = "0";
    if (mulletCanvas) mulletCanvas.style.opacity = "1";
  }

  function startLeap() {
    var span = Math.max(track.clientWidth - 200, 100);
    var dirSign = Math.random() < 0.5 ? 1 : -1;
    var dist = randBetween(64, 110);
    var x0 = randBetween(70, span);
    if (dirSign > 0 && x0 + dist > span + 40) dirSign = -1;
    if (dirSign < 0 && x0 - dist < 40) dirSign = 1;
    leap = {
      t: 0,
      dur: randBetween(0.62, 0.85),
      x0: x0,
      dist: dist,
      amp: randBetween(32, 48),
      dir: dirSign
    };
  }

  function spawnSplash(wx, dirSign) {
    var i;
    for (i = 0; i < 10; i += 1) {
      drops.push({
        x: MW / 2 + (Math.random() - 0.5) * 20,
        y: waterY,
        vx: (Math.random() - 0.5) * 80 + dirSign * 14,
        vy: -45 - Math.random() * 80,
        life: 0.24 + Math.random() * 0.22,
        r: 1 + Math.random() * 1.2
      });
    }
    mulletCanvas.style.left = wx - MW / 2 + "px";
  }

  function drawMullet(px, py, angle) {
    mctx.save();
    mctx.translate(px, py);
    // Local +x = head. Angle is the leap tangent so the nose leads.
    mctx.rotate(angle);

    // Main body — thickest just behind the head (+x)
    mctx.beginPath();
    mctx.moveTo(16.5, 0);
    mctx.bezierCurveTo(16.5, -4.2, 10, -6.2, 2, -5.6);
    mctx.bezierCurveTo(-6, -4.8, -11, -2.8, -13.5, -0.6);
    mctx.lineTo(-13.5, 0.6);
    mctx.bezierCurveTo(-11, 2.8, -6, 4.8, 2, 5.6);
    mctx.bezierCurveTo(10, 6.2, 16.5, 4.2, 16.5, 0);
    mctx.closePath();
    mctx.fillStyle = "#c8d0c8";
    mctx.fill();

    // Dark back
    mctx.beginPath();
    mctx.moveTo(12, -1.8);
    mctx.bezierCurveTo(4, -5.4, -4, -4.8, -11, -1.8);
    mctx.bezierCurveTo(-4, -3.2, 4, -3.6, 12, -1.8);
    mctx.closePath();
    mctx.fillStyle = "#4f5a4f";
    mctx.fill();

    // Head block
    mctx.beginPath();
    mctx.ellipse(12.5, 0.2, 5.2, 4.4, 0, 0, Math.PI * 2);
    mctx.fillStyle = "#bdc5bd";
    mctx.fill();

    // Big eye — the read of “which way is forward”
    mctx.beginPath();
    mctx.arc(13.2, -1.0, 1.8, 0, Math.PI * 2);
    mctx.fillStyle = "#0b100b";
    mctx.fill();
    mctx.beginPath();
    mctx.arc(13.7, -1.35, 0.55, 0, Math.PI * 2);
    mctx.fillStyle = "#f7faf7";
    mctx.fill();

    // Snout + mouth
    mctx.beginPath();
    mctx.ellipse(17.4, 0.6, 2.8, 2.3, 0.05, 0, Math.PI * 2);
    mctx.fillStyle = "#aeb6ae";
    mctx.fill();
    mctx.beginPath();
    mctx.moveTo(15.8, 1.5);
    mctx.quadraticCurveTo(18.6, 2.4, 20, 1.1);
    mctx.strokeStyle = "#5a635a";
    mctx.lineWidth = 0.9;
    mctx.lineCap = "round";
    mctx.stroke();

    // Pectoral fin under the head
    mctx.beginPath();
    mctx.moveTo(8, 2.2);
    mctx.quadraticCurveTo(10, 6.5, 5.5, 5.8);
    mctx.quadraticCurveTo(7, 3.5, 8, 2.2);
    mctx.fillStyle = "#8a948a";
    mctx.fill();

    // Dorsal
    mctx.beginPath();
    mctx.moveTo(-1, -4.4);
    mctx.lineTo(3.2, -8.8);
    mctx.lineTo(6.5, -4);
    mctx.closePath();
    mctx.fillStyle = "#445044";
    mctx.fill();

    // Trailing tail — thin lobes pointing backward (−x), not a big open “mouth”
    mctx.beginPath();
    mctx.moveTo(-12.5, -0.8);
    mctx.lineTo(-20, -5.5);
    mctx.lineTo(-15.5, -0.2);
    mctx.closePath();
    mctx.fillStyle = "#6e786e";
    mctx.fill();
    mctx.beginPath();
    mctx.moveTo(-12.5, 0.8);
    mctx.lineTo(-20, 5.5);
    mctx.lineTo(-15.5, 0.2);
    mctx.closePath();
    mctx.fill();
    mctx.beginPath();
    mctx.moveTo(-12.2, -1.2);
    mctx.lineTo(-14.8, 0);
    mctx.lineTo(-12.2, 1.2);
    mctx.closePath();
    mctx.fillStyle = "#7f897f";
    mctx.fill();

    mctx.restore();
  }

  function tickFish(dt) {
    if (!mctx || !mulletCanvas) return;
    mctx.clearRect(0, 0, MW, MH);
    var i;
    var drop;
    var prevY;
    var prevX;
    var ny;
    var wx;
    var progress;
    var angle;
    var moveX;

    if (leap) {
      leap.t += dt / leap.dur;
      progress = Math.min(leap.t, 1);
      wx = leap.x0 + leap.dist * leap.dir * progress;
      mulletCanvas.style.left = wx - MW / 2 + "px";

      if (leap.t >= 1) {
        var landX = wx;
        var landDir = leap.dir;
        leap = null;
        leapsLeft -= 1;
        splashWait = leapsLeft > 0 ? randBetween(0.55, 1.2) : randBetween(0.45, 0.85);
        spawnSplash(landX, landDir);
      } else {
        prevX = leap.x0 + leap.dist * leap.dir * Math.max(progress - 0.05, 0);
        prevY = waterY - leap.amp * Math.sin(Math.PI * Math.max(progress - 0.05, 0));
        ny = waterY - leap.amp * Math.sin(Math.PI * progress);
        moveX = wx - prevX;
        // Keep a forward bias so the nose never reads as trailing the leap.
        if (Math.abs(moveX) < 1.5) moveX = leap.dir * 1.5;
        angle = Math.atan2(ny - prevY, moveX);
        drawMullet(MW / 2, ny, angle);
      }
    } else if (splashWait > 0) {
      splashWait -= dt;
      if (splashWait <= 0) {
        if (leapsLeft > 0) startLeap();
        else scheduleQuiet();
      }
    }

    for (i = drops.length - 1; i >= 0; i -= 1) {
      drop = drops[i];
      drop.vy += 420 * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.life -= dt;
      if (drop.life <= 0 || drop.y > MH) {
        drops.splice(i, 1);
        continue;
      }
      mctx.globalAlpha = Math.max(drop.life / 0.45, 0);
      mctx.fillStyle = "#dbe0db";
      mctx.beginPath();
      mctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
      mctx.fill();
      mctx.globalAlpha = 1;
    }
  }

  function tickLab(dt) {
    var mult = gait === "run" ? 1.55 : 1;
    x += dir * speed * mult * 60 * dt;
    place(x);
    face(dir);
    if ((dir > 0 && x > maxX() + petWidth() + 12) || (dir < 0 && x < -petWidth() - 12)) {
      scheduleQuiet();
    }
  }

  window.addEventListener("resize", function () {
    if (mode === "lab") place(x);
  });

  function pickAct() {
    if (Math.random() < 0.45) beginFish();
    else beginLab();
  }

  // Stay quiet for a while before the first pass-through.
  hideAll();
  if (/\bshore=fish\b/.test(location.search)) {
    modeUntil = performance.now() + 300;
    pickAct = beginFish;
  } else if (/\bshore=now\b/.test(location.search)) {
    modeUntil = performance.now() + 400;
  } else {
    modeUntil = performance.now() + randBetween(45000, 150000);
  }
  setSprite("walk");
  place(x);
  face(dir);

  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (document.hidden) {
      window.requestAnimationFrame(tick);
      return;
    }

    if (mode === "fish") {
      tickFish(dt);
      window.requestAnimationFrame(tick);
      return;
    }

    if (mode === "lab") {
      tickLab(dt);
      window.requestAnimationFrame(tick);
      return;
    }

    if (now >= modeUntil) pickAct();
    window.requestAnimationFrame(tick);
  }

  last = performance.now();
  window.requestAnimationFrame(tick);
})();

(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  document.querySelectorAll(".btn").forEach(function (btn) {
    var timer;

    btn.addEventListener("pointerdown", function () {
      window.clearTimeout(timer);
      btn.classList.add("is-acting");
    });

    btn.addEventListener("pointerup", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        btn.classList.remove("is-acting");
      }, 900);
    });

    btn.addEventListener("pointerleave", function () {
      if (btn.matches(":hover")) return;
      window.clearTimeout(timer);
      btn.classList.remove("is-acting");
    });
  });
})();

(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!navToggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  navToggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  var desktopNav = window.matchMedia("(min-width: 40rem)");
  var syncNavForViewport = function () {
    if (desktopNav.matches) {
      setOpen(false);
    }
  };
  if (desktopNav.addEventListener) {
    desktopNav.addEventListener("change", syncNavForViewport);
  } else if (desktopNav.addListener) {
    desktopNav.addListener(syncNavForViewport);
  }
  window.addEventListener("resize", syncNavForViewport, { passive: true });

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !sections.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        links.forEach(function (link) {
          var active = link.getAttribute("href") === id;
          link.classList.toggle("is-active", active);
          if (active) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();

/* Lava lamp fluid — metaball smooth-union motion inspired by brybrant/lava-lamp,
   clipped by DinPX/Lava-Lamp contents + cover shell. Colors follow page accent. */
(function () {
  var canvas = document.querySelector(".lava-lamp__fluid");
  var lamp = document.querySelector(".lava-lamp");
  if (!canvas || !lamp) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  var W = canvas.width;
  var H = canvas.height;
  var img = ctx.createImageData(W, H);
  var data = img.data;

  // Bottle UV band matching DinPX kite contents mask.
  var TOP = 0.1;
  var BOTTOM = 0.74;
  var K = 0.09;
  var BALLSPEED = 0.5;

  var BG_EDGE = [20, 40, 38];
  var BG_MID = [40, 90, 84];
  var LAVA_LO = [180, 230, 220];
  var LAVA_HI = [10, 88, 82];

  function clampByte(n) {
    return Math.max(0, Math.min(255, n | 0));
  }

  function mix(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function shade(c, f) {
    return [c[0] * f, c[1] * f, c[2] * f];
  }

  function parseRgb(str) {
    var m = String(str).match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }

  function lum(c) {
    return c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
  }

  function readPalette() {
    var root = getComputedStyle(document.documentElement);
    var accent =
      parseRgb(getComputedStyle(lamp).color) ||
      parseRgb(root.getPropertyValue("--accent"));
    var hover = parseRgb(root.getPropertyValue("--accent-hover")) || accent;
    var bg = parseRgb(root.getPropertyValue("--bg")) || [246, 245, 242];
    if (!accent) return;

    var isDark = lum(bg) < 128;
    var accentLum = lum(accent);

    // Deep liquid pool so button-colored goo reads clearly.
    if (isDark) {
      BG_EDGE = mix(shade(accent, 0.22), bg, 0.72);
      BG_MID = mix(shade(accent, 0.4), bg, 0.45);
    } else {
      BG_EDGE = mix(shade(accent, 0.28), [28, 26, 22], 0.4);
      BG_MID = mix(shade(accent, 0.5), [42, 38, 32], 0.22);
    }

    // Goo matches primary button fill (--accent) + hover highlight.
    LAVA_HI = accent.slice();
    LAVA_LO = hover.slice();

    if (accentLum > 210) {
      // Pale accents (dark theme): keep goo bright, deepen the liquid.
      BG_EDGE = mix(bg, [0, 0, 0], 0.35);
      BG_MID = mix(shade(accent, 0.35), bg, 0.55);
    } else if (accentLum < 40) {
      // Near-black accents (light theme): lift goo so it still glows.
      LAVA_HI = mix(accent, hover, 0.4);
      LAVA_LO = mix(hover, [245, 240, 230], 0.55);
    }
  }

  function smin(a, b, k) {
    var h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  }

  function sphere(px, py, cx, cy, r) {
    return Math.hypot(px - cx, py - cy) - r;
  }

  var paletteAt = -1;

  function paint(t) {
    // Accent cycles slowly via CSS — refresh palette a few times a second.
    var tick = (t * 4) | 0;
    if (tick !== paletteAt) {
      paletteAt = tick;
      readPalette();
    }

    var time = t * BALLSPEED;
    // Brybrant-style rising/falling blobs in normalized bottle space.
    var blobs = [
      { x: 0.5, y: 0.5 + Math.sin(time + 2) * 0.28, r: 0.13 },
      { x: 0.34, y: 0.5 + Math.sin(time) * 0.22, r: 0.1 },
      { x: 0.66, y: 0.5 + Math.sin(time + 4) * 0.22, r: 0.1 },
      { x: 0.42, y: 0.5 + Math.sin(time * 0.75 + 6) * 0.2, r: 0.12 },
      { x: 0.58, y: 0.5 + Math.sin(time * 0.75 + 9) * 0.2, r: 0.12 }
    ];

    var i = 0;
    for (var y = 0; y < H; y++) {
      var uy = y / (H - 1);
      // Map full canvas y into bottle band used by contents mask (0 top → 1 bottom).
      var by = (uy - TOP) / (BOTTOM - TOP);
      for (var x = 0; x < W; x++) {
        var ux = x / (W - 1);

        // Bottom pool + rising spheres (brybrant smooth-union). Light top film only.
        var dist = 0.92 - by;
        dist = smin(dist, by - 0.02, 0.08);
        for (var b = 0; b < blobs.length; b++) {
          var blob = blobs[b];
          dist = smin(dist, sphere(ux, by, blob.x, blob.y, blob.r), K);
        }

        var edgeX = Math.abs(ux - 0.5) * 2;
        var bgR = BG_EDGE[0] + (BG_MID[0] - BG_EDGE[0]) * (1 - edgeX);
        var bgG = BG_EDGE[1] + (BG_MID[1] - BG_EDGE[1]) * (1 - edgeX);
        var bgB = BG_EDGE[2] + (BG_MID[2] - BG_EDGE[2]) * (1 - edgeX);

        var heat = Math.max(0, Math.min(1, 1 - by));
        var lr = LAVA_LO[0] + (LAVA_HI[0] - LAVA_LO[0]) * (1 - heat * 0.85);
        var lg = LAVA_LO[1] + (LAVA_HI[1] - LAVA_LO[1]) * (1 - heat * 0.85);
        var lb = LAVA_LO[2] + (LAVA_HI[2] - LAVA_LO[2]) * (1 - heat * 0.85);

        // Soft metaball threshold; suppress a hard ceiling film near the lid.
        var lidFade = by < 0.08 ? by / 0.08 : 1;
        var fill = (1 - Math.max(0, Math.min(1, (dist + 0.015) / 0.055))) * lidFade;
        var glow = Math.pow(Math.max(0, Math.min(1, (-dist + 0.03) / 0.1)), 1.5) * lidFade;

        var r = bgR + (lr - bgR) * fill;
        var g = bgG + (lg - bgG) * fill;
        var bl = bgB + (lb - bgB) * fill;
        r = Math.min(255, r + glow * 36);
        g = Math.min(255, g + glow * 28);
        bl = Math.min(255, bl + glow * 22);

        data[i++] = clampByte(r);
        data[i++] = clampByte(g);
        data[i++] = clampByte(bl);
        data[i++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  readPalette();

  if (reduce.matches) {
    paint(0);
    return;
  }

  var start = performance.now();
  function frame(now) {
    paint((now - start) / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
