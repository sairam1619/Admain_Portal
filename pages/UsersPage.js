function UsersPage() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("lastLogin");
  const [sortDirection, setSortDirection] = React.useState("desc");
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortRef = React.useRef(null);

  React.useEffect(() => {
    loadUsers();
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchUsers();

      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);

      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleBlockUser(userId) {
    try {
      await blockUser(userId);

      await loadUsers();
    } catch (error) {
      console.error("Failed to block user", error);

      setError("Failed to block user");
    }
  }

  async function handleUnblockUser(userId) {
    try {
      await unblockUser(userId);

      await loadUsers();
    } catch (error) {
      console.error("Failed to unblock user", error);

      setError("Failed to unblock user");
    }
  }

  /*
    SEARCH FILTER
  */

  const filteredUsers = users.filter((user) => {
    const searchValue = search.trim().toLowerCase();

    const value = `${user.name || ""} ${user.email || ""}`.toLowerCase();

    return value.includes(searchValue);
  });

  /*
    SORT
  */

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "lastLogin") {
      comparison = new Date(a.lastLogin || 0) - new Date(b.lastLogin || 0);
    }

    if (sortBy === "labs") {
      comparison = (a.totalLabsCompleted || 0) - (b.totalLabsCompleted || 0);
    }

    if (sortBy === "hours") {
      comparison = (a.totalMinutesSpent || 0) - (b.totalMinutesSpent || 0);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const pageHeader = (
    <div className="page-header">
      <div>
        <h2>Users</h2>

        <p>
          Manage registered users, monitor activity, and control platform
          access.
        </p>
      </div>
    </div>
  );

  /*
    LOADING
  */
  if (loading) {
    return <LoadingScreen message="Loading Users" />;
  }

  return (
    <div className="page-section">
      {pageHeader}
      <div className="users-hero">
        <div className="users-hero-left">
          <div className="users-hero-icon-wrapper">
            <img
              src="assets/icons/purple-users.png"
              className="users-hero-icon"
              alt=""
            />
          </div>

          <div>
            <div className="users-hero-label">TOTAL USERS</div>

            <div className="users-hero-count">{users.length}</div>

            <div className="users-hero-text">
              All registered users across the platform
            </div>
          </div>
        </div>

        <img
          src="assets/icons/users-card.png"
          className="users-hero-bg"
          alt=""
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* TOOLBAR */}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="sort-dropdown-wrapper" ref={sortRef}>
          <button
            className="sort-dropdown-btn"
            onClick={(event) => {
              event.stopPropagation();

              setSortOpen(!sortOpen);
            }}
          >
            {sortBy === "lastLogin"
              ? "Last Login"
              : sortBy === "labs"
                ? "Labs Completed"
                : "Hours Spent"}

            <span className="sort-arrow">▾</span>
          </button>

          {sortOpen && (
            <div
              className="sort-dropdown-menu"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="sort-option"
                onClick={() => {
                  setSortBy("lastLogin");

                  setSortOpen(false);
                }}
              >
                Last Login
              </button>

              <button
                className="sort-option"
                onClick={() => {
                  setSortBy("labs");

                  setSortOpen(false);
                }}
              >
                Labs Completed
              </button>

              <button
                className="sort-option"
                onClick={() => {
                  setSortBy("hours");

                  setSortOpen(false);
                }}
              >
                Hours Spent
              </button>
            </div>
          )}
        </div>

        <button
          className="sort-direction-btn"
          onClick={() =>
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
          }
        >
          ↑↓
        </button>
      </div>

      {/* EMPTY */}

      {sortedUsers.length === 0 && (
        <div className="empty-state">No matching users found</div>
      )}

      {/* TABLE */}

      {sortedUsers.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>

                <th>Access</th>

                <th>Lab Session</th>

                <th>Labs</th>

                <th>Hours</th>

                <th>Last Login</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <div className="user-cell">
                      <div
                        className={`user-avatar avatar-${(user.name || "U")
                          .charAt(0)
                          .toUpperCase()}`}
                      >
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="user-name">{user.name || "-"}</div>

                        <div className="user-email">{user.email || "-"}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <StatusBadge status={user.status || "UNKNOWN"} />
                  </td>

                  <td>
                    <div
                      className={
                        user.activeSession ? "session-live" : "session-offline"
                      }
                    >
                      {user.activeSession ? "IN LAB" : "IDLE"}
                    </div>
                  </td>

                  <td>{user.totalLabsCompleted || 0}</td>

                  <td>{formatHours(user.totalMinutesSpent || 0)}</td>

                  <td className="last-login">
                    {formatDate(user.lastLogin)
                      .split("\n")
                      .map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                  </td>

                  <td>
                    {user.status === "BLOCKED" ? (
                      <button
                        className="success-btn"
                        onClick={() => handleUnblockUser(user.userId)}
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        className="danger-btn"
                        onClick={() => handleBlockUser(user.userId)}
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <div>
              Showing 1 to {sortedUsers.length} of {users.length} users
            </div>

            <div className="pagination">
              <button>{"<"}</button>

              <button className="active">1</button>

              <button>{">"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
