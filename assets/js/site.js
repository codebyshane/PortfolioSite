(function () {
  var canvas = document.querySelector(".lab");
  var track = document.querySelector(".shore");
  var mulletCanvas = document.querySelector(".mullet");
  if (!canvas || !track || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var cols = 32;
  var rows = 16;
  var display = 64;
  var palette = {
    "1": "#1a0e08",
    "2": "#3a2012",
    "3": "#5c341c",
    "4": "#7a4a26",
    "5": "#d2b48c",
    "6": "#0c0806"
  };

  var sit = [
    "................................",
    "......11........11111...........",
    ".....1331......1333331..........",
    ".....13431....134444331.........",
    "......1331....134555431.........",
    ".......11.....136155431.........",
    ".....11111111333333311..........",
    "....133333333333333331..........",
    "...13333333333333333331.........",
    "..133333333333333333331.........",
    "..133331113331133311331.........",
    "..13331...1331.1331.131.........",
    "..1111....1111.1111.11..........",
    "................................",
    "................................",
    "................................"
  ];
  var sit2 = [
    "................................",
    "....11..........11111...........",
    "...1331........1333331..........",
    "...13431......134444331.........",
    "....1331......134555431.........",
    ".....11.......136155431.........",
    ".....11111111333333311..........",
    "....133333333333333331..........",
    "...13333333333333333331.........",
    "..133333333333333333331.........",
    "..133331113331133311331.........",
    "..13331...1331.1331.131.........",
    "..1111....1111.1111.11..........",
    "................................",
    "................................",
    "................................"
  ];
  var walk = [
    [
      "................................",
      "......11.........1111...........",
      ".....1331.......133331..........",
      ".....13431.....13444331.........",
      "......1331.....13555431.........",
      ".......11......13655431.........",
      ".....1111111133333331...........",
      "....133333333333333331..........",
      "...13333333333333333331.........",
      "..1331..133333333333331.........",
      "..1331..13331..1331.131.........",
      "...11...1331...1331.11..........",
      "........111....111..11..........",
      "................................",
      "................................",
      "................................"
    ],
    [
      "................................",
      "......11.........1111...........",
      ".....1331.......133331..........",
      ".....13431.....13444331.........",
      "......1331.....13555431.........",
      ".......11......13655431.........",
      ".....1111111133333331...........",
      "....133333333333333331..........",
      "...13333333333333333331.........",
      "..133333333333333333331.........",
      "...1333...1333...13331..........",
      "....133...1331...1331...........",
      "....11.....11.....11............",
      "................................",
      "................................",
      "................................"
    ],
    [
      "................................",
      "......11.........1111...........",
      ".....1331.......133331..........",
      ".....13431.....13444331.........",
      "......1331.....13555431.........",
      ".......11......13655431.........",
      ".....1111111133333331...........",
      "....133333333333333331..........",
      "...13333333333333333331.........",
      "..1331.1333333333333331.........",
      "..1331.1331.1331...131..........",
      "...11..1331.1331...11...........",
      ".......11....11....11...........",
      "................................",
      "................................",
      "................................"
    ],
    [
      "................................",
      "......11.........1111...........",
      ".....1331.......133331..........",
      ".....13431.....13444331.........",
      "......1331.....13555431.........",
      ".......11......13655431.........",
      ".....1111111133333331...........",
      "....133333333333333331..........",
      "...13333333333333333331.........",
      "..133333333333333333331.........",
      "..13331.13331.1331.1331.........",
      "..1331..1331..1331..11..........",
      "..111...111...111...11..........",
      "................................",
      "................................",
      "................................"
    ]
  ];
  var lie = [
    "................................",
    "......11........................",
    ".....1331.......................",
    ".....13431...111111111..........",
    "......1331..13333333331.........",
    ".......11..134444444331.........",
    "..........1355555543331.........",
    "..........1363333333331.........",
    "..........1333333333331.........",
    ".........1111.11.11.111.........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................"
  ];
  var jump = [
    "................................",
    "......11.........1111...........",
    ".....1331.......133331..........",
    ".....13431.....13444331.........",
    "......1331.....13555431.........",
    ".......11......13655431.........",
    ".....1111111133333331...........",
    "....133333333333333331..........",
    "...13333333333333333331.........",
    "..1333333....133333331..........",
    "..133331......1333331...........",
    "...1111........11111............",
    "................................",
    "................................",
    "................................",
    "................................"
  ];

  function paint(grid) {
    ctx.clearRect(0, 0, cols, rows);
    ctx.imageSmoothingEnabled = false;
    var y;
    var x;
    var ch;
    var color;
    for (y = 0; y < rows; y += 1) {
      for (x = 0; x < cols; x += 1) {
        ch = grid[y].charAt(x);
        color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function frameFor(state, frame) {
    if (state === "sit") return frame % 2 === 0 ? sit : sit2;
    if (state === "lie") return lie;
    if (state === "jump") return jump;
    return walk[frame % walk.length];
  }

  function maxX() {
    return Math.max(track.clientWidth - display, 0);
  }

  function place(x, y, dir) {
    canvas.style.left = x + "px";
    canvas.style.transform =
      "scaleX(" + dir + ") translateY(" + y + "px)";
  }

  if (reduce.matches) {
    paint(sit);
    place(24, 0, 1);
    canvas.style.cursor = "default";
    if (mulletCanvas) mulletCanvas.style.display = "none";
    return;
  }

  var state = "sit";
  var dir = 1;
  var x = 24;
  var y = 0;
  var vy = 0;
  var frame = 0;
  var frameAcc = 0;
  var stateUntil = 0;
  var follow = null;
  var last = 0;
  var mode = "lab";
  var modeUntil = 0;
  var leapsLeft = 0;
  var leap = null;
  var splashWait = 0;
  var drops = [];
  var mctx = mulletCanvas ? mulletCanvas.getContext("2d") : null;

  function showLab(on) {
    canvas.style.opacity = on ? "1" : "0";
    canvas.style.pointerEvents = on ? "auto" : "none";
    if (mulletCanvas) {
      mulletCanvas.style.opacity = on ? "0" : "1";
    }
  }

  function beginFish() {
    mode = "fish";
    leapsLeft = 1 + Math.floor(Math.random() * 3);
    splashWait = 0.2;
    leap = null;
    drops = [];
    showLab(false);
  }

  function beginLab() {
    mode = "lab";
    leap = null;
    drops = [];
    if (mctx) mctx.clearRect(0, 0, 160, 96);
    showLab(true);
    modeUntil = performance.now() + 11000 + Math.random() * 7000;
    stateUntil = performance.now() + 1400;
  }

  function startLeap() {
    var span = Math.max(track.clientWidth - 180, 80);
    leap = {
      t: 0,
      dur: 0.72 + Math.random() * 0.28,
      x0: 50 + Math.random() * span,
      dist: 64 + Math.random() * 86,
      amp: 34 + Math.random() * 20,
      dir: Math.random() < 0.5 ? 1 : -1
    };
  }

  function spawnSplash(wx) {
    var i;
    for (i = 0; i < 9; i += 1) {
      drops.push({
        x: 80 + (Math.random() - 0.5) * 18,
        y: 90,
        vx: (Math.random() - 0.5) * 70,
        vy: -40 - Math.random() * 70,
        life: 0.28 + Math.random() * 0.22
      });
    }
    mulletCanvas.style.left = wx - 80 + "px";
  }

  function drawMullet(px, py, angle, flap) {
    mctx.save();
    mctx.translate(px, py);
    mctx.rotate(angle);
    mctx.beginPath();
    mctx.ellipse(0, 0, 15, 4.6, 0, 0, Math.PI * 2);
    mctx.fillStyle = "#b7c0b8";
    mctx.fill();
    mctx.beginPath();
    mctx.ellipse(-1.5, -1.6, 13, 2.4, 0, 0, Math.PI * 2);
    mctx.fillStyle = "#6d7870";
    mctx.fill();
    mctx.beginPath();
    mctx.moveTo(14, 0);
    mctx.lineTo(19, -3.4 - flap);
    mctx.lineTo(16.5, 0);
    mctx.lineTo(19, 3.4 + flap);
    mctx.closePath();
    mctx.fillStyle = "#8b948c";
    mctx.fill();
    mctx.beginPath();
    mctx.moveTo(-2, -4.4);
    mctx.lineTo(3, -8);
    mctx.lineTo(6, -3.2);
    mctx.closePath();
    mctx.fillStyle = "#5c665e";
    mctx.fill();
    mctx.beginPath();
    mctx.arc(-9.5, -0.6, 1.05, 0, Math.PI * 2);
    mctx.fillStyle = "#1c211e";
    mctx.fill();
    mctx.restore();
  }

  function tickFish(dt) {
    if (!mctx) return;
    mctx.clearRect(0, 0, 160, 96);
    var i;
    var drop;
    var prevY;
    var ny;
    var angle;

    if (leap) {
      leap.t += dt / leap.dur;
      if (leap.t >= 1) {
        spawnSplash(leap.x0 + leap.dist * leap.dir);
        leap = null;
        leapsLeft -= 1;
        splashWait = leapsLeft > 0 ? 0.18 + Math.random() * 0.28 : 0.55;
      } else {
        var wx = leap.x0 + leap.dist * leap.dir * leap.t;
        mulletCanvas.style.left = wx - 80 + "px";
        prevY = 90 - leap.amp * Math.sin(Math.PI * Math.max(leap.t - 0.02, 0));
        ny = 90 - leap.amp * Math.sin(Math.PI * leap.t);
        angle = Math.atan2(ny - prevY, 4 * leap.dir);
        drawMullet(80, ny, angle, Math.sin(leap.t * 28) * 1.4);
      }
    } else if (splashWait > 0) {
      splashWait -= dt;
      if (splashWait <= 0) {
        if (leapsLeft > 0) startLeap();
        else beginLab();
      }
    }

    for (i = drops.length - 1; i >= 0; i -= 1) {
      drop = drops[i];
      drop.vy += 380 * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.life -= dt;
      if (drop.life <= 0 || drop.y > 96) {
        drops.splice(i, 1);
        continue;
      }
      mctx.globalAlpha = Math.max(drop.life / 0.4, 0);
      mctx.fillStyle = "#d7ddd8";
      mctx.beginPath();
      mctx.arc(drop.x, drop.y, 1.4, 0, Math.PI * 2);
      mctx.fill();
      mctx.globalAlpha = 1;
    }
  }

  function nextState() {
    if (state === "jump") {
      state = Math.random() < 0.5 ? "walk" : "sit";
    } else if (state === "sit" || state === "lie") {
      dir = Math.random() < 0.5 ? -1 : 1;
      state = Math.random() < 0.45 ? "run" : "walk";
    } else {
      var roll = Math.random();
      if (roll < 0.32) state = "sit";
      else if (roll < 0.48) state = "lie";
      else if (roll < 0.66) dir *= -1;
      else state = state === "run" ? "walk" : "run";
    }
    var hold = {
      sit: 1800 + Math.random() * 3200,
      lie: 2600 + Math.random() * 3400,
      walk: 2200 + Math.random() * 2800,
      run: 1200 + Math.random() * 1600,
      jump: 700
    };
    stateUntil = performance.now() + hold[state];
    frame = 0;
  }

  function startJump() {
    if (mode !== "lab" || y < 0) return;
    state = "jump";
    vy = -240;
    y = -1;
    stateUntil = performance.now() + 900;
  }

  canvas.addEventListener("click", startJump);

  window.addEventListener("mousemove", function (event) {
    var rect = track.getBoundingClientRect();
    if (Math.abs(event.clientY - rect.bottom) < 90) {
      follow = event.clientX - rect.left - display / 2;
    } else {
      follow = null;
    }
  });

  window.addEventListener("resize", function () {
    x = Math.min(x, maxX());
  });

  beginLab();
  paint(sit);
  place(x, 0, dir);

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

    if (now >= modeUntil) {
      beginFish();
      window.requestAnimationFrame(tick);
      return;
    }

    if (y < 0 || vy !== 0) {
      vy += 980 * dt;
      y += vy * dt;
      if (y >= 0) {
        y = 0;
        vy = 0;
        if (state === "jump") nextState();
      }
    } else if (now >= stateUntil) {
      nextState();
    }

    if ((state === "walk" || state === "run") && y === 0) {
      if (follow !== null) {
        dir = follow >= x ? 1 : -1;
      }
      x += dir * (state === "run" ? 128 : 56) * dt;
      if (x <= 0) {
        x = 0;
        dir = 1;
      } else if (x >= maxX()) {
        x = maxX();
        dir = -1;
      }
    }

    var fps = state === "run" ? 12 : state === "walk" ? 8 : 2;
    frameAcc += dt * fps;
    if (frameAcc >= 1) {
      frameAcc = 0;
      frame += 1;
    }

    paint(frameFor(state, frame));
    place(x, y, dir);
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
