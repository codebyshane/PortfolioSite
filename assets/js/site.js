(function () {
  var lab = document.querySelector(".lab");
  var track = document.querySelector(".shore");
  var mullet = document.querySelector(".mullet");
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
    if (mullet) mullet.style.display = "none";
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

  // Mullet sprite sheet: 10 frames × 40×32, shown at 60×48.
  var MULLET_FRAMES = 10;
  var MULLET_FW = 60;
  var MULLET_FH = 48;
  var mulletFrame = 0;

  function hideAll() {
    mode = "idle";
    leap = null;
    lab.style.opacity = "0";
    lab.style.pointerEvents = "none";
    if (mullet) {
      mullet.style.opacity = "0";
      mullet.style.bottom = "-2px";
    }
  }

  function scheduleQuiet() {
    hideAll();
    // Long gaps so the shore usually looks empty.
    modeUntil = performance.now() + randBetween(90000, 240000);
  }

  function setMulletFrame(i) {
    mulletFrame = Math.max(0, Math.min(MULLET_FRAMES - 1, i | 0));
    if (!mullet) return;
    mullet.style.backgroundPosition = -mulletFrame * MULLET_FW + "px 0";
  }

  function placeMullet(wx, lift, dirSign) {
    if (!mullet) return;
    mullet.style.left = wx - MULLET_FW / 2 + "px";
    mullet.style.bottom = -2 + lift + "px";
    mullet.style.transform = "scaleX(" + dirSign + ")";
  }

  function beginLab() {
    mode = "lab";
    leap = null;
    dir = Math.random() < 0.5 ? 1 : -1;
    // Mostly a slow wander; rarely a slightly quicker amble — never a dash.
    gait = Math.random() < 0.2 ? "amble" : "walk";
    speed = (gait === "amble" ? 1.55 : 1.05) * randBetween(0.9, 1.12);
    x = dir > 0 ? -petWidth() - 8 : maxX() + petWidth() + 8;
    setSprite(gait === "amble" ? "walkFast" : "walk");
    face(dir);
    place(x);
    lab.style.opacity = "1";
    if (mullet) mullet.style.opacity = "0";
  }

  function beginFish() {
    mode = "fish";
    leapsLeft = Math.random() < 0.7 ? 1 : 2;
    splashWait = randBetween(0.35, 0.9);
    leap = null;
    lab.style.opacity = "0";
    if (mullet) {
      mullet.style.opacity = "0";
      setMulletFrame(0);
      placeMullet(track.clientWidth * 0.5, 0, 1);
    }
  }

  function startLeap() {
    var span = Math.max(track.clientWidth - 120, 80);
    var dirSign = Math.random() < 0.5 ? 1 : -1;
    var dist = randBetween(54, 92);
    var x0 = randBetween(50, span);
    if (dirSign > 0 && x0 + dist > span + 30) dirSign = -1;
    if (dirSign < 0 && x0 - dist < 30) dirSign = 1;
    leap = {
      t: 0,
      dur: randBetween(0.72, 0.98),
      x0: x0,
      dist: dist,
      amp: randBetween(28, 44),
      dir: dirSign
    };
    setMulletFrame(0);
    if (mullet) mullet.style.opacity = "1";
  }

  function tickFish(dt) {
    if (!mullet) return;
    var progress;
    var wx;
    var lift;
    var frame;

    if (leap) {
      leap.t += dt / leap.dur;
      progress = Math.min(leap.t, 1);
      wx = leap.x0 + leap.dist * leap.dir * progress;
      // Arc rises from under the footer line into view, then back down.
      lift = leap.amp * Math.sin(Math.PI * progress);

      // Frames 0–6: leap body. Frames 7–9: splash / exit.
      if (progress < 0.82) {
        frame = Math.floor((progress / 0.82) * 7);
      } else {
        frame = 7 + Math.floor(((progress - 0.82) / 0.18) * 3);
      }
      setMulletFrame(frame);
      placeMullet(wx, lift, leap.dir);

      if (leap.t >= 1) {
        var landX = wx;
        var landDir = leap.dir;
        leap = null;
        leapsLeft -= 1;
        splashWait = leapsLeft > 0 ? randBetween(0.55, 1.2) : randBetween(0.35, 0.7);
        setMulletFrame(9);
        placeMullet(landX, 2, landDir);
      }
    } else if (splashWait > 0) {
      splashWait -= dt;
      if (splashWait <= 0) {
        if (leapsLeft > 0) startLeap();
        else scheduleQuiet();
      }
    }
  }

  function tickLab(dt) {
    x += dir * speed * 60 * dt;
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
   clipped by DinPX/Lava-Lamp contents + cover shell.
   Brand-colored Lava Lite: wax tracks accent; liquid is a classic companion hue. */
(function () {
  var lamps = Array.prototype.slice.call(document.querySelectorAll(".lava-lamp"));
  if (!lamps.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var BALLSPEED = 0.48;
  var TOP = 0.1;
  var BOTTOM = 0.74;
  var K = 0.1;

  var BG_EDGE = [48, 20, 72];
  var BG_MID = [92, 36, 130];
  var LAVA_LO = [126, 212, 203];
  var LAVA_HI = [10, 88, 82];
  var LAVA_CORE = [200, 230, 220];

  var instances = lamps
    .map(function (lamp) {
      var canvas = lamp.querySelector(".lava-lamp__fluid");
      if (!canvas) return null;
      var ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return null;
      return {
        lamp: lamp,
        canvas: canvas,
        ctx: ctx,
        w: canvas.width,
        h: canvas.height,
        img: ctx.createImageData(canvas.width, canvas.height)
      };
    })
    .filter(Boolean);

  if (!instances.length) return;

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

  function parseRgb(str) {
    var m = String(str).match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }

  function lum(c) {
    return c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0;
    var s = 0;
    var l = (max + min) / 2;
    var d = max - min;
    if (d > 0.0001) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s, l];
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    var r;
    var g;
    var b;
    if (s < 0.0001) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
  }

  // Classic companion liquid by wax hue family.
  function companionLiquidHue(gooHue) {
    var h = ((gooHue % 360) + 360) % 360;
    if (h < 195 || h >= 340) return 288; // warm / teal → purple
    if (h < 255) return 36; // blue → amber
    return 198; // purple / pink → teal-blue
  }

  // Keep wax close to accent; only nudge lightness so it still pops on liquid.
  function waxFromAccent(accent, isDark) {
    var hsl = rgbToHsl(accent[0], accent[1], accent[2]);
    var s = Math.min(1, Math.max(hsl[1], isDark ? 0.55 : 0.6));
    var l = hsl[2];
    if (isDark) {
      if (l < 0.4) l = l * 0.35 + 0.52;
      else if (l < 0.55) l = Math.min(0.68, l + 0.08);
    } else if (l > 0.78) {
      l = l * 0.55 + 0.22;
    } else if (l < 0.22) {
      l = 0.34;
    }
    return hslToRgb(hsl[0], s, l);
  }

  function readPalette() {
    var root = getComputedStyle(document.documentElement);
    var accent =
      parseRgb(getComputedStyle(instances[0].lamp).color) ||
      parseRgb(root.getPropertyValue("--accent"));
    var hover = parseRgb(root.getPropertyValue("--accent-hover")) || accent;
    var bg = parseRgb(root.getPropertyValue("--bg")) || [246, 245, 242];
    if (!accent) return;

    var isDark = lum(bg) < 128;
    var hsl = rgbToHsl(accent[0], accent[1], accent[2]);
    var liqHue = companionLiquidHue(hsl[0]);

    // Body = accent; highlight = accent-hover; tiny warm spark only in the core.
    LAVA_HI = waxFromAccent(accent, isDark);
    LAVA_LO = waxFromAccent(hover, isDark);
    LAVA_CORE = mix(LAVA_LO, [255, 248, 230], 0.35);

    if (isDark) {
      BG_EDGE = hslToRgb(liqHue, 0.52, 0.14);
      BG_MID = hslToRgb(liqHue, 0.56, 0.24);
    } else {
      var milky = hslToRgb(liqHue, 0.12, 0.94);
      var cream = [252, 249, 244];
      BG_EDGE = mix(cream, milky, 0.3);
      BG_MID = mix(cream, milky, 0.5);
    }

    var waxL = lum(LAVA_HI);
    var liqL = (lum(BG_EDGE) + lum(BG_MID)) / 2;
    if (isDark && waxL < liqL + 50) {
      LAVA_HI = mix(LAVA_HI, [255, 255, 255], 0.18);
      LAVA_LO = mix(LAVA_LO, [255, 255, 255], 0.12);
    } else if (!isDark && Math.abs(waxL - liqL) < 40) {
      LAVA_HI = mix(LAVA_HI, [30, 28, 26], 0.12);
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

  function paintInstance(inst, t) {
    var W = inst.w;
    var H = inst.h;
    var data = inst.img.data;
    var time = t * BALLSPEED;
    // Heater pool + separate rising blobs with soft merge necks.
    var blobs = [
      { x: 0.5, y: 0.82 + Math.sin(time * 0.85) * 0.05, r: 0.22 },
      { x: 0.5, y: 0.48 + Math.sin(time + 2.1) * 0.28, r: 0.135 },
      { x: 0.3, y: 0.52 + Math.sin(time * 0.92 + 0.6) * 0.25, r: 0.105 },
      { x: 0.7, y: 0.5 + Math.sin(time + 4.1) * 0.23, r: 0.105 },
      { x: 0.4, y: 0.46 + Math.sin(time * 0.68 + 6.2) * 0.22, r: 0.12 },
      { x: 0.6, y: 0.5 + Math.sin(time * 0.68 + 9.1) * 0.21, r: 0.115 }
    ];

    var i = 0;
    var y;
    var x;
    for (y = 0; y < H; y++) {
      var uy = y / (H - 1);
      var by = (uy - TOP) / (BOTTOM - TOP);
      for (x = 0; x < W; x++) {
        var ux = x / (W - 1);

        // Bottom wax pool (heater) + rising metaballs.
        var dist = 0.84 - by;
        dist = smin(dist, by - 0.012, 0.05);
        var b;
        for (b = 0; b < blobs.length; b++) {
          var blob = blobs[b];
          dist = smin(dist, sphere(ux, by, blob.x, blob.y, blob.r), K);
        }

        var edgeX = Math.abs(ux - 0.5) * 2;
        var bgR = BG_EDGE[0] + (BG_MID[0] - BG_EDGE[0]) * (1 - edgeX * 0.85);
        var bgG = BG_EDGE[1] + (BG_MID[1] - BG_EDGE[1]) * (1 - edgeX * 0.85);
        var bgB = BG_EDGE[2] + (BG_MID[2] - BG_EDGE[2]) * (1 - edgeX * 0.85);

        // Soft glass glint so the vessel reads as liquid in a bottle.
        var glint = Math.exp(-Math.pow((ux - 0.28) / 0.1, 2)) * 0.12 * (1 - by * 0.35);
        bgR = Math.min(255, bgR + glint * 70);
        bgG = Math.min(255, bgG + glint * 70);
        bgB = Math.min(255, bgB + glint * 65);

        // Hotter wax near the base; cooler rims, hotter cores.
        var heat = Math.max(0, Math.min(1, 1 - by));
        var lr = LAVA_LO[0] + (LAVA_HI[0] - LAVA_LO[0]) * (1 - heat * 0.65);
        var lg = LAVA_LO[1] + (LAVA_HI[1] - LAVA_LO[1]) * (1 - heat * 0.65);
        var lb = LAVA_LO[2] + (LAVA_HI[2] - LAVA_LO[2]) * (1 - heat * 0.65);

        var lidFade = by < 0.06 ? by / 0.06 : 1;
        var fill = (1 - Math.max(0, Math.min(1, (dist + 0.008) / 0.04))) * lidFade;
        fill = Math.pow(Math.max(0, fill), 0.8);
        // Tight hot spark — accent carries the blob, not a gold wash.
        var core = Math.pow(Math.max(0, Math.min(1, (-dist + 0.008) / 0.045)), 2.4) * lidFade;
        var rim = Math.pow(Math.max(0, Math.min(1, 1 - Math.abs(dist) / 0.05)), 1.2) * fill;
        var glow = Math.pow(Math.max(0, Math.min(1, (-dist + 0.035) / 0.11)), 1.35) * lidFade;

        var waxR = lr + (bgR - lr) * rim * 0.1;
        var waxG = lg + (bgG - lg) * rim * 0.1;
        var waxB = lb + (bgB - lb) * rim * 0.1;
        waxR = waxR + (LAVA_CORE[0] - waxR) * core * 0.32;
        waxG = waxG + (LAVA_CORE[1] - waxG) * core * 0.32;
        waxB = waxB + (LAVA_CORE[2] - waxB) * core * 0.32;

        var r = bgR + (waxR - bgR) * fill;
        var g = bgG + (waxG - bgG) * fill;
        var bl = bgB + (waxB - bgB) * fill;
        // Neutral lift so glow doesn't skew yellow.
        var lift = glow * 28 + core * 18;
        r = Math.min(255, r + lift);
        g = Math.min(255, g + lift * 0.92);
        bl = Math.min(255, bl + lift * 0.88);

        data[i++] = clampByte(r);
        data[i++] = clampByte(g);
        data[i++] = clampByte(bl);
        data[i++] = 255;
      }
    }
    inst.ctx.putImageData(inst.img, 0, 0);
  }

  function paint(t) {
    var tick = (t * 4) | 0;
    if (tick !== paletteAt) {
      paletteAt = tick;
      readPalette();
    }
    instances.forEach(function (inst) {
      paintInstance(inst, t);
    });
  }

  function clearFocus() {
    instances.forEach(function (inst) {
      inst.lamp.classList.remove("is-focused");
      inst.lamp.setAttribute("aria-pressed", "false");
    });
  }

  function toggleFocus(lamp) {
    var wasFocused = lamp.classList.contains("is-focused");
    clearFocus();
    if (!wasFocused) {
      lamp.classList.add("is-focused");
      lamp.setAttribute("aria-pressed", "true");
    }
  }

  instances.forEach(function (inst) {
    inst.lamp.addEventListener("click", function () {
      toggleFocus(inst.lamp);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") clearFocus();
  });

  document.addEventListener("pointerdown", function (e) {
    if (!e.target.closest || e.target.closest(".lava-lamp")) return;
    clearFocus();
  });

  readPalette();
  paint(0);

  if (reduce.matches) return;

  var start = performance.now();
  function frame(now) {
    paint((now - start) / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
