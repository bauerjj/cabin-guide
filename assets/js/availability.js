(function () {
  var root = document.getElementById("availability");
  if (!root) return;

  var monthsEl = document.getElementById("avail-months");
  var rangeEl = document.getElementById("avail-range");
  var statusEl = document.getElementById("avail-status");
  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  var MAX_MONTHS_AHEAD = 12;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); }

  var today = new Date();
  var todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  var viewYear = today.getFullYear();
  var viewMonth = today.getMonth();
  var booked = {};
  var ready = false;

  // Expand [start, end) ranges into a set of booked nights.
  function indexBooked(ranges) {
    ranges.forEach(function (r) {
      var d = new Date(r[0] + "T00:00:00");
      var end = new Date(r[1] + "T00:00:00");
      while (d < end) {
        booked[iso(d.getFullYear(), d.getMonth(), d.getDate())] = true;
        d.setDate(d.getDate() + 1);
      }
    });
  }

  function monthOffset() {
    return (viewYear - today.getFullYear()) * 12 + (viewMonth - today.getMonth());
  }

  function renderMonth(year, month) {
    var first = new Date(year, month, 1);
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var html = '<div class="avail__month"><div class="avail__title">' +
      MONTH_NAMES[month] + " " + year + '</div><div class="avail__grid">';
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) {
      html += '<div class="avail__dow">' + d + "</div>";
    });
    for (var i = 0; i < first.getDay(); i++) html += "<div></div>";
    for (var day = 1; day <= daysInMonth; day++) {
      var key = iso(year, month, day);
      var cls = "avail__day";
      if (key < todayIso) cls += " avail__day--past";
      else if (!ready) cls += " avail__day--unknown";
      else if (booked[key]) cls += " avail__day--booked";
      else cls += " avail__day--open";
      html += '<div class="' + cls + '">' + day + "</div>";
    }
    return html + "</div></div>";
  }

  function render() {
    var nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    var nextM = (viewMonth + 1) % 12;
    monthsEl.innerHTML = renderMonth(viewYear, viewMonth) + renderMonth(nextY, nextM);
    rangeEl.textContent = MONTH_NAMES[viewMonth] + " " + viewYear + " – " +
      MONTH_NAMES[nextM] + " " + nextY;
    document.getElementById("avail-prev").disabled = monthOffset() <= 0;
    document.getElementById("avail-next").disabled = monthOffset() >= MAX_MONTHS_AHEAD - 1;
  }

  function shift(delta) {
    var d = new Date(viewYear, viewMonth + delta, 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
    render();
  }

  document.getElementById("avail-prev").addEventListener("click", function () { shift(-1); });
  document.getElementById("avail-next").addEventListener("click", function () { shift(1); });

  render();

  fetch(root.dataset.src, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      if (!data.available) throw new Error("not configured");
      indexBooked(data.booked || []);
      ready = true;
      if (data.updated) {
        statusEl.textContent = "Last updated " + new Date(data.updated).toLocaleString();
      }
      render();
    })
    .catch(function () {
      // Never show every date as open when we couldn't load real data.
      statusEl.textContent = "Availability is temporarily unavailable. Please check back soon.";
    });
})();
