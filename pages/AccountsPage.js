function AccountsPage() {
  const [accounts, setAccounts] = React.useState([]);

  const [stats, setStats] = React.useState({
    available: 0,
    active: 0,
    assigning: 0,
    cleaning: 0,
    quarantined: 0,
    total: 0,
  });

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState("");

  const [searchTerm, setSearchTerm] = React.useState("");

  const [selectedStatus, setSelectedStatus] = React.useState("ALL");

  const [showStatusMenu, setShowStatusMenu] = React.useState(false);

  React.useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setError("");

      const data = await fetchAccounts();

      setAccounts(data.accounts || []);

      setStats(
        data.stats || {
          available: 0,
          active: 0,
          assigning: 0,
          cleaning: 0,
          quarantined: 0,
          total: 0,
        },
      );
    } catch (error) {
      console.error("Failed to load accounts", error);

      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      (account.accountId || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (account.accountName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (account.assignedUser || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || account.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const utilization =
    stats.total > 0
      ? Math.round(((stats.active + stats.assigning) / stats.total) * 100)
      : 0;

  const availablePercent = stats.total
    ? (stats.available / stats.total) * 100
    : 0;

  const activePercent = stats.total ? (stats.active / stats.total) * 100 : 0;

  const assigningPercent = stats.total
    ? (stats.assigning / stats.total) * 100
    : 0;

  const cleaningPercent = stats.total
    ? (stats.cleaning / stats.total) * 100
    : 0;

  const quarantinedPercent = stats.total
    ? (stats.quarantined / stats.total) * 100
    : 0;

  const ringStyle = {
    background: `

      conic-gradient(

        #22c55e 0%
        ${availablePercent}%,

        #2563eb ${availablePercent}%
        ${availablePercent + activePercent}%,

        #7c3aed ${availablePercent + activePercent}%
        ${availablePercent + activePercent + assigningPercent}%,

        #f59e0b ${availablePercent + activePercent + assigningPercent}%
        ${availablePercent + activePercent + assigningPercent + cleaningPercent}%,

        #ef4444 ${availablePercent + activePercent + assigningPercent + cleaningPercent}%
        100%

      )

    `,
  };

  const pageHeader = (
    <div className="page-header">
      <div>
        <h2>Account Pool</h2>

        <p>
          Monitor account availability, utilization, and overall pool health.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingScreen message="Loading Account Pool" />;
  }

  return (
    <div className="page-section">
      {pageHeader}
      {error && <div className="error-banner">{error}</div>}

      {/* CAPACITY + HEALTH */}

      <div className="account-health-grid">
        <div className="capacity-card">
          <div className="capacity-ring" style={ringStyle}>
            <div className="capacity-ring-inner">
              <div className="capacity-percent">{utilization}%</div>

              <div className="capacity-text">Utilized</div>
            </div>
          </div>

          <div className="capacity-footer">
            {stats.active + stats.assigning}
            {" / "}
            {stats.total} Accounts In Use
          </div>

          <div className="ring-legend">
            <div className="legend-item">
              <span className="legend-dot available-dot" />
              Available
            </div>

            <div className="legend-item">
              <span className="legend-dot active-dot" />
              Active
            </div>

            <div className="legend-item">
              <span className="legend-dot assigning-dot" />
              Assigning
            </div>

            <div className="legend-item">
              <span className="legend-dot cleaning-dot" />
              Cleaning
            </div>

            <div className="legend-item">
              <span className="legend-dot quarantined-dot" />
              Quarantined
            </div>
          </div>
        </div>

        <div className="pool-health-card">
          <div className="pool-health-title">Pool Overview</div>

          <div className="health-row">
            <div className="health-label">
              <span className="dot available-dot" />
              Available Accounts
            </div>

            <div className="health-value">{stats.available}</div>
          </div>

          <div className="health-row">
            <div className="health-label">
              <span className="dot active-dot" />
              Active Sessions
            </div>

            <div className="health-value">{stats.active}</div>
          </div>

          <div className="health-row">
            <div className="health-label">
              <span className="dot assigning-dot" />
              Assigning
            </div>

            <div className="health-value">{stats.assigning}</div>
          </div>

          <div className="health-row">
            <div className="health-label">
              <span className="dot cleaning-dot" />
              Cleaning
            </div>

            <div className="health-value">{stats.cleaning}</div>
          </div>

          <div className="health-row">
            <div className="health-label">
              <span className="dot quarantined-dot" />
              Quarantined
            </div>

            <div className="health-value">{stats.quarantined}</div>
          </div>

          <div className="health-divider" />

          <div className="health-row total-row">
            <div className="health-label">Total Accounts</div>

            <div className="health-total">{stats.total}</div>
          </div>

          <div className="health-row total-row">
            <div className="health-label">Capacity Remaining</div>

            <div className="health-total">{100 - utilization}%</div>
          </div>
        </div>
      </div>

      {/* INVENTORY */}

      <div className="section-block">
        <div className="section-header">
          <div className="section-title">Lab Accounts</div>

          <div className="section-subtitle">
            Manage and monitor AWS lab accounts
          </div>
        </div>

        <div className="accounts-toolbar">
          <input
            type="text"
            className="accounts-search"
            placeholder="Search account or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="custom-filter">
            <button
              className="custom-filter-btn"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              {selectedStatus === "ALL" ? "All Status" : selectedStatus}

              <span className="filter-arrow">▼</span>
            </button>

            {showStatusMenu && (
              <div className="custom-filter-menu">
                <button
                  className="custom-filter-option"
                  onClick={() => {
                    setSelectedStatus("ALL");

                    setShowStatusMenu(false);
                  }}
                >
                  All Status
                </button>

                <button
                  className="custom-filter-option"
                  onClick={() => {
                    setSelectedStatus("AVAILABLE");

                    setShowStatusMenu(false);
                  }}
                >
                  Available
                </button>

                <button
                  className="custom-filter-option"
                  onClick={() => {
                    setSelectedStatus("ASSIGNING");

                    setShowStatusMenu(false);
                  }}
                >
                  Assigning
                </button>

                <button
                  className="custom-filter-option"
                  onClick={() => {
                    setSelectedStatus("ACTIVE");

                    setShowStatusMenu(false);
                  }}
                >
                  Active
                </button>

                <button
                  className="custom-filter-option"
                  onClick={() => {
                    setSelectedStatus("CLEANING");

                    setShowStatusMenu(false);
                  }}
                >
                  Cleaning
                </button>

                <button
                  className="custom-filter-option"
                  onClick={() => {
                    setSelectedStatus("QUARANTINED");

                    setShowStatusMenu(false);
                  }}
                >
                  Quarantined
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="accounts-empty">No accounts found</div>
        ) : (
          <div className="table-wrapper">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Account Name</th>
                  <th>Status</th>
                  <th>Assigned User</th>
                  <th>Current Lab</th>
                  <th>Section</th>
                  <th>Last Used</th>
                </tr>
              </thead>

              <tbody>
                {filteredAccounts.map((account, index) => (
                  <tr key={index}>
                    <td>{account.accountId || "-"}</td>

                    <td>{account.accountName || "-"}</td>

                    <td>
                      <span
                        className={
                          "account-status " +
                          (account.status || "").toLowerCase()
                        }
                      >
                        {account.status || "-"}
                      </span>
                    </td>

                    <td>{account.assignedUser || "-"}</td>

                    <td>{account.currentLab || "-"}</td>

                    <td>{account.section || "-"}</td>

                    <td>
                      {account.lastUsed ? formatDate(account.lastUsed) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
