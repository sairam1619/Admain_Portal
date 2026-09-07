function App() {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const DEFAULT_PAGE = "labcatalog";

  const [currentPage, setCurrentPage] = React.useState(DEFAULT_PAGE);

  const [selectedService, setSelectedService] = React.useState(null);
  const [selectedLab, setSelectedLab] = React.useState(null);

  const [showLogoutPage, setShowLogoutPage] = React.useState(false);

  React.useEffect(() => {
    async function initialize() {
      try {
        saveAdminToken();

        const token = getAdminToken();

        if (!token) {
          return;
        }

        setAuthenticated(true);
      } catch (error) {
        console.error("Admin initialization failed", error);
        setError("Authentication failed");
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminDashboardData");

    setShowLogoutPage(true);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return null;
  }

  if (showLogoutPage) {
    return (
      <div className="admin-logout-page">
        <div className="admin-logout-card">
          <div className="admin-logout-icon">
            <i className="bi bi-shield-check"></i>
          </div>

          <h1>Logout Successful</h1>

          <p>You have been securely signed out of the Admin Portal.</p>

          <button
            className="admin-logout-button"
            onClick={startAdminLogin}
          >
            Sign In Again
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      <main className="main">

        <ErrorBanner message={error} />

        {currentPage === "users" && (
          <UsersPage setGlobalError={setError} />
        )}

        {currentPage === "sessions" && (
          <LiveSessionsPage setGlobalError={setError} />
        )}

        {currentPage === "accounts" && (
          <AccountsPage setGlobalError={setError} />
        )}

        {currentPage === "permissions" && (
          <PermissionsPage setGlobalError={setError} />
        )}

        {currentPage === "labcatalog" && (
          <LabCatalogPage
            setGlobalError={setError}
            setCurrentPage={setCurrentPage}
            setSelectedService={setSelectedService}
            setSelectedLab={setSelectedLab}
          />
        )}

        {currentPage === "addservice" && (
          <AddServicePage
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === "editservice" && (
          <EditServicePage
            setCurrentPage={setCurrentPage}
            selectedService={selectedService}
          />
        )}

        {currentPage === "addlab" && (
          <AddLabPage
            setCurrentPage={setCurrentPage}
            selectedService={selectedService}
          />
        )}

        {currentPage === "editlab" && (
          <EditLabPage
            setCurrentPage={setCurrentPage}
            selectedService={selectedService}
            selectedLab={selectedLab}
          />
        )}

        {currentPage === "analytics" && (
          <AnalyticsPage setGlobalError={setError} />
        )}

        {currentPage === "dashboard" && (
          <DashboardPage setGlobalError={setError} />
        )}

      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(<App />);