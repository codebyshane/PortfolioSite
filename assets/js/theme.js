(function () {
  var root = document.documentElement;
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var storageKey = "theme-override";
  var coordsKey = "theme-coords";
  var colors = { light: "#f6f5f2", dark: "#131210" };
  var schemeMeta = document.querySelector('meta[name="color-scheme"]');
  var dayMs = 86400000;
  var themeTimer;
  var themeToggle;
  var themeLabel;

  var tzCoords = {
    "America/New_York": [40.71, -74.01],
    "America/Detroit": [42.33, -83.05],
    "America/Kentucky/Louisville": [38.25, -85.76],
    "America/Indiana/Indianapolis": [39.77, -86.16],
    "America/Chicago": [41.88, -87.63],
    "America/Denver": [39.74, -104.99],
    "America/Boise": [43.62, -116.2],
    "America/Phoenix": [33.45, -112.07],
    "America/Los_Angeles": [34.05, -118.24],
    "America/Anchorage": [61.22, -149.9],
    "America/Juneau": [58.3, -134.42],
    "America/Nome": [64.5, -165.41],
    "America/Adak": [51.88, -176.66],
    "America/Puerto_Rico": [18.47, -66.11],
    "Pacific/Honolulu": [21.31, -157.86],
    "America/Toronto": [43.65, -79.38],
    "America/Vancouver": [49.28, -123.12],
    "America/Edmonton": [53.55, -113.49],
    "America/Winnipeg": [49.9, -97.14],
    "America/Halifax": [44.65, -63.57],
    "America/St_Johns": [47.56, -52.71],
    "America/Mexico_City": [19.43, -99.13],
    "America/Sao_Paulo": [-23.55, -46.63],
    "America/Argentina/Buenos_Aires": [-34.6, -58.38],
    "America/Santiago": [-33.45, -70.67],
    "America/Bogota": [4.71, -74.07],
    "America/Lima": [-12.05, -77.04],
    "Europe/London": [51.51, -0.13],
    "Europe/Dublin": [53.35, -6.26],
    "Europe/Lisbon": [38.72, -9.14],
    "Europe/Paris": [48.86, 2.35],
    "Europe/Berlin": [52.52, 13.4],
    "Europe/Amsterdam": [52.37, 4.89],
    "Europe/Brussels": [50.85, 4.35],
    "Europe/Madrid": [40.42, -3.7],
    "Europe/Rome": [41.9, 12.5],
    "Europe/Zurich": [47.38, 8.54],
    "Europe/Vienna": [48.21, 16.37],
    "Europe/Prague": [50.08, 14.44],
    "Europe/Warsaw": [52.23, 21.01],
    "Europe/Stockholm": [59.33, 18.07],
    "Europe/Helsinki": [60.17, 24.94],
    "Europe/Athens": [37.98, 23.73],
    "Europe/Istanbul": [41.01, 28.98],
    "Europe/Moscow": [55.76, 37.62],
    "Africa/Cairo": [30.04, 31.24],
    "Africa/Johannesburg": [-26.2, 28.04],
    "Africa/Lagos": [6.52, 3.38],
    "Africa/Nairobi": [-1.29, 36.82],
    "Asia/Dubai": [25.2, 55.27],
    "Asia/Kolkata": [28.61, 77.21],
    "Asia/Bangkok": [13.76, 100.5],
    "Asia/Jakarta": [-6.21, 106.85],
    "Asia/Singapore": [1.35, 103.82],
    "Asia/Hong_Kong": [22.32, 114.17],
    "Asia/Shanghai": [31.23, 121.47],
    "Asia/Seoul": [37.57, 126.98],
    "Asia/Tokyo": [35.68, 139.65],
    "Asia/Manila": [14.6, 120.98],
    "Australia/Perth": [-31.95, 115.86],
    "Australia/Adelaide": [-34.93, 138.6],
    "Australia/Brisbane": [-27.47, 153.03],
    "Australia/Sydney": [-33.87, 151.21],
    "Australia/Melbourne": [-37.81, 144.96],
    "Pacific/Auckland": [-36.85, 174.76]
  };

  function dayOfYear(date) {
    var y = date.getFullYear();
    return (
      Math.round(
        (Date.UTC(y, date.getMonth(), date.getDate()) - Date.UTC(y, 0, 1)) /
          dayMs
      ) + 1
    );
  }

  function riseSet(lat, lng, date, isRise) {
    var D2R = Math.PI / 180;
    var R2D = 180 / Math.PI;
    var zenith = 90.833;
    var t = dayOfYear(date) + ((isRise ? 6 : 18) - lng / 15) / 24;
    var M = 0.9856 * t - 3.289;
    var L =
      M +
      1.916 * Math.sin(M * D2R) +
      0.02 * Math.sin(2 * M * D2R) +
      282.634;
    L = ((L % 360) + 360) % 360;
    var RA = R2D * Math.atan(0.91764 * Math.tan(L * D2R));
    RA = ((RA % 360) + 360) % 360;
    RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
    var sinDec = 0.39782 * Math.sin(L * D2R);
    var cosDec = Math.cos(Math.asin(sinDec));
    var cosH =
      (Math.cos(zenith * D2R) - sinDec * Math.sin(lat * D2R)) /
      (cosDec * Math.cos(lat * D2R));
    if (cosH > 1) return { polar: "night" };
    if (cosH < -1) return { polar: "day" };
    var H = isRise ? 360 - R2D * Math.acos(cosH) : R2D * Math.acos(cosH);
    var UT = (((H / 15 + RA - 0.06571 * t - 6.622 - lng / 15) % 24) + 24) % 24;
    var local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    local.setTime(local.getTime() + (UT - date.getTimezoneOffset() / 60) * 3600000);
    return local;
  }

  function sunTimes(date, lat, lng) {
    var rise = riseSet(lat, lng, date, true);
    if (rise.polar) return rise;
    var set = riseSet(lat, lng, date, false);
    if (set.polar) return set;
    return { rise: rise.getTime(), set: set.getTime() };
  }

  function timezoneName() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (e) {
      return "";
    }
  }

  function fallbackCoords() {
    var named = tzCoords[timezoneName()];
    if (named) return { lat: named[0], lng: named[1], precise: false };
    return {
      lat: 40,
      lng: -new Date().getTimezoneOffset() / 4,
      precise: false
    };
  }

  function readCoords() {
    try {
      var value = JSON.parse(localStorage.getItem(coordsKey) || "null");
      if (
        value &&
        typeof value.lat === "number" &&
        typeof value.lng === "number"
      ) {
        return value;
      }
    } catch (e) {}
    return fallbackCoords();
  }

  function saveCoords(lat, lng, precise) {
    try {
      localStorage.setItem(
        coordsKey,
        JSON.stringify({
          lat: lat,
          lng: lng,
          precise: !!precise,
          t: Date.now()
        })
      );
    } catch (e) {}
  }

  function storedTheme() {
    try {
      var value = localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function timeTheme(date) {
    var coords = readCoords();
    var times = sunTimes(date || new Date(), coords.lat, coords.lng);
    if (times.polar === "day") return "light";
    if (times.polar === "night") return "dark";
    var now = (date || new Date()).getTime();
    return now >= times.rise && now < times.set ? "light" : "dark";
  }

  function currentTheme() {
    return root.getAttribute("data-theme") || storedTheme() || timeTheme();
  }

  function msUntilNextSwitch() {
    var now = new Date();
    var coords = readCoords();
    var today = sunTimes(now, coords.lat, coords.lng);
    if (today.polar) {
      var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
      return Math.max(tomorrow.getTime() - now.getTime(), 1000);
    }
    if (now.getTime() < today.rise) return today.rise - now.getTime();
    if (now.getTime() < today.set) return today.set - now.getTime();
    var nextMorning = sunTimes(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12),
      coords.lat,
      coords.lng
    );
    if (nextMorning.rise) return Math.max(nextMorning.rise - now.getTime(), 1000);
    return dayMs;
  }

  function scheduleTimeTheme() {
    if (themeTimer) window.clearTimeout(themeTimer);
    if (storedTheme()) return;
    themeTimer = window.setTimeout(function () {
      applyTheme(timeTheme(), false);
      scheduleTimeTheme();
    }, Math.min(msUntilNextSwitch(), 2147483647));
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = "only " + theme;
    if (schemeMeta) {
      schemeMeta.setAttribute(
        "content",
        theme === "dark" ? "dark" : "only light"
      );
    }
    if (persist) {
      try {
        localStorage.setItem(storageKey, theme);
      } catch (e) {}
    }
    if (themeMeta) themeMeta.setAttribute("content", colors[theme]);
    if (themeToggle) {
      var next = theme === "dark" ? "light" : "dark";
      var label = "Switch to " + next + " mode";
      themeToggle.setAttribute("aria-label", label);
      themeToggle.setAttribute(
        "aria-pressed",
        theme === "dark" ? "true" : "false"
      );
      if (themeLabel) themeLabel.textContent = label;
    }
  }

  function refreshFromSun() {
    if (storedTheme()) return;
    applyTheme(timeTheme(), false);
    scheduleTimeTheme();
  }

  function coordsAreFresh(coords) {
    return coords && coords.precise && Date.now() - (coords.t || 0) < 7 * dayMs;
  }

  function usePosition(lat, lng) {
    saveCoords(lat, lng, true);
    refreshFromSun();
  }

  function refineFromGeolocation() {
    if (!navigator.geolocation) return;
    var query = function (state) {
      if (state !== "granted") return;
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          usePosition(pos.coords.latitude, pos.coords.longitude);
        },
        function () {},
        { maximumAge: 6 * 60 * 60 * 1000, timeout: 4000 }
      );
    };
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then(function (status) {
          query(status.state);
        })
        .catch(function () {});
    }
  }

  function refineFromIp() {
    var coords = readCoords();
    if (coordsAreFresh(coords)) return;
    if (typeof fetch !== "function") return;
    fetch("https://get.geojs.io/v1/ip/geo.json")
      .then(function (response) {
        if (!response.ok) throw new Error("geo");
        return response.json();
      })
      .then(function (geo) {
        var lat = parseFloat(geo.latitude);
        var lng = parseFloat(geo.longitude);
        if (!isFinite(lat) || !isFinite(lng)) return;
        usePosition(lat, lng);
      })
      .catch(function () {});
  }

  function bindToggle() {
    themeToggle = document.querySelector(".theme-toggle");
    themeLabel = themeToggle
      ? themeToggle.querySelector(".visually-hidden")
      : null;
    applyTheme(currentTheme(), false);
    if (!themeToggle) return;
    themeToggle.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      if (themeTimer) window.clearTimeout(themeTimer);
    });
  }

  applyTheme(storedTheme() || timeTheme(), false);
  scheduleTimeTheme();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggle);
  } else {
    bindToggle();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") refreshFromSun();
  });

  refineFromGeolocation();
  refineFromIp();
})();
