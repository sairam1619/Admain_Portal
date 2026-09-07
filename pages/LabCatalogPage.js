function LabCard({
  lab,
  index,
  service,
  setCurrentPage,
  setSelectedService,
  setSelectedLab,
  onLabDeleted,
}) {
  const [labActionsOpen, setLabActionsOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
  const [showDeleteFailed, setShowDeleteFailed] = React.useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState("");

  async function pollLabDeleteStatus(jobId) {
    try {
      const result = await getLabDeleteStatus(jobId);
      const status = result?.job?.status;

      if (status === "COMPLETED") {
        setDeleteLoading(false);
        setDeleteModalOpen(false); // Close the confirm modal now that it's complete
        setShowDeleteSuccess(true);
        return;
      }

      if (status === "FAILED") {
        setDeleteLoading(false);
        setDeleteModalOpen(false);
        setDeleteErrorMessage(
          result?.job?.message ||
          "Unable to delete the lab. Please try again."
        );
        setShowDeleteFailed(true);
        return;
      }

      setTimeout(() => {
        pollLabDeleteStatus(jobId);
      }, 2000);
    } catch (error) {
      console.error("Failed to check lab deletion status:", error);
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setDeleteErrorMessage(
        error?.message ||
        "Unable to check lab deletion status."
      );
      setShowDeleteFailed(true);
    }
  }

  return (
    <>
      <details className="catalog-lab">
        <summary>
          <div className="lab-left">
            <div className="lab-number">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className="lab-main">
              <div className="lab-title">{lab.name}</div>

              <div className="lab-services">
                {(lab.services || []).map((service) => (
                  <span key={service} className="service-chip">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="lab-right">
            {/* EDIT LAB */}
            <button
              type="button"
              className="btn-square btn-outline lab-action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                setSelectedService(service);
                setSelectedLab(lab);
                setCurrentPage("editlab");
              }}
            >
              <i className="bi bi-pencil"></i>
              Edit Lab
            </button>

            {/* VIEW DOCUMENTATION */}
            {lab.documentationUrl && (
              <a
                href={lab.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-square btn-primary lab-action-btn"
                onClick={(e) => e.stopPropagation()}
              >
                View Documentation
              </a>
            )}

            {/* THREE DOTS */}
            <div className="lab-actions">
              <button
                type="button"
                className="lab-actions-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setLabActionsOpen((prev) => !prev);
                }}
              >
                <i className="bi bi-three-dots-vertical"></i>
              </button>

              {labActionsOpen && (
                <div
                  className="lab-actions-menu"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <button
                    type="button"
                    className="delete-action"
                    onClick={() => {
                      setLabActionsOpen(false);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <i className="bi bi-trash3"></i>
                    Delete Lab
                  </button>
                </div>
              )}
            </div>

            {/* EXPAND */}
            <span className="expand-icon">
              <i className="bi bi-chevron-down"></i>
            </span>
          </div>
        </summary>

        <div className="lab-description">
          <p>{lab.description}</p>
        </div>
      </details>

      {/* CONFIRM DELETE MODAL */}
      {deleteModalOpen && (
        <CustomConfirmModal
          title="Delete Lab?"
          message={`Are you sure you want to delete "${lab.name}"?`}
          confirmText="delete"
          confirmButtonText="Delete Lab"
          confirmButtonDisabled={deleteLoading}
          onCancel={() => !deleteLoading && setDeleteModalOpen(false)}
          onConfirm={async () => {
            try {
              setDeleteLoading(true);

              const result = await deleteLab(service, lab.name);

              if (result?.jobId) {
                pollLabDeleteStatus(result.jobId);
              } else {
                throw new Error("Lab deletion job was not created.");
              }
            } catch (error) {
              console.error("Failed to start lab deletion:", error);
              setDeleteLoading(false);
              setDeleteModalOpen(false);
              setDeleteErrorMessage(
                error?.message ||
                "Unable to delete the lab. Please try again."
              );
              setShowDeleteFailed(true);
            }
          }}
        />
      )}

      {/* SUCCESS MODAL */}
      {showDeleteSuccess && (
        <CustomAlertModal
          icon="/assets/icons/DB-Success.png"
          title="Lab Deleted Successfully"
          message="The lab has been removed from the catalog."
          buttonText="Close"
          onButtonClick={() => {
            setShowDeleteSuccess(false);
            if (onLabDeleted) {
              onLabDeleted(lab.name);
            }
          }}
        />
      )}

      {/* FAILED MODAL */}
      {showDeleteFailed && (
        <CustomAlertModal
          icon="/assets/icons/Failed.png"
          iconClass="failed"
          showLine={false}
          title="Lab Deletion Failed"
          message={deleteErrorMessage}
          buttonText="Close"
          onButtonClick={() => setShowDeleteFailed(false)}
        />
      )}
    </>
  );
}

function LabCatalogPage({
  setGlobalError,
  setCurrentPage,
  setSelectedService,
  setSelectedLab,
}) {
  const [catalog, setCatalog] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [searchText, setSearchText] = React.useState("");
  const [serviceActionsOpen, setServiceActionsOpen] = React.useState(false);

  // New state for Delete Service functionality
  const [deleteServiceModalOpen, setDeleteServiceModalOpen] = React.useState(false);
  const [deleteServiceLoading, setDeleteServiceLoading] = React.useState(false);
  const [showDeleteServiceSuccess, setShowDeleteServiceSuccess] = React.useState(false);
  const [showDeleteServiceFailed, setShowDeleteServiceFailed] = React.useState(false);
  const [deleteServiceErrorMessage, setDeleteServiceErrorMessage] = React.useState("");

  React.useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      const data = await fetchLabCatalog();
      setCatalog(data);
      setSelectedIndex(0);
    } catch (error) {
      console.error(error);
      setGlobalError("Failed to load lab catalog.");
    } finally {
      setLoading(false);
    }
  }

  const handleLabDeleted = (serviceName, deletedLabName) => {
    setCatalog((prevCatalog) =>
      prevCatalog.map((item) => {
        const currentServiceName = item.title.replace(/\s+Deep Dive\s*$/i, "").trim();

        if (currentServiceName.toLowerCase() === serviceName.trim().toLowerCase()) {
          return {
            ...item,
            labs: (item.labs || []).filter((l) => l.name !== deletedLabName),
          };
        }

        return item;
      })
    );
  };

  // Status poller for deleting an entire service
  async function pollServiceDeleteStatus(jobId) {
    try {
      const result = await getServiceDeleteStatus(jobId);
      const status = result?.job?.status;

      if (status === "COMPLETED") {
        setDeleteServiceLoading(false);
        setDeleteServiceModalOpen(false);
        setShowDeleteServiceSuccess(true);
        return;
      }

      if (status === "FAILED") {
        setDeleteServiceLoading(false);
        setDeleteServiceModalOpen(false);
        setDeleteServiceErrorMessage(
          result?.job?.message ||
          "Unable to delete the service. Please try again."
        );
        setShowDeleteServiceFailed(true);
        return;
      }

      setTimeout(() => {
        pollServiceDeleteStatus(jobId);
      }, 2000);
    } catch (error) {
      console.error("Failed to check service deletion status:", error);
      setDeleteServiceLoading(false);
      setDeleteServiceModalOpen(false);
      setDeleteServiceErrorMessage(
        error?.message ||
        "Unable to check service deletion status."
      );
      setShowDeleteServiceFailed(true);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading Lab Catalog" />;
  }

  if (!catalog.length) {
    return null;
  }

  const permission = catalog[selectedIndex];
  const search = searchText.trim().toLowerCase();
  const isSearching = search.length > 0;

  const searchResults = catalog
    .map((permission) => ({
      ...permission,
      labs: (permission.labs || []).filter(
        (lab) =>
          (lab.name || "").toLowerCase().includes(search) ||
          (lab.services || []).some((service) =>
            (service || "").toLowerCase().includes(search)
          )
      ),
    }))
    .filter((permission) => permission.labs.length > 0);

  return (
    <div className="catalog-page">
      {/* ===========================
        PAGE HEADER
        =========================== */}
      <div className="catalog-header">
        <div className="page-header">
          <h1>Lab Catalog</h1>

          <p>
            Browse AWS services and quickly find hands-on labs and
            documentation.
          </p>
        </div>

        <button
          className="btn-square btn-primary"
          onClick={() => setCurrentPage("addservice")}
        >
          <i className="bi bi-plus-lg"></i>
          Add Service
        </button>
      </div>

      {/* ===========================
          SERVICE TABS
      =========================== */}
      {!isSearching && (
        <div className="catalog-tabs">
          {catalog.map((item, index) => {
            const service = item.title.replace(" Deep Dive", "");

            return (
              <button
                key={item.permissionSet}
                className={
                  selectedIndex === index ? "catalog-tab active" : "catalog-tab"
                }
                onClick={() => {
                  setSelectedIndex(index);
                  setSearchText("");
                }}
              >
                <img
                  src={item.iconUrl}
                  className="catalog-tab-icon"
                  alt={service}
                />

                <span>{service}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="catalog-search">
        <i className="bi bi-search"></i>

        <input
          type="text"
          placeholder="Search all labs..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* ===========================
          DEEP DIVE CARD
      =========================== */}
      {!isSearching && (
        <div className="catalog-info-card">
          <div className="catalog-title-row">
            <div className="catalog-title-left">
              <img
                src={permission.iconUrl}
                className="catalog-title-icon"
                alt={permission.title}
              />

              <div>
                <h2>{permission.title}</h2>

                <p>{permission.description}</p>
              </div>
            </div>

            <div className="service-actions">
              <button
                type="button"
                className="service-actions-btn"
                onClick={() => setServiceActionsOpen((prev) => !prev)}
              >
                Actions
                <i
                  className={`bi ${serviceActionsOpen ? "bi-chevron-up" : "bi-chevron-down"
                    } `}
                ></i>
              </button>

              {serviceActionsOpen && (
                <div className="service-actions-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(permission);
                      setServiceActionsOpen(false);
                      setCurrentPage("editservice");
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                    Edit Service
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(permission);
                      setServiceActionsOpen(false);
                      setCurrentPage("addlab");
                    }}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Add Lab
                  </button>

                  <a
                    href={permission.awsConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setServiceActionsOpen(false)}
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                    Open Permission Set
                  </a>

                  <button
                    type="button"
                    className="delete-action"
                    onClick={() => {
                      setServiceActionsOpen(false);
                      setDeleteServiceModalOpen(true);
                    }}
                  >
                    <i className="bi bi-trash3"></i>
                    Delete Service
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ======================================
          PERMISSION DETAILS
          ====================================== */}
          <div className="catalog-details">
            <div className="catalog-details-left">
              <div className="catalog-info-row">
                <div className="catalog-label">Permission Set</div>

                <div className="catalog-value">{permission.permissionSet}</div>
              </div>

              <div className="catalog-info-row">
                <div className="catalog-label">Duration</div>

                <div className="catalog-value">{permission.duration}</div>
              </div>
            </div>
          </div>

          {/* ======================================
          SERVICES
          ====================================== */}
          <div className="permission-services">
            {(permission.services || []).map((service) => (
              <span key={service} className="service-chip">
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===========================
          LABS
      =========================== */}
      {!isSearching ? (
        <div className="labs-container">
          {(permission.labs || []).map((lab, index) => {
            const currentService = permission.title.replace(/\s+Deep Dive\s*$/i, "");
            return (
              <LabCard
                key={lab.name}
                lab={lab}
                index={index}
                service={currentService}
                setCurrentPage={setCurrentPage}
                setSelectedService={setSelectedService}
                setSelectedLab={setSelectedLab}
                onLabDeleted={(deletedName) => handleLabDeleted(currentService, deletedName)}
              />
            );
          })}
        </div>
      ) : (
        <div className="search-results">
          {searchResults.length === 0 ? (
            <div className="no-labs-found">
              No labs found matching your search.
            </div>
          ) : (
            searchResults.map((section) => {
              const service = section.title.replace(" Deep Dive", "");

              return (
                <div key={section.permissionSet} className="search-section">
                  <div className="search-section-header">
                    <img
                      src={section.iconUrl}
                      className="catalog-tab-icon"
                      alt={service}
                    />

                    <h3>{section.title}</h3>
                  </div>

                  <div className="labs-container">
                    {section.labs.map((lab, index) => {
                      const currentService = section.title.replace(/\s+Deep Dive\s*$/i, "");
                      return (
                        <LabCard
                          key={`${section.permissionSet} -${lab.name} `}
                          lab={lab}
                          index={index}
                          service={currentService}
                          setCurrentPage={setCurrentPage}
                          setSelectedService={setSelectedService}
                          setSelectedLab={setSelectedLab}
                          onLabDeleted={(deletedName) => handleLabDeleted(currentService, deletedName)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================
          SERVICE DELETE MODALS 
          ====================================== */}
      {/* CONFIRM DELETE SERVICE MODAL */}
      {deleteServiceModalOpen && (
        <CustomConfirmModal
          title="Delete Service?"
          message={`Are you sure you want to delete "${permission?.title}"?`}
          confirmText="delete"
          confirmButtonText="Delete Service"
          confirmButtonDisabled={deleteServiceLoading}
          onCancel={() => !deleteServiceLoading && setDeleteServiceModalOpen(false)}
          onConfirm={async () => {
            try {
              setDeleteServiceLoading(true);
              const currentService = permission.title.replace(/\s+Deep Dive\s*$/i, "").trim();
              const result = await deleteService(currentService);

              if (result?.jobId) {
                pollServiceDeleteStatus(result.jobId);
              } else {
                throw new Error("Service deletion job was not created.");
              }
            } catch (error) {
              console.error("Failed to start service deletion:", error);
              setDeleteServiceLoading(false);
              setDeleteServiceModalOpen(false);
              setDeleteServiceErrorMessage(
                error?.message ||
                "Unable to delete the service. Please try again."
              );
              setShowDeleteServiceFailed(true);
            }
          }}
        />
      )}

      {/* SERVICE DELETE SUCCESS MODAL */}
      {showDeleteServiceSuccess && (
        <CustomAlertModal
          icon="/assets/icons/DB-Success.png"
          title="Service Deleted Successfully"
          message="The service has been removed from the catalog."
          buttonText="Close"
          onButtonClick={() => {
            setShowDeleteServiceSuccess(false);
            // Refresh catalog to reflect deletion and reset state
            loadCatalog();
          }}
        />
      )}

      {/* SERVICE DELETE FAILED MODAL */}
      {showDeleteServiceFailed && (
        <CustomAlertModal
          icon="/assets/icons/Failed.png"
          iconClass="failed"
          showLine={false}
          title="Service Deletion Failed"
          message={deleteServiceErrorMessage}
          buttonText="Close"
          onButtonClick={() => setShowDeleteServiceFailed(false)}
        />
      )}
    </div>
  );
}