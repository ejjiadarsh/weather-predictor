const apiKey = "214ece3b7fd3ee767d2fc2174f07bb87";

document.getElementById("darkModeToggle").addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
});

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return alert("Please enter a city name");

  showSpinner(true);

  try {
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    const [weatherRes, forecastRes] = await Promise.all([
      fetch(weatherURL),
      fetch(forecastURL),
    ]);

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    if (weatherData.cod !== 200) throw new Error(weatherData.message);

    displayWeather(weatherData);
    displayForecast(forecastData.list);
    showMap(weatherData.coord.lat, weatherData.coord.lon);
  } catch (error) {
    alert("Error fetching weather: " + error.message);
  }

  showSpinner(false);
}

function displayWeather(data) {
  document.getElementById("weatherResult").innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
    <p><strong>Weather:</strong> ${data.weather[0].description}</p>
    <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
    <p><strong>Wind:</strong> ${data.wind.speed} m/s</p>
  `;
}

function displayForecast(list) {
  const forecastHTML = list
    .filter((item, idx) => idx % 8 === 0)
    .map(item => `
      <div>
        <h4>${new Date(item.dt_txt).toDateString()}</h4>
        <p>${item.main.temp}°C</p>
        <p>${item.weather[0].main}</p>
      </div>
    `).join("");
  document.getElementById("forecastResult").innerHTML = forecastHTML;
}

function showMap(lat, lon) {
  const mapURL = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05}%2C${lat - 0.05}%2C${lon + 0.05}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lon}`;
  document.getElementById("map").src = mapURL;
}

function showSpinner(visible) {
  document.getElementById("spinner").classList.toggle("hidden", !visible);
}

function useMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords;

      showSpinner(true);
      try {
        const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
        const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

        const [weatherRes, forecastRes] = await Promise.all([
          fetch(weatherURL),
          fetch(forecastURL)
        ]);

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        if (weatherData.cod !== 200) throw new Error(weatherData.message);

        document.getElementById("cityInput").value = weatherData.name;
        displayWeather(weatherData);
        displayForecast(forecastData.list);
        showMap(latitude, longitude);
      } catch (error) {
        alert("Error fetching location-based weather: " + error.message);
      }
      showSpinner(false);
    }, error => {
      alert("Error getting location: " + error.message);
    });
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}



function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice input is not supported in this browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();

  recognition.onresult = event => {
    let city = event.results[0][0].transcript.trim();
    city = city.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // Remove punctuation
    document.getElementById("cityInput").value = city;
    getWeather();
  };

  recognition.onerror = event => {
    alert("Voice input error: " + event.error);
  };
}

document.getElementById("cityInput").addEventListener("input", async function () {
  const input = this.value;
  if (input.length < 2) return;

  const res = await fetch(`https://api.teleport.org/api/cities/?search=${input}`);
  const data = await res.json();
  const cities = data._embedded["city:search-results"];
  const dataList = document.getElementById("cityList");

  dataList.innerHTML = cities.slice(0, 5).map(city =>
    `<option value="${city.matching_full_name}"></option>`
  ).join("");
});
