const {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} = Recharts;

function DashboardPage() {
  const [dashboard, setDashboard] = React.useState(null);

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState("");

  React.useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      setError("");

      const data = await adminFetch("/admin/dashboard");

      setDashboard(data);
    } catch (err) {
      console.error(err);

      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading Dashboard" />;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      {/* ===========================
              HERO SECTION
      =========================== */}

      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>Welcome to Cloud Ops 👋</h1>

          <h3>Cloud Operations Platform</h3>

          <p>
            Monitor lab activity, manage cloud resources,
            and keep the platform running smoothly.
          </p>
        </div>
      </div>

      {/* ===========================
              METRIC CARDS
      =========================== */}
      <div className="dashboard-metrics">
        <div className="dashboard-metric-card">
          <div className="dashboard-metric-icon dashboard-blue">
            <img src="assets/icons/DB-users.png" alt="Users" />
          </div>

          <div className="dashboard-metric-content">
            <h4>Active STS Sessions</h4>

            <h2>{dashboard.metrics.activeSessions}</h2>

            <p>{dashboard.metrics.completedToday} completed today</p>
          </div>
        </div>

        <div className="dashboard-metric-card">
          <div className="dashboard-metric-icon dashboard-purple">
            <img src="assets/icons/DB-accounts.png" alt="Accounts" />
          </div>

          <div className="dashboard-metric-content">
            <h4>Available Lab Accounts</h4>

            <h2>{dashboard.metrics.availableAccounts}</h2>

            <p>Out of {dashboard.metrics.totalAccounts}</p>
          </div>
        </div>

        <div className="dashboard-metric-card">
          <div className="dashboard-metric-icon dashboard-green">
            <img src="assets/icons/DB-Success.png" alt="Success" />
          </div>

          <div className="dashboard-metric-content">
            <h4>Session Success Rate</h4>

            <h2>{dashboard.metrics.successRate}%</h2>

            <span
              className={
                dashboard.trends.successRateChange >= 0
                  ? "dashboard-positive-change"
                  : "dashboard-negative-change"
              }
            >
              {dashboard.trends.successRateChange >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(dashboard.trends.successRateChange)}% vs yesterday
            </span>
          </div>
        </div>

        <div className="dashboard-metric-card">
          <div className="dashboard-metric-icon dashboard-orange">
            <img src="assets/icons/DB-Failed.png" alt="Failed" />
          </div>

          <div className="dashboard-metric-content">
            <h4>Failed Launches (24h)</h4>

            <h2>{dashboard.metrics.failedLaunches24h}</h2>

            <span
              className={
                dashboard.trends.failedLaunchesChange <= 0
                  ? "dashboard-positive-change"
                  : "dashboard-negative-change"
              }
            >
              {dashboard.trends.failedLaunchesChange <= 0 ? "↓" : "↑"}{" "}
              {Math.abs(dashboard.trends.failedLaunchesChange)}% vs yesterday
            </span>
          </div>
        </div>
      </div>
      {/* ===========================
              PLATFORM ACTIVITY
      =========================== */}
      <div className="dashboard-middle">
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div>
              <h2>
                Platform Activity
                <span className="dashboard-chart-period">(Last 7 Days)</span>
              </h2>

              <p className="dashboard-chart-summary">
                User engagement, AWS account utilization, and lab session
                activity across the platform.
              </p>
            </div>
          </div>

          <div className="dashboard-chart-container">
            <ResponsiveContainer width="100%" height={390}>
              <ComposedChart
                data={dashboard.platformActivity}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="dashboardUsersGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />

                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />

                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  padding={{
                    top: 10,
                    bottom: 10,
                  }}
                  domain={[
                    0,
                    (max) => {
                      if (max <= 10) {
                        return Math.ceil((max + 2) / 2) * 2;
                      }

                      return Math.ceil((max + 3) / 3) * 3;
                    },
                  ]}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="left"
                  height={36}
                  payload={[
                    {
                      value: "Lab Sessions",
                      type: "circle",
                      color: "#2563eb",
                    },
                    {
                      value: "AWS Accounts",
                      type: "circle",
                      color: "#7c3aed",
                    },
                    {
                      value: "Unique Users",
                      type: "circle",
                      color: "#10b981",
                    },
                  ]}
                />

                {/* Background Gradient */}
                <Area
                  type="linear"
                  dataKey="sessions"
                  fill="url(#dashboardUsersGradient)"
                  fillOpacity={0.45}
                  stroke="none"
                  legendType="none"
                />

                {/* Lab Sessions */}
                <Line
                  type="linear"
                  dataKey="sessions"
                  connectNulls={true}
                  name="Lab Sessions"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "#2563eb",
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />

                {/* AWS Accounts */}
                <Line
                  type="linear"
                  dataKey="accounts"
                  connectNulls={true}
                  name="AWS Accounts"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "#7c3aed",
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />

                {/* Unique Users */}
                <Line
                  type="linear"
                  dataKey="users"
                  connectNulls={true}
                  name="Unique Users"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "#10b981",
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ===========================
                ATTENTION REQUIRED
        =========================== */}

        <div className="dashboard-attention-card">
          <h2>Attention Required</h2>

          <div className="dashboard-attention-item">
            <div className="dashboard-attention-left">
              <div className="dashboard-attention-icon dashboard-attention-orange">
                <img src="assets/icons/Expiring.png" alt="Expiring" />
              </div>

              <div>
                <h4>Expiring Sessions</h4>
                <p>Sessions ending within next 30 minutes</p>
              </div>
            </div>

            <strong>{dashboard.attention.expiringSessions}</strong>
          </div>

          <div className="dashboard-attention-item">
            <div className="dashboard-attention-left">
              <div className="dashboard-attention-icon dashboard-attention-red">
                <img src="assets/icons/Stuck.png" alt="Stuck" />
              </div>

              <div>
                <h4>Accounts Stuck During Assigning</h4>
                <p>Accounts waiting over 30 minutes</p>
              </div>
            </div>

            <strong>{dashboard.attention.stuckAccounts}</strong>
          </div>

          <div className="dashboard-attention-item">
            <div className="dashboard-attention-left">
              <div className="dashboard-attention-icon dashboard-attention-purple">
                <img src="assets/icons/Quarantine.png" alt="Quarantine" />
              </div>

              <div>
                <h4>Quarantined Accounts</h4>
                <p>Accounts unavailable for allocation</p>
              </div>
            </div>

            <strong>{dashboard.attention.quarantinedAccounts}</strong>
          </div>

          <div className="dashboard-attention-item">
            <div className="dashboard-attention-left">
              <div className="dashboard-attention-icon dashboard-attention-red">
                <img src="assets/icons/Failed.png" alt="Failed" />
              </div>

              <div>
                <h4>Failed Launches</h4>
                <p>Failed lab launches in last 24 hours</p>
              </div>
            </div>

            <strong>{dashboard.attention.failedLaunches}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        {/* =========================
                TODAY'S ACTIVITY
        =========================== */}
        <div className="dashboard-activity-card">
          <div className="dashboard-card-header">
            <h2>Today's Activity</h2>
          </div>

          {dashboard.recentActivity.length === 0 ? (
            <div className="dashboard-empty-state">
              <h4>No activity today</h4>

              <p>User activity will appear here once labs are launched.</p>
            </div>
          ) : (
            dashboard.recentActivity.map((activity, index) => (
              <div key={index} className="dashboard-activity-row">
                <div className="dashboard-activity-time">
                  {formatTime(activity.eventTime)}
                </div>

                <div
                  className={`dashboard-activity-dot ${activity.status === "COMPLETED"
                    ? "success"
                    : activity.status === "FAILED"
                      ? "danger"
                      : "primary"
                    }`}
                />

                <div className="dashboard-activity-content">
                  <span>
                    <strong>{activity.username}</strong>{" "}
                    {activity.status === "COMPLETED"
                      ? "completed"
                      : activity.status === "FAILED"
                        ? "failed"
                        : "launched"}{" "}
                    {activity.lab}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================
                TOP RUNNING LABS
        =========================== */}

        <div className="dashboard-toplabs-card">
          <h2>Top Running Labs Today</h2>

          <p className="dashboard-card-subtitle">
            Active sessions and today's most launched labs
          </p>

          {dashboard.topLabs.length === 0 ? (
            <div className="dashboard-empty-state">
              <h4>No lab activity yet</h4>

              <p>Labs will appear here once users start launching sessions.</p>
            </div>
          ) : (
            dashboard.topLabs.map((lab, index) => (
              <div key={index} className="dashboard-toplab-row">
                <div className="dashboard-toplab-left">
                  <div className="dashboard-toplab-icon">
                    <img src="assets/icons/Lab.png" alt="Lab" />
                  </div>

                  <div>
                    <h4>{lab.name}</h4>

                    <p>
                      {lab.type === "ACTIVE"
                        ? "Active Sessions"
                        : "Launched Today"}
                    </p>
                  </div>
                </div>

                <strong>{lab.count}</strong>
              </div>
            ))
          )}
        </div>
        {/* ===========================
                PLATFORM SUMMARY
        =========================== */}
        <div className="dashboard-summary-card">
          <h2>Platform Summary</h2>

          <div className="dashboard-summary-row">
            <div className="dashboard-summary-left">
              <i className="bi bi-people"></i>
              <span>Registered Users</span>
            </div>

            <strong>{dashboard.summary.registeredUsers}</strong>
          </div>

          <div className="dashboard-summary-row">
            <div className="dashboard-summary-left">
              <i className="bi bi-shield-check"></i>
              <span>Permission Sets</span>
            </div>

            <strong>{dashboard.summary.permissionSets}</strong>
          </div>

          <div className="dashboard-summary-row">
            <div className="dashboard-summary-left">
              <i className="bi bi-box-seam"></i>
              <span>AWS Accounts</span>
            </div>

            <strong>{dashboard.summary.awsAccounts}</strong>
          </div>

          <div className="dashboard-summary-row">
            <div className="dashboard-summary-left">
              <i className="bi bi-check-circle"></i>
              <span>Labs Completed</span>
            </div>

            <strong>{dashboard.summary.labsCompleted}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
