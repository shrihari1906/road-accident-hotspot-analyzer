/**
 * filterAccidents — pure utility function that applies all active filters
 * to an accidents array. Extracted so both Dashboard and AccidentMap can
 * share identical filter logic without duplicating it.
 *
 * @param {Array}  accidents    - raw accidents array from the API
 * @param {Object} filters
 *   @param {string} search       - free-text (city | severity | weather_condition)
 *   @param {string} city         - "All Cities" or a specific city name
 *   @param {string} weather      - "All Weather" or a specific weather_condition value
 *   @param {string} severity     - "All Severity" or a specific severity value
 *   @param {string} selectedDate - "" or "YYYY-MM-DD"
 * @returns {Array} filtered accidents
 */
export function filterAccidents(accidents, { search = "", city = "All Cities", weather = "All Weather", severity = "All Severity", selectedDate = "" } = {}) {

  return accidents.filter((accident) => {

    const matchesSearch =
      accident.city.toLowerCase().includes(search.toLowerCase()) ||
      accident.severity.toLowerCase().includes(search.toLowerCase()) ||
      (accident.weather_condition || "").toLowerCase().includes(search.toLowerCase());

    const matchesCity =
      city === "All Cities" || accident.city === city;

    const matchesWeather =
      weather === "All Weather" || accident.weather_condition === weather;

    const matchesSeverity =
      severity === "All Severity" || accident.severity === severity;

    const matchesDate =
      selectedDate === "" ||
      new Date(accident.accident_date).toISOString().slice(0, 10) === selectedDate;

    return (
      matchesSearch &&
      matchesCity &&
      matchesWeather &&
      matchesSeverity &&
      matchesDate
    );

  });

}
