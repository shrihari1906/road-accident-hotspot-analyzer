function AccidentTable({ accidents }) {
  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-dark text-white">
          <h4>Accident Records</h4>
        </div>

        <div className="card-body">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>City</th>
                <th>Severity</th>
                <th>Weather</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {accidents.map((accident) => (
                <tr key={accident.id}>
                  <td>{accident.id}</td>
                  <td>{accident.city}</td>
                  <td>{accident.severity}</td>
                  {/* FIX: was accident.weather (field doesn't exist),
                      the API returns weather_condition */}
                  <td>{accident.weather_condition}</td>
                  <td>{accident.accident_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AccidentTable;
