var FLAGSTAFF_LAT = 35.1983;
var FLAGSTAFF_LON = -111.6513;

var WMO_CODES = {
  0: "Clear", 1: "Clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Rain", 63: "Rain", 65: "Heavy rain",
  71: "Snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow", 80: "Showers", 81: "Showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Snow showers",
  95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm"
};

var WMO_ICONS = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌧️", 55: "🌧️",
  61: "🌦️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "❄️", 75: "❄️", 77: "❄️",
  80: "🌦️", 81: "🌧️", 82: "🌧️",
  85: "🌨️", 86: "🌨️", 95: "⛈️", 96: "⛈️", 99: "⛈️"
};

var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

(function() {
  var url = "https://api.open-meteo.com/v1/forecast?latitude=" + FLAGSTAFF_LAT +
    "&longitude=" + FLAGSTAFF_LON +
    "&current=temperature_2m,weather_code" +
    "&daily=temperature_2m_max,temperature_2m_min,weather_code" +
    "&temperature_unit=fahrenheit&timezone=America%2FPhoenix&forecast_days=3";

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var temp = Math.round(data.current.temperature_2m);
      var code = data.current.weather_code;
      var high = Math.round(data.daily.temperature_2m_max[0]);
      var low = Math.round(data.daily.temperature_2m_min[0]);
      var icon = WMO_ICONS[code] || "";
      var desc = WMO_CODES[code] || "";

      // Build 3-day forecast HTML
      var forecastHtml = '<div class="weather-forecast">';
      for (var i = 0; i < 3; i++) {
        var date = new Date(data.daily.time[i] + "T12:00:00");
        var dayName = i === 0 ? "Today" : DAY_NAMES[date.getDay()];
        var dCode = data.daily.weather_code[i];
        var dIcon = WMO_ICONS[dCode] || "";
        var dHigh = Math.round(data.daily.temperature_2m_max[i]);
        var dLow = Math.round(data.daily.temperature_2m_min[i]);
        forecastHtml +=
          '<div class="weather-forecast__day">' +
            '<span class="weather-forecast__name">' + dayName + '</span>' +
            '<span class="weather-forecast__icon">' + dIcon + '</span>' +
            '<span class="weather-forecast__temps">' + dHigh + '° / ' + dLow + '°</span>' +
          '</div>';
      }
      forecastHtml += '</div>';

      // Sidebar widget (desktop) — current + 3-day forecast
      var sidebar = document.getElementById("weather-widget");
      if (sidebar) {
        sidebar.innerHTML =
          '<div class="weather-widget">' +
            '<div><span class="weather-widget__temp">' + icon + ' ' + temp + '°</span> ' +
            '<span class="weather-widget__desc">' + desc + '</span></div>' +
            '<div class="weather-widget__location">Flagstaff, AZ</div>' +
          '</div>' + forecastHtml;
      }

      // Mobile header (compact)
      var header = document.getElementById("weather-header");
      if (header) {
        header.textContent = icon + " " + temp + "°";
      }

      // Mobile home page forecast card
      var mobileForecast = document.getElementById("weather-forecast-mobile");
      if (mobileForecast) {
        var cardHtml = '<div class="weather-forecast-card">' +
          '<div class="weather-forecast-card__current">' +
            '<span class="weather-forecast-card__icon">' + icon + '</span>' +
            '<span class="weather-forecast-card__temp">' + temp + '°</span>' +
            '<span class="weather-forecast-card__desc">' + desc + ' in Flagstaff</span>' +
          '</div>' +
          '<div class="weather-forecast-card__days">';
        for (var j = 0; j < 3; j++) {
          var fDate = new Date(data.daily.time[j] + "T12:00:00");
          var fName = j === 0 ? "Today" : DAY_NAMES[fDate.getDay()];
          var fCode = data.daily.weather_code[j];
          var fIcon = WMO_ICONS[fCode] || "";
          var fHigh = Math.round(data.daily.temperature_2m_max[j]);
          var fLow = Math.round(data.daily.temperature_2m_min[j]);
          cardHtml +=
            '<div class="weather-forecast-card__day">' +
              '<span class="weather-forecast-card__day-name">' + fName + '</span>' +
              '<span class="weather-forecast-card__day-icon">' + fIcon + '</span>' +
              '<span class="weather-forecast-card__day-temps">' + fHigh + '°<span class="weather-forecast-card__low"> / ' + fLow + '°</span></span>' +
            '</div>';
        }
        cardHtml += '</div></div>';
        mobileForecast.innerHTML = cardHtml;
      }

      // Mobile menu
      var mobile = document.getElementById("weather-widget-mobile");
      if (mobile) {
        mobile.innerHTML = icon + " " + temp + "° in Flagstaff — " + desc + forecastHtml;
      }
    })
    .catch(function() {});
})();
