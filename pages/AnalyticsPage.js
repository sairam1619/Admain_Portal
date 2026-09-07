const {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} = Recharts;

function AnalyticsPage() {
  const [analytics, setAnalytics] = React.useState(null);

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState("");

  const [period, setPeriod] = React.useState(7);

  const [trendData, setTrendData] = React.useState([]);

  const [showTrendMenu, setShowTrendMenu] = React.useState(false);

  const peakDay =
    trendData.length > 0
      ? trendData.reduce(
          (max, current) => (current.count > max.count ? current : max),
          trendData[0],
        )
      : null;

  const trendTotal = trendData.reduce((sum, item) => sum + item.count, 0);

  const averagePerDay =
    trendData.length > 0 ? (trendTotal / trendData.length).toFixed(2) : "0.00";

  React.useEffect(() => {
    loadAnalytics();
  }, []);

  React.useEffect(() => {
    loadTrend(period);
  }, [period]);

  async function loadTrend(selectedPeriod) {
    try {
      const data = await fetchAnalyticsTrend(selectedPeriod);

      setTrendData(data.usageTrend || []);
    } catch (error) {
      console.error(error);
    }
  }

  function getSectionColor(name) {
    const colors = [
      "#5B3DF5",
      "#e816ff",
      "#34A853",
      "#FA8C16",
      "#e74562",
      "#8eebbb",
      "#e8b35e",
      "#5d3f91",
      "#14B8A6",
      "#874444",
      "#0EA5E9",
      "#84CC16",
      "#A855F7",
      "#ec89c8",
      "#598891",
    ];

    let hash = 0;

    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }

    return colors[hash % colors.length];
  }

  async function loadAnalytics() {
    try {
      setLoading(true);

      setError("");

      const data = await getAnalytics();

      setAnalytics(data);
    } catch (error) {
      console.error(error);

      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  const summary = analytics?.summary || {};
  const pageHeader = (
    <div className="page-header">
      <div>
        <h2>Analytics</h2>

        <p>
          Analyze lab usage, learner engagement, and platform adoption trends.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingScreen message="Loading Analytics" />;
  }

  if (error) {
    return (
      <div className="page-section analytics-page">
        {pageHeader}

        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-section analytics-page">
      {pageHeader}
      <div className="analytics-overview">
        <h2>Analytics Overview</h2>

        <div className="overview-grid">
          <div className="overview-item">
            <span className="overview-bullet">•</span>

            <span>
              <strong>{summary.totalLaunches}</strong> lab completions recorded
            </span>
          </div>

          <div className="overview-item">
            <span className="overview-bullet">•</span>

            <span>
              <strong>{summary.learningHours}</strong> learning hours generated
            </span>
          </div>

          <div className="overview-item">
            <span className="overview-bullet">•</span>

            <span>
              Most used permission set :
              <strong> {summary.mostUsedPermissionSet}</strong>
            </span>
          </div>

          <div className="overview-item">
            <span className="overview-bullet">•</span>

            <span>
              Top learner :<strong> {summary.topLearner}</strong> (
              {summary.topLearnerLabs} labs)
            </span>
          </div>
        </div>

        <div className="analytics-watermark">ANALYTICS</div>
      </div>

      <div className="analytics-card">
        <div className="usage-trend-layout">
          {/* LEFT SIDE */}

          <div className="usage-trend-section">
            <div className="usage-header">
              <div>
                <h2>Usage Trend</h2>

                <p>
                  {trendTotal} launches recorded over the selected period.
                  {peakDay && (
                    <>
                      {" "}
                      Peak usage:
                      <strong> {peakDay.count}</strong> launches on{" "}
                      <strong>
                        {new Date(peakDay.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </div>

              <div className="trend-dropdown">
                <button
                  className="trend-dropdown-btn"
                  onClick={() => setShowTrendMenu(!showTrendMenu)}
                >
                  <div className="trend-dropdown-left">
                    <i className="bi bi-calendar3"></i>

                    <span>
                      {period === 7 && "Last 7 Days"}
                      {period === 30 && "Last 30 Days"}
                      {period === 90 && "Last 90 Days"}
                    </span>
                  </div>

                  <i className="bi bi-chevron-down"></i>
                </button>

                {showTrendMenu && (
                  <div className="trend-dropdown-menu">
                    <div
                      className="trend-option"
                      onClick={() => {
                        setPeriod(7);
                        setShowTrendMenu(false);
                      }}
                    >
                      Last 7 Days
                    </div>

                    <div
                      className="trend-option"
                      onClick={() => {
                        setPeriod(30);
                        setShowTrendMenu(false);
                      }}
                    >
                      Last 30 Days
                    </div>

                    <div
                      className="trend-option"
                      onClick={() => {
                        setPeriod(90);
                        setShowTrendMenu(false);
                      }}
                    >
                      Last 90 Days
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                  minTickGap={40}
                  tickFormatter={(value) => {
                    const d = new Date(value);

                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value) => [value, "Launches"]}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />

                <Line
                  type="linear"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* SUMMARY CARDS */}

            <div className="usage-summary">
              <div className="summary-card">
                <div className="summary-icon">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>

                <div className="summary-content">
                  <span>Total Launches</span>

                  <strong>{trendTotal}</strong>
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-card">
                <div className="summary-icon">
                  <i className="bi bi-bar-chart"></i>
                </div>

                <div className="summary-content">
                  <span>Average per Day</span>

                  <strong>{averagePerDay}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="top-learners-card">
            <h3>Top Learners</h3>

            <p>Historical engagement</p>

            <div className="top-learners-header">
              <span>LEARNER</span>

              <span>LABS COMPLETED</span>

              <span>LEARNING TIME</span>
            </div>

            {(analytics.topLearners || []).slice(0, 5).map((learner, index) => (
              <div key={learner.name} className="top-learner-row">
                <div className="learner-main">
                  <div className={`learner-avatar avatar-${index + 1}`}>
                    {learner.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="learner-name">{learner.name}</div>
                </div>

                <div className="learner-count">{learner.labs}</div>

                <div className={`learner-hours hours-${index + 1}`}>
                  {learner.hours} h
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <div className="card-header">
          <div>
            <h2>Section Distribution & Most Used Labs</h2>

            <p>Learning path engagement across all lab sessions</p>
          </div>
        </div>

        <div className="distribution-layout">
          {/* LEFT SIDE */}

          <div className="distribution-left">
            <div className="distribution-chart">
              <ResponsiveContainer width="100%" height={420}>
                <PieChart>
                  <Pie
                    data={analytics.sectionDistribution}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={95}
                    outerRadius={150}
                    paddingAngle={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analytics.sectionDistribution.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={getSectionColor(entry.name)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center">
                <div className="donut-total">{summary.totalLaunches}</div>

                <div className="donut-label">Total Launches</div>
              </div>
            </div>

            {/* SECTION NAMES BELOW DONUT */}

            <div className="distribution-legend">
              {analytics.sectionDistribution.map((section) => (
                <div key={section.name} className="legend-chip">
                  <span
                    className="legend-dot"
                    style={{
                      backgroundColor: getSectionColor(section.name),
                    }}
                  />

                  <span className="legend-name">{section.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="top-labs-panel">
            <h3>Most Used Labs</h3>

            <p className="top-labs-subtitle">Ranked by total launches</p>

            {(analytics.topLabs || []).slice(0, 5).map((lab, index) => (
              <div key={lab.name} className="top-lab-row">
                <div className="top-lab-left">
                  <span className="rank">{index + 1}</span>

                  <span className="lab-name">{lab.name}</span>
                </div>

                <span className="launch-count">{lab.launches}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <div className="card-header">
          <div>
            <h2>Labs inside permission sets</h2>

            <p>Top 3 labs run under each permission set</p>
          </div>
        </div>

        {analytics.permissionSets.map((permission) => (
          <details key={permission.permissionSet} className="permission-card">
            <summary>
              <span className="permission-title">
                {permission.permissionSet}
              </span>

              <span className="permission-launches">
                {permission.launches} launches
              </span>
            </summary>

            <div className="permission-labs">
              {permission.labs.slice(0, 3).map((lab, index) => (
                <div key={lab.name} className="permission-lab">
                  <span className="lab-rank">{index + 1}</span>

                  <div className="permission-lab-name">{lab.name}</div>

                  <div className="permission-lab-count">{lab.launches}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
