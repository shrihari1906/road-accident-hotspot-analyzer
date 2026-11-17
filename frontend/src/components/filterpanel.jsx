function FilterPanel({
  accidents,
  city,
  setCity,
  weather,
  setWeather,
  severity,
  setSeverity,
  selectedDate,
  setSelectedDate
}) {

  const cities = [
    "All Cities",
    ...new Set(accidents.map((accident) => accident.city))
  ];

  // FIX: was accident.weather (field doesn't exist on the data),
  // the actual field returned by the API is weather_condition
  const weathers = [
    "All Weather",
    ...new Set(accidents.map((accident) => accident.weather_condition))
  ];

  const severities = [
    "All Severity",
    ...new Set(accidents.map((accident) => accident.severity))
  ];

  return (
    <div className="container mt-3">

      <div className="row">

        {/* City Filter */}
        <div className="col-md-3">
          <select
            className="form-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {cities.map((cityName, index) => (
              <option key={index} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </div>

        {/* Weather Filter */}
        <div className="col-md-3">
          <select
            className="form-select"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
          >
            {weathers.map((weatherName, index) => (
              <option key={index} value={weatherName}>
                {weatherName}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div className="col-md-3">
          <select
            className="form-select"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            {severities.map((severityName, index) => (
              <option key={index} value={severityName}>
                {severityName}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

      </div>

    </div>
  );
}

export default FilterPanel;
