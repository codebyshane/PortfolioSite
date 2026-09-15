(function () {
  var lab = document.querySelector(".lab");
  var track = document.querySelector(".shore");
  var mulletCanvas = document.querySelector(".mullet");
  if (!lab || !track) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SPRITES = {
    idle: "images/pets/dog-idle.gif",
    lie: "images/pets/dog-lie.gif",
    walk: "images/pets/dog-walk.gif",
    walkFast: "images/pets/dog-walk-fast.gif",
    run: "images/pets/dog-run.gif"
  };
  // Modeled on vscode-pets dog sequence + hold times (tonybaloney/vscode-pets).
  var SEQUENCE = {
    sit: ["walkRight", "runRight", "lie"],
    lie: ["walkRight", "runRight"],
    walkRight: ["walkLeft", "runLeft"],
    runRight: ["walkLeft", "runLeft"],
    walkLeft: ["sit", "lie", "walkRight", "runRight"],
    runLeft: ["sit", "lie", "walkRight", "runRight"]
  };
  var HOLD = {
    sit: [2800, 6500],
    lie: [3200, 7200],
    walkRight: [4500, 9000],
    walkLeft: [4500, 9000],
    runRight: [2200, 5200],
    runLeft: [2200, 5200]
  };

  function randBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
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

  if (reduce.matches) {
    setSprite("idle");
    place(24);
    face(1);
    lab.style.opacity = "1";
    lab.style.cursor = "default";
    if (mulletCanvas) mulletCanvas.style.display = "none";
    return;
  }

  var state = "sit";
  var dir = 1;
  var x = Math.min(40, maxX());
  var speed = 3 * randBetween(0.7, 1.3);
  var stateUntil = 0;
  var follow = null;
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

  function showLab(on) {
    lab.style.opacity = on ? "1" : "0";
    lab.style.pointerEvents = on ? "auto" : "none";
    if (mulletCanvas) {
      mulletCanvas.style.opacity = on ? "0" : "1";
      if (on) {
        mctx && mctx.clearRect(0, 0, MW, MH);
      }
    }
  }

  function scheduleNextAct() {
    // Sporadic gaps: sometimes a short beat, sometimes a long quiet shore.
    var quiet = Math.random() < 0.35;
    mode = "idle";
    showLab(false);
    modeUntil = performance.now() + (quiet ? randBetween(6000, 18000) : randBetween(1800, 5000));
  }

  function beginLab() {
    mode = "lab";
    leap = null;
    drops = [];
    if (mctx) mctx.clearRect(0, 0, MW, MH);
    speed = 3 * randBetween(0.7, 1.3);
    state = pick(["sit", "sit", "lie", "walkRight"]);
    dir = state.indexOf("Left") >= 0 ? -1 : 1;
    if (state === "sit" || state === "lie") dir = Math.random() < 0.5 ? -1 : 1;
    x = randBetween(12, Math.max(12, maxX() - 12));
    applyState(state);
    showLab(true);
    // Lab hangs around for a stretch, then yields to the mullet or a quiet gap.
    modeUntil = performance.now() + randBetween(10000, 26000);
  }

  function beginFish() {
    mode = "fish";
    leapsLeft = 1 + Math.floor(Math.random() * 3);
    splashWait = randBetween(0.35, 0.9);
    leap = null;
    drops = [];
    if (mctx) mctx.clearRect(0, 0, MW, MH);
    showLab(false);
  }

  function applyState(next) {
    state = next;
    var hold = HOLD[state] || [3000, 5000];
    stateUntil = performance.now() + randBetween(hold[0], hold[1]);
    if (state === "sit") {
      setSprite("idle");
      dir = Math.random() < 0.5 ? -1 : 1;
    } else if (state === "lie") {
      setSprite("lie");
      dir = Math.random() < 0.5 ? -1 : 1;
    } else if (state === "walkRight") {
      setSprite("walk");
      dir = 1;
    } else if (state === "walkLeft") {
      setSprite("walk");
      dir = -1;
    } else if (state === "runRight") {
      setSprite(Math.random() < 0.55 ? "walkFast" : "run");
      dir = 1;
    } else if (state === "runLeft") {
      setSprite(Math.random() < 0.55 ? "walkFast" : "run");
      dir = -1;
    }
    face(dir);
  }

  function chooseNextState() {
    var options = SEQUENCE[state] || SEQUENCE.sit;
    applyState(pick(options));
  }

  function startLeap() {
    var span = Math.max(track.clientWidth - 200, 100);
    var dirSign = Math.random() < 0.5 ? 1 : -1;
    var dist = randBetween(70, 130);
    var x0 = randBetween(60, span);
    // Keep the whole arc on the shore.
    if (dirSign > 0 && x0 + dist > span + 40) dirSign = -1;
    if (dirSign < 0 && x0 - dist < 40) dirSign = 1;
    leap = {
      t: 0,
      dur: randBetween(0.68, 0.95),
      x0: x0,
      dist: dist,
      amp: randBetween(38, 58),
      dir: dirSign
    };
  }

  function spawnSplash(wx, dirSign) {
    var i;
    for (i = 0; i < 12; i += 1) {
      drops.push({
        x: MW / 2 + (Math.random() - 0.5) * 22,
        y: waterY,
        vx: (Math.random() - 0.5) * 90 + dirSign * 18,
        vy: -50 - Math.random() * 90,
        life: 0.28 + Math.random() * 0.28,
        r: 1.1 + Math.random() * 1.4
      });
    }
    mulletCanvas.style.left = wx - MW / 2 + "px";
  }

  function drawMullet(px, py, angle, facing) {
    mctx.save();
    mctx.translate(px, py);
    mctx.scale(facing, 1);
    mctx.rotate(angle * facing);

    // Silver Florida mullet — head leads toward +x before scale.
    mctx.beginPath();
    mctx.ellipse(0, 0, 18, 5.4, 0, 0, Math.PI * 2);
    mctx.fillStyle = "#c5cdc6";
    mctx.fill();

    mctx.beginPath();
    mctx.ellipse(-1, -1.8, 15, 2.8, 0, 0, Math.PI * 2);
    mctx.fillStyle = "#6f7a70";
    mctx.fill();

    // Darker olive back stripe
    mctx.beginPath();
    mctx.ellipse(-2, -2.4, 12, 1.4, 0, 0, Math.PI * 2);
    mctx.fillStyle = "#4e5850";
    mctx.fill();

    // Forked tail (rear / -x)
    mctx.beginPath();
    mctx.moveTo(-16, 0);
    mctx.lineTo(-24, -5.2);
    mctx.lineTo(-20, 0);
    mctx.lineTo(-24, 5.2);
    mctx.closePath();
    mctx.fillStyle = "#8a948a";
    mctx.fill();

    // Dorsal
    mctx.beginPath();
    mctx.moveTo(-2, -4.8);
    mctx.lineTo(4, -9.2);
    mctx.lineTo(8, -3.6);
    mctx.closePath();
    mctx.fillStyle = "#556055";
    mctx.fill();

    // Anal fin
    mctx.beginPath();
    mctx.moveTo(2, 4.2);
    mctx.lineTo(6, 7.2);
    mctx.lineTo(9, 3.4);
    mctx.closePath();
    mctx.fillStyle = "#6a746a";
    mctx.fill();

    // Eye near the head (+x)
    mctx.beginPath();
    mctx.arc(10, -0.8, 1.2, 0, Math.PI * 2);
    mctx.fillStyle = "#1a211c";
    mctx.fill();

    // Mouth tip
    mctx.beginPath();
    mctx.moveTo(16.5, 0.4);
    mctx.lineTo(19.5, 1.2);
    mctx.lineTo(16.5, 1.6);
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
        splashWait = leapsLeft > 0 ? randBetween(0.45, 1.35) : randBetween(0.6, 1.1);
        spawnSplash(landX, landDir);
      } else {
        prevY = waterY - leap.amp * Math.sin(Math.PI * Math.max(progress - 0.03, 0));
        ny = waterY - leap.amp * Math.sin(Math.PI * progress);
        // Angle from path tangent; facing handles left/right so head always leads.
        angle = Math.atan2(ny - prevY, Math.abs(leap.dist * 0.03));
        drawMullet(MW / 2, ny, angle, leap.dir);
      }
    } else if (splashWait > 0) {
      splashWait -= dt;
      if (splashWait <= 0) {
        if (leapsLeft > 0) startLeap();
        else scheduleNextAct();
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

  function tickLab(dt, now) {
    var moving = state.indexOf("walk") === 0 || state.indexOf("run") === 0;
    var mult = state.indexOf("run") === 0 ? 1.6 : 1;
    var step;

    if (moving) {
      if (follow !== null) {
        var targetDir = follow >= x ? 1 : -1;
        if (targetDir !== dir) {
          applyState(targetDir > 0 ? (mult > 1 ? "runRight" : "walkRight") : (mult > 1 ? "runLeft" : "walkLeft"));
        }
      }
      step = speed * mult * 60 * dt;
      x += dir * step;
      if (x <= 0) {
        x = 0;
        applyState(mult > 1 ? "runRight" : "walkRight");
      } else if (x >= maxX()) {
        x = maxX();
        applyState(mult > 1 ? "runLeft" : "walkLeft");
      } else if (now >= stateUntil) {
        chooseNextState();
      }
    } else if (now >= stateUntil) {
      chooseNextState();
    }

    place(x);
    face(dir);
  }

  lab.addEventListener("click", function () {
    if (mode !== "lab") return;
    applyState(dir > 0 ? "runRight" : "runLeft");
  });

  window.addEventListener("mousemove", function (event) {
    var rect = track.getBoundingClientRect();
    if (Math.abs(event.clientY - rect.bottom) < 100) {
      follow = event.clientX - rect.left - petWidth() / 2;
    } else {
      follow = null;
    }
  });

  window.addEventListener("resize", function () {
    x = Math.min(x, maxX());
    place(x);
  });

  // First appearance after a short, irregular pause.
  mode = "idle";
  showLab(false);
  modeUntil =
    performance.now() +
    (/\bshore=now\b/.test(location.search)
      ? 200
      : randBetween(2500, 8000));
  setSprite("idle");
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

    if (mode === "idle") {
      if (now >= modeUntil) {
        if (Math.random() < 0.28) beginFish();
        else beginLab();
      }
      window.requestAnimationFrame(tick);
      return;
    }

    // lab mode
    if (now >= modeUntil) {
      if (Math.random() < 0.55) beginFish();
      else scheduleNextAct();
      window.requestAnimationFrame(tick);
      return;
    }

    tickLab(dt, now);
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
