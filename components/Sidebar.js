function Sidebar({ currentPage, setCurrentPage, onLogout }) {
  return (
    <aside className="sidebar">
      <div>
        {/* BRAND */}

        <div className="brand">
          <div className="brand-icon">
            <div className="brand-core"></div>

            <div className="brand-dot"></div>
          </div>

          <div>
            <h1>Cloud Ops</h1>

            <span>ADMIN</span>
          </div>
        </div>

        {/* NAVIGATION */}

        <div className="nav-group">
          <div className="nav-label">MANAGEMENT</div>

          <button
            className={
              currentPage === "dashboard" ? "nav-item active-nav" : "nav-item"
            }
            onClick={() => setCurrentPage("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={
              currentPage === "users" ? "nav-item active-nav" : "nav-item"
            }
            onClick={() => setCurrentPage("users")}
          >
            Users
          </button>

          <button
            className={
              currentPage === "sessions" ? "nav-item active-nav" : "nav-item"
            }
            onClick={() => setCurrentPage("sessions")}
          >
            Live Sessions
          </button>

          <button
            className={
              currentPage === "accounts" ? "nav-item active-nav" : "nav-item"
            }
            onClick={() => setCurrentPage("accounts")}
          >
            Account Pool
          </button>

          <button
            className={
              currentPage === "permissions" ? "nav-item active-nav" : "nav-item"
            }
            onClick={() => setCurrentPage("permissions")}
          >
            Permission Sets
          </button>

          <button
            className={
              currentPage === "labcatalog" ? "nav-item active-nav" : "nav-item"
            }
            onClick={() => setCurrentPage("labcatalog")}
          >
            Lab Catalog
          </button>

          <button
            className={
              currentPage === "analytics" ? "nav-item active-nav" : "nav-item"
            }
            onClick={() => setCurrentPage("analytics")}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* FOOTER */}

      <div className="sidebar-footer">
        <div className="profile">
          <div className="avatar">
            {adminUsername()?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <div className="email">{adminUsername()}</div>

            <div className="role">Administrator</div>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
