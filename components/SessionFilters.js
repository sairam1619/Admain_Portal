function SessionFilters({
  searchTerm,
  setSearchTerm,

  selectedSection,
  setSelectedSection,

  sortBy,
  setSortBy,

  sections,
}) {
  const [showSectionMenu, setShowSectionMenu] = React.useState(false);

  const [showSortMenu, setShowSortMenu] = React.useState(false);

  function getSortLabel() {
    switch (sortBy) {
      case "OLDEST":
        return "Started Time (Oldest)";

      case "USER":
        return "User Name (A-Z)";

      case "TIME":
        return "Allocated Time (High-Low)";

      default:
        return "Started Time (Newest)";
    }
  }

  return (
    <div className="sessions-toolbar">
      <input
        type="text"
        className="sessions-search"
        placeholder="Search user or lab..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* -------------
          SECTION FILTER 
      ----------------*/}

      <div className="custom-filter">
        <button
          className="custom-filter-btn"
          onClick={() => setShowSectionMenu(!showSectionMenu)}
        >
          {selectedSection === "ALL" ? "All Sections" : selectedSection}

          <span>▼</span>
        </button>

        {showSectionMenu && (
          <div className="custom-filter-menu">
            <button
              className="custom-filter-option"
              onClick={() => {
                setSelectedSection("ALL");

                setShowSectionMenu(false);
              }}
            >
              All Sections
            </button>

            {sections.map((section) => (
              <button
                key={section}
                className="custom-filter-option"
                onClick={() => {
                  setSelectedSection(section);

                  setShowSectionMenu(false);
                }}
              >
                {section}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -----------
          SORT FILTER 
      --------------*/}

      <div className="custom-filter">
        <button
          className="custom-filter-btn"
          onClick={() => setShowSortMenu(!showSortMenu)}
        >
          {getSortLabel()}

          <span>▼</span>
        </button>

        {showSortMenu && (
          <div className="custom-filter-menu">
            <button
              className="custom-filter-option"
              onClick={() => {
                setSortBy("NEWEST");

                setShowSortMenu(false);
              }}
            >
              Started Time (Newest)
            </button>

            <button
              className="custom-filter-option"
              onClick={() => {
                setSortBy("OLDEST");

                setShowSortMenu(false);
              }}
            >
              Started Time (Oldest)
            </button>

            <button
              className="custom-filter-option"
              onClick={() => {
                setSortBy("USER");

                setShowSortMenu(false);
              }}
            >
              User Name (A-Z)
            </button>

            <button
              className="custom-filter-option"
              onClick={() => {
                setSortBy("TIME");

                setShowSortMenu(false);
              }}
            >
              Allocated Time (High-Low)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
