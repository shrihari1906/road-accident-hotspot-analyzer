function SearchBar({ search, setSearch }) {

  return (
    <div className="dash-search-wrap">
      <div className="dash-search">
        <span className="dash-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by City, Weather or Severity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );

}

export default SearchBar;