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
    // Local +x is the head. Angle comes from path tangent so the nose leads.
    mctx.rotate(angle);

    // Body — thicker toward the head
    mctx.beginPath();
    mctx.moveTo(-17, 0);
    mctx.bezierCurveTo(-14, -5.2, -2, -6.2, 8, -4.2);
    mctx.bezierCurveTo(14, -2.8, 18, -1.2, 19.5, 0);
    mctx.bezierCurveTo(18, 1.2, 14, 2.8, 8, 4.2);
    mctx.bezierCurveTo(-2, 6.2, -14, 5.2, -17, 0);
    mctx.closePath();
    mctx.fillStyle = "#b9c2b9";
    mctx.fill();

    // Olive back
    mctx.beginPath();
    mctx.moveTo(-14, -1.2);
    mctx.bezierCurveTo(-6, -5.4, 4, -5.6, 12, -2.4);
    mctx.bezierCurveTo(4, -3.8, -6, -3.4, -14, -1.2);
    mctx.closePath();
    mctx.fillStyle = "#5f6a60";
    mctx.fill();

    // Forked tail at the rear (−x)
    mctx.beginPath();
    mctx.moveTo(-15, 0);
    mctx.lineTo(-24, -5.8);
    mctx.quadraticCurveTo(-19.5, -1.2, -17.5, 0);
    mctx.quadraticCurveTo(-19.5, 1.2, -24, 5.8);
    mctx.closePath();
    mctx.fillStyle = "#7d877d";
    mctx.fill();

    // Dorsal fin
    mctx.beginPath();
    mctx.moveTo(-1, -4.6);
    mctx.lineTo(5, -9.4);
    mctx.lineTo(9, -3.8);
    mctx.closePath();
    mctx.fillStyle = "#4d574d";
    mctx.fill();

    // Eye near the snout
    mctx.beginPath();
    mctx.arc(11.5, -0.9, 1.25, 0, Math.PI * 2);
    mctx.fillStyle = "#141a15";
    mctx.fill();
    mctx.beginPath();
    mctx.arc(11.85, -1.15, 0.35, 0, Math.PI * 2);
    mctx.fillStyle = "#dfe6df";
    mctx.fill();

    // Snout tip
    mctx.beginPath();
    mctx.moveTo(17.5, -0.6);
    mctx.lineTo(21, 0.15);
    mctx.lineTo(17.5, 1.1);
    mctx.closePath();
    mctx.fillStyle = "#9aa49a";
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
    var angle;
    var wx;
    var progress;

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
        prevX = leap.x0 + leap.dist * leap.dir * Math.max(progress - 0.04, 0);
        prevY = waterY - leap.amp * Math.sin(Math.PI * Math.max(progress - 0.04, 0));
        ny = waterY - leap.amp * Math.sin(Math.PI * progress);
        // Signed dx keeps the head aimed along the leap.
        angle = Math.atan2(ny - prevY, wx - prevX);
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

  // Stay quiet for a while before the first pass-through.
  hideAll();
  modeUntil =
    performance.now() +
    (/\bshore=now\b/.test(location.search)
      ? 400
      : randBetween(45000, 150000));
  setSprite("walk");
  place(x);
  face(dir);

  function pickAct() {
    if (Math.random() < 0.45) beginFish();
    else beginLab();
  }

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
