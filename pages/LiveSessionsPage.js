function LiveSessionsPage() {
  const [sessions, setSessions] = React.useState([]);
  const [recentActivity, setRecentActivity] = React.useState([]);

  const [stats, setStats] = React.useState({
    active: 0,
    failed: 0,
    total: 0,
  });

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  /*
    FILTERS
  */

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedSection, setSelectedSection] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState("NEWEST");

  React.useEffect(() => {
    loadSessions();

    const interval = setInterval(loadSessions, 30000);

    return () => clearInterval(interval);
  }, []);

  async function loadSessions() {
    try {
      setError("");

      const data = await fetchSessions();

      setSessions(data.activeSessions || []);

      setRecentActivity(data.recentActivity || []);

      setStats(
        data.stats || {
          active: 0,
          failed: 0,
          total: 0,
        },
      );
    } catch (error) {
      console.error("Failed to load sessions", error);

      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  /*
    SECTION LIST
  */

  const sections = [
    ...new Set(sessions.map((session) => session.section || "-")),
  ];

  /*
    FILTER + SORT
  */

  const filteredSessions = sessions
    .filter((session) => {
      const matchesSearch =
        (session.username || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (session.lab || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSection =
        selectedSection === "ALL" || session.section === selectedSection;

      return matchesSearch && matchesSection;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "OLDEST":
          return new Date(a.launchedAt) - new Date(b.launchedAt);

        case "USER":
          return (a.username || "").localeCompare(b.username || "");

        case "TIME":
          return (b.durationMinutes || 0) - (a.durationMinutes || 0);

        default:
          return new Date(b.launchedAt) - new Date(a.launchedAt);
      }
    });

  if (loading) {
    return <LoadingScreen message="Loading Live Sessions" />;
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">Live Sessions</h1>

          <div className="page-subtitle">
            Active lab monitoring and recent session activity
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="live-stats-grid">
        <div className="live-stat-card active-card">
          <div className="live-stat-number">{stats.active}</div>

          <div className="live-stat-content">
            <div className="live-stat-title">Active Sessions</div>

            <div className="live-stat-description">
              <span className="live-indicator"></span>
              {stats.active} currently running
            </div>
          </div>
        </div>

        <div className="live-stat-card failed-card">
          <div className="live-stat-number">{stats.failed}</div>

          <div className="live-stat-content">
            <div className="live-stat-title">Failed Sessions</div>

            <div className="live-stat-description">
              {stats.failed > 0 ? "Requires attention" : "No failures detected"}
            </div>
          </div>
        </div>

        <div className="live-stat-card total-card">
          <div className="live-stat-number">{stats.total}</div>

          <div className="live-stat-content">
            <div className="live-stat-title">Total Sessions</div>

            <div className="live-stat-description">All launched sessions</div>
          </div>
        </div>
      </div>

      <div className="section-block">
        <div className="section-header">
          <div className="section-title">Active Sessions</div>

          <div className="section-subtitle">Currently running lab sessions</div>
        </div>

        {sessions.length === 0 ? (
          <div className="empty-state">No active sessions found</div>
        ) : (
          <>
            <SessionFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sections={sections}
            />

            <div className="table-wrapper">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Lab</th>
                    <th>Section</th>
                    <th>Started</th>
                    <th>Allocated Time</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSessions.map((session, index) => (
                    <tr key={index}>
                      <td>{session.username || "-"}</td>

                      <td>{session.lab || "-"}</td>

                      <td>{session.section || "-"}</td>

                      <td>
                        {session.launchedAt
                          ? formatDate(session.launchedAt)
                          : "-"}
                      </td>

                      <td>{formatHours(session.durationMinutes || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="section-block">
        <div className="section-header">
          <div className="section-title">Recent Activity</div>

          <div className="section-subtitle">Latest session events</div>
        </div>

        {recentActivity.length === 0 ? (
          <div className="empty-state">No recent activity found</div>
        ) : (
          <div className="session-activity-panel">
            {recentActivity.map((session, index) => (
              <div key={index} className="session-activity-row">
                <div className="session-activity-time">
                  {formatDate(session.eventTime)}
                </div>

                <div className="session-activity-message">
                  <strong>{session.username || "Unknown User"}</strong>{" "}
                  {session.status === "ACTIVE"
                    ? "launched"
                    : session.status === "COMPLETED"
                      ? "completed"
                      : session.status === "FAILED"
                        ? "failed"
                        : session.status === "EXPIRED"
                          ? "expired"
                          : session.status === "QUARANTINED"
                            ? "quarantined"
                            : "updated"}{" "}
                  {session.lab || "lab session"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
