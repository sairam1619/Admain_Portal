function PermissionsPage() {
  const [permissionSets, setPermissionSets] = React.useState([]);

  const [stats, setStats] = React.useState({
    totalPermissionSets: 0,
    totalLaunches: 0,
    activePermissionSets: 0,
    mostUsed: "-",
  });

  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");

  const [error, setError] = React.useState("");

  const [sortField, setSortField] = React.useState("launches");
  const [sortDirection, setSortDirection] = React.useState("desc");

  React.useEffect(() => {
    loadPermissionSets();
  }, []);

  async function loadPermissionSets() {
    try {
      const data = await fetchPermissionSets();

      setPermissionSets(data.permissionSets || []);

      setStats(data.stats || {});
    } catch (error) {
      setError("Failed to load permission sets");
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function getPermissionIcon(permissionSet) {
    const name = permissionSet?.toLowerCase() || "";

    if (name.includes("iam")) return "assets/icons/iam.png";

    if (name.includes("ec2")) return "assets/icons/ec2.png";

    if (name.includes("s3")) return "assets/icons/s3.png";

    if (name.includes("rds")) return "assets/icons/rds.png";

    if (name.includes("lambda")) return "assets/icons/lambda.png";

    if (name.includes("network")) return "assets/icons/networking.png";

    if (name.includes("dynamodb")) return "assets/icons/dynamodb.png";

    return "assets/icons/iam.png";
  }

  const filteredPermissions = permissionSets.filter((item) =>
    item.permissionSet?.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedPermissions = [...filteredPermissions].sort((a, b) => {
    let comparison = 0;

    if (sortField === "launches") {
      comparison = (a.launches || 0) - (b.launches || 0);
    }

    if (sortField === "activeSessions") {
      comparison = (a.activeSessions || 0) - (b.activeSessions || 0);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const topPermissions = [...permissionSets]
    .sort((a, b) => b.launches - a.launches)
    .slice(0, 5);

  const pageHeader = (
    <div className="page-header">
      <div>
        <h2>Permission Sets</h2>

        <p>Monitor permission set usage, activity, and overall utilization.</p>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingScreen message="Loading Permission Sets" />;
  }

  return (
    <div className="permission-page">
      {pageHeader}
      {error && <div className="error-banner">{error}</div>}

      {/* METRICS */}

      <div className="permission-metrics">
        <div className="metric-box purple">
          <div className="metric-content">
            <div className="metric-icon-wrapper">
              <img
                src="assets/icons/collection.png"
                className="metric-icon"
                alt=""
              />
            </div>

            <div className="metric-info">
              <div className="metric-label">TOTAL PERMISSION SETS</div>

              <div className="metric-value">{stats.totalPermissionSets}</div>

              <div className="metric-description">
                All available permission sets
              </div>
            </div>
          </div>
        </div>

        <div className="metric-box green">
          <div className="metric-content">
            <div className="metric-icon-wrapper">
              <img
                src="assets/icons/rocket.png"
                className="metric-icon"
                alt=""
              />
            </div>

            <div className="metric-info">
              <div className="metric-label">TOTAL LAUNCHES</div>

              <div className="metric-value">{stats.totalLaunches}</div>

              <div className="metric-description">
                Total launches across labs
              </div>
            </div>
          </div>
        </div>

        <div className="metric-box blue">
          <div className="metric-content">
            <div className="metric-icon-wrapper">
              <img
                src="assets/icons/users.png"
                className="metric-icon"
                alt=""
              />
            </div>

            <div className="metric-info">
              <div className="metric-label">ACTIVE PERMISSION SETS</div>

              <div className="metric-value">{stats.activePermissionSets}</div>

              <div className="metric-description">
                Currently in active sessions
              </div>
            </div>
          </div>
        </div>

        <div className="metric-box orange">
          <div className="metric-content">
            <div className="metric-icon-wrapper">
              <img src="assets/icons/star.png" className="metric-icon" alt="" />
            </div>

            <div className="metric-info">
              <div className="metric-label">MOST USED</div>

              <div className="metric-name">{stats.mostUsed}</div>

              <div className="metric-description">Highest launch count</div>
            </div>
          </div>
        </div>
      </div>

      <div className="permission-analytics">
        {/* TOP PERMISSION SETS */}

        <div className="analytics-card">
          <div className="analytics-title">Top Permission Sets by Launches</div>

          <div className="analytics-subtitle">
            Distribution of launches across permission sets
          </div>

          {topPermissions.map((item, index) => {
            const percentage = stats.totalLaunches
              ? Math.round((item.launches / stats.totalLaunches) * 100)
              : 0;

            return (
              <div className="launch-row" key={index}>
                <div className="launch-left">
                  <div
                    className={
                      index === 0
                        ? "rank-badge gold"
                        : index === 1
                          ? "rank-badge silver"
                          : index === 2
                            ? "rank-badge bronze"
                            : "rank-badge normal"
                    }
                  >
                    {index + 1}
                  </div>

                  <img
                    src={getPermissionIcon(item.permissionSet)}
                    className="launch-icon"
                    alt=""
                  />

                  <div className="launch-name">{item.permissionSet}</div>
                </div>

                <div className="launch-bar">
                  <div
                    className="launch-fill"
                    style={{
                      width: `${percentage}%`,
                    }}
                  ></div>
                </div>

                <div className="launch-percent">{percentage}%</div>
              </div>
            );
          })}
        </div>

        {/* ACTIVITY OVERVIEW */}

        <div className="analytics-card">
          <div className="analytics-title">Activity Overview</div>

          <div className="analytics-subtitle">
            Quick overview of permission set usage
          </div>

          {/* ACTIVE UTILIZATION */}

          <div className="activity-row">
            <img
              src="assets/icons/check-circle.png"
              className="activity-icon"
              alt=""
            />

            <div className="activity-main">
              <div className="activity-label">Active Utilization</div>

              <div className="activity-track">
                <div
                  className="activity-fill green"
                  style={{
                    width: `${stats.totalPermissionSets
                      ? (stats.activePermissionSets /
                        stats.totalPermissionSets) *
                      100
                      : 0
                      }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="activity-stats-right">
              <div className="activity-primary">
                {stats.activePermissionSets}/{stats.totalPermissionSets}
              </div>

              <div className="activity-secondary green-text">
                {stats.totalPermissionSets
                  ? Math.round(
                    (stats.activePermissionSets / stats.totalPermissionSets) *
                    100,
                  )
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* LAUNCH FREQUENCY */}

          <div className="activity-row">
            <img
              src="assets/icons/chart.png"
              className="activity-icon"
              alt=""
            />

            <div className="activity-main">
              <div className="activity-label">Launch Frequency</div>

              <div className="activity-track">
                <div
                  className="activity-fill blue"
                  style={{
                    width: `${Math.min(Math.log10(stats.totalLaunches + 1) * 20, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="activity-stats-right">
              <div className="activity-secondary blue-text">
                {stats.totalLaunches} Total
              </div>
            </div>
          </div>

          {/* AVG LAUNCHES PER SET */}

          <div className="activity-row">
            <img
              src="assets/icons/clock.png"
              className="activity-icon"
              alt=""
            />

            <div className="activity-main">
              <div className="activity-label">Avg. Launches per Set</div>

              <div className="activity-track">
                <div
                  className="activity-fill purple"
                  style={{
                    width: `${Math.min(
                      (stats.totalLaunches /
                        Math.max(stats.totalPermissionSets, 1)) * 5,
                      100,
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="activity-stats-right">
              <div className="activity-secondary purple-text">
                {stats.totalPermissionSets
                  ? (stats.totalLaunches / stats.totalPermissionSets).toFixed(1)
                  : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INVENTORY */}

      <div className="inventory-card">
        <div className="inventory-header">
          <div>
            <div className="inventory-title">Permission Sets</div>

            <div className="inventory-subtitle">
              Detailed view of all permission sets and their usage
            </div>
          </div>

          <div className="search-wrapper">
            <input
              className="inventory-search"
              placeholder="Search permission sets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <img
              src="assets/icons/search.png"
              className="search-icon"
              alt="Search"
            />
          </div>
        </div>

        <div className="inventory-table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Permission Set</th>

                <th
                  className={
                    sortField === "launches"
                      ? "sortable-header active"
                      : "sortable-header"
                  }
                  onClick={() => handleSort("launches")}
                >
                  Launches
                  <span className="table-sort-arrow">↑↓</span>
                </th>

                <th
                  className={
                    sortField === "activeSessions"
                      ? "sortable-header active"
                      : "sortable-header"
                  }
                  onClick={() => handleSort("activeSessions")}
                >
                  Active Sessions
                  <span className="table-sort-arrow">↑↓</span>
                </th>

                <th>Usage Status</th>

                <th>Usage</th>
              </tr>
            </thead>

            <tbody>
              {sortedPermissions.map((item, index) => {
                const percentage = stats.totalLaunches
                  ? Math.round((item.launches / stats.totalLaunches) * 100)
                  : 0;

                return (
                  <tr key={index}>
                    <td>
                      <div className="permission-name-cell">
                        <img
                          src={getPermissionIcon(item.permissionSet)}
                          className="permission-icon"
                          alt=""
                        />

                        <span>{item.permissionSet}</span>
                      </div>
                    </td>

                    <td>{item.launches}</td>

                    <td>{item.activeSessions}</td>

                    <td>
                      <span
                        className={
                          item.activeSessions > 0
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        <span className="status-dot"></span>

                        {item.activeSessions > 0 ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="usage-wrapper">
                        <div className="usage-track">
                          <div
                            className="usage-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>

                        <span className="usage-percent">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
