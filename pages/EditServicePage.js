function EditServicePage({ setCurrentPage, selectedService }) {
  const [duration, setDuration] = React.useState("");

  const formatPolicy = (p) =>
    typeof p === "string"
      ? p
      : JSON.stringify(p || {}, null, 2);

  const [inlinePolicy, setInlinePolicy] = React.useState("");
  const [boundaryPolicy, setBoundaryPolicy] = React.useState("");

  const [policyName, setPolicyName] = React.useState("");
  const [boundaryName, setBoundaryName] = React.useState("");

  const [awsServices, setAwsServices] = React.useState(
    selectedService?.services || []
  );

  const [newAwsService, setNewAwsService] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [zoomedEditor, setZoomedEditor] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showFailedModal, setShowFailedModal] = React.useState(false);
  const [failedMessage, setFailedMessage] = React.useState("");

  const [showServiceDropdown, setShowServiceDropdown] = React.useState(false);
  const [serviceInput, setServiceInput] = React.useState("");
  const [labSetupErrors, setLabSetupErrors] = React.useState({});




  const removeAwsService = (service) => {
    setAwsServices((prev) => prev.filter((item) => item !== service));
  };

  const addService = () => {
    const value = awsInput.trim();
    if (!value) return;

    if (!awsServices.includes(value)) {
      setAwsServices([...awsServices, value]);
      setFieldErrors((prev) => ({
        ...prev,
        awsServices: ""
      }));
    }
    setAwsInput("");
  };


  const serviceName =
    selectedService?.service ||
    selectedService?.title?.replace(" Deep Dive", "") ||
    "";

  const description = selectedService?.description || "";
  const permissionSetName = selectedService?.permissionSet || "";

  React.useEffect(() => {
    const loadServiceDetails = async () => {
      if (!selectedService) return;

      try {
        const service =
          selectedService.service ||
          selectedService.title?.replace(" Deep Dive", "") ||
          "";

        const permissionSet = selectedService.permissionSet || "";
        const services = selectedService.services || [];

        setAwsServices(services);

        const result = await fetchService(
          service,
          permissionSet
        );

        console.log("GET service response:", result);

        if (!result || !result.success) {
          throw new Error(
            result?.message || "Failed to load service details."
          );
        }

        setDuration(result.duration ?? "");

        setInlinePolicy(
          formatPolicy(result.inlinePolicy ?? {})
        );

        setBoundaryPolicy(
          formatPolicy(result.boundaryPolicy ?? {})
        );

        setPolicyName(result.policyName ?? "");
        setBoundaryName(result.boundaryName ?? "");

      } catch (error) {
        console.error("Failed to load service details:", error);

        setFailedMessage(
          error.message || "Failed to load service details."
        );

        setShowFailedModal(true);
      }
    };

    loadServiceDetails();
  }, [selectedService]);

  const handleAddAwsService = () => {
    const service = newAwsService.trim();
    if (!service) return;

    const alreadyExists = awsServices.some(
      (item) => item.toLowerCase() === service.toLowerCase()
    );

    if (alreadyExists) {
      setNewAwsService("");
      return;
    }

    setAwsServices((prev) => [...prev, service]);
    setNewAwsService("");
  };

  const handleRemoveAwsService = (serviceToRemove) => {
    setAwsServices((prev) =>
      prev.filter((service) => service !== serviceToRemove)
    );
  };

  const handleAwsServiceKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAwsService();
    }
  };

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setZoomedEditor(null);
    };

    document.body.style.overflow = zoomedEditor ? "hidden" : "auto";
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "auto";
    };
  }, [zoomedEditor]);

  const validatePolicy = (value, name) => {
    if (!value.trim()) return `${name} is required.`;
    try {
      JSON.parse(value);
      return "";
    } catch {
      return "Please enter valid JSON.";
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    const errors = {};

    if (!duration || Number(duration) <= 0) errors.duration = "Duration is required.";

    const inlineError = validatePolicy(inlinePolicy, "Permission Policy");
    const boundaryError = validatePolicy(boundaryPolicy, "Permissions Boundary Policy");

    if (inlineError) errors.inlinePolicy = inlineError;
    if (boundaryError) errors.boundaryPolicy = boundaryError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      const serviceData = {
        service: serviceName,
        services: awsServices,
        duration: Number(duration),
        inlinePolicy: JSON.parse(inlinePolicy),
        boundaryPolicy: JSON.parse(boundaryPolicy),
        permissionSetName,
        policyName,
        boundaryName,
      };

      console.log("Sending updated service data:", serviceData);
      const result = await updateService(serviceData);
      console.log("Response from Admin Lambda:", result);

      if (!result || !result.success) {
        throw new Error(result?.message || "Service update failed.");
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to update service:", error);
      setFailedMessage(error.message || "Failed to update service.");
      setShowFailedModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => setCurrentPage("labcatalog");

  return (
    <>
      <div className="service-page">
        {zoomedEditor && <div className="zoom-backdrop" onClick={() => setZoomedEditor(null)} />}

        {/* HEADER */}
        <div className="service-header">
          <button type="button" className="service-back-btn" onClick={goBack}>← Back to Catalog</button>
          <h1>Edit Service</h1>
          <p>Modify permission configuration for this AWS service</p>
        </div>

        <div className="service-layout">
          {/* 1. SERVICE INFORMATION */}
          <div className="service-card">
            <div className="section-header">
              <div className="section-number">1</div>
              <div>
                <h3>Service Information</h3>
                <p>The details below are existing service configuration and cannot be changed.</p>
              </div>
            </div>

            {/* SERVICE NAME + DESCRIPTION */}
            <div className="service-grid service-info-grid">
              <div>
                <label>Service Name</label>
                <input
                  className="service-input service-input-readonly"
                  value={serviceName}
                  readOnly
                />
              </div>

              <div>
                <label>Description</label>
                <input
                  className="service-input service-input-readonly"
                  value={description}
                  readOnly
                />
              </div>
            </div>

            {/* PERMISSION SET + POLICY NAMES */}
            <div className="service-grid">
              <div className="service-form-group">
                <label>Permission Set Name</label>
                <input
                  className="service-input service-input-readonly"
                  value={permissionSetName}
                  readOnly
                />
              </div>

              <div className="service-form-group">
                <label>Policy Name (Inline)</label>
                <input
                  className="service-input service-input-readonly"
                  value={policyName}
                  readOnly
                />
              </div>

              <div className="service-form-group">
                <label>Boundary Name</label>
                <input
                  className="service-input service-input-readonly"
                  value={boundaryName}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* 2. AWS SERVICES */}
          <div className="service-card">
            <div className="section-header">
              <div className="section-number">2</div>
              <div>
                <h3>AWS Services</h3>
                <p>Add or remove the AWS services used by this configuration.</p>
              </div>
            </div>

            {/* ADD SERVICE */}
            <div className="service-form-group add-lab-services-field" style={{ position: 'relative' }}>
              <label>
                Added AWS Services <span className="required">*</span>
              </label>

              <div className="add-lab-service-input-row">
                <input
                  type="text"
                  value={serviceInput}
                  onChange={(e) => {
                    setServiceInput(e.target.value);
                    setShowServiceDropdown(true);
                  }}
                  onFocus={() => setShowServiceDropdown(true)}
                  onBlur={() => setShowServiceDropdown(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAwsService();
                      setShowServiceDropdown(false);
                    }
                  }}
                  placeholder="Search or enter service (e.g. Amazon S3)"
                />
                <button
                  type="button"
                  className="add-lab-service-add-button"
                  onClick={() => {
                    addAwsService();
                    setShowServiceDropdown(false);
                  }}
                >
                  Add
                </button>
              </div>
              {/* Dropdown Menu */}
              {showServiceDropdown && (
                <div className="add-lab-service-dropdown">
                  {AWS_SERVICES
                    .filter((s) =>
                      s.name.toLowerCase().includes(serviceInput.toLowerCase())
                    )
                    .map((svc) => (
                      <div
                        key={svc.name}
                        className="add-lab-service-dropdown-item"
                        onMouseDown={(e) => {
                          // Prevent the input from losing focus
                          // before the service selection is processed.
                          e.preventDefault();
                        }}
                        onClick={() => {
                          // Register the selected service
                          if (!awsServices.includes(svc.name)) {
                            setAwsServices((prev) => [...prev, svc.name]);

                            setLabSetupErrors((prev) => ({
                              ...prev,
                              awsServices: ""
                            }));
                          }

                          // Clear input and close dropdown
                          setServiceInput("");
                          setShowServiceDropdown(false);
                        }}
                      >
                        <img
                          src={`assets/AWS_Icons/${svc.icon}.png`}
                          alt={svc.name}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />

                        <span>{svc.name}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* SERVICE TAGS */}
              {awsServices.length > 0 && (
                <div className="add-lab-service-tags">
                  {awsServices.map((service) => {
                    const foundService = AWS_SERVICES.find(
                      (s) => s.name === service
                    );

                    const formattedIconName = foundService
                      ? foundService.icon
                      : service.toLowerCase().replace(/\s+/g, "");

                    return (
                      <div className="add-lab-service-tag" key={service}>
                        <img
                          src={`assets/AWS_Icons/${formattedIconName}.png`}
                          alt={service}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />

                        <span>{service}</span>

                        <button
                          type="button"
                          onClick={() => removeAwsService(service)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="add-lab-service-count">
                {awsServices.length} {awsServices.length === 1 ? "service" : "services"} added
              </div>
              {labSetupErrors.awsServices && (
                <div className="add-lab-validation-error">
                  {labSetupErrors.awsServices}
                </div>
              )}
            </div>
          </div>

          {/* 3. PERMISSION CONFIGURATION */}
          <div className="service-card">
            <div className="section-header">
              <div className="section-number">3</div>
              <div>
                <h3>Permission Configuration</h3>
                <p>Update the session duration and modify inline policy and permission boundary.</p>
              </div>
            </div>

            <div className="service-form-group">
              <label>Session Duration (minutes)</label>
              <input
                className={`service-input ${fieldErrors.duration ? "input-error" : ""}`}
                type="number"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, duration: "" }));
                }}
              />
              <span className="service-help-text">Total lab session duration</span>
              {fieldErrors.duration && <div className="field-error">{fieldErrors.duration}</div>}
            </div>

            <div className="policy-grid">
              <div>
                <JsonCodeEditor
                  title={<>Inline Policy (JSON)<span className="editor-info">ℹ</span></>}
                  value={inlinePolicy}
                  onChange={(value) => {
                    setInlinePolicy(value);
                    setFieldErrors((prev) => ({ ...prev, inlinePolicy: "" }));
                  }}
                  required
                  minLines={25}
                  isZoomed={zoomedEditor === "inline"}
                  onZoom={() => setZoomedEditor(zoomedEditor === "inline" ? null : "inline")}
                  fieldError={fieldErrors.inlinePolicy}
                />
              </div>

              <div>
                <JsonCodeEditor
                  title={<>Permissions Boundary (JSON)<span className="editor-info">ℹ</span></>}
                  value={boundaryPolicy}
                  onChange={(value) => {
                    setBoundaryPolicy(value);
                    setFieldErrors((prev) => ({ ...prev, boundaryPolicy: "" }));
                  }}
                  required
                  minLines={25}
                  isZoomed={zoomedEditor === "boundary"}
                  onZoom={() => setZoomedEditor(zoomedEditor === "boundary" ? null : "boundary")}
                  fieldError={fieldErrors.boundaryPolicy}
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="service-action-buttons">
            <button type="button" className="service-cancel-btn" onClick={goBack} disabled={isSaving}>Cancel</button>
            <button type="button" className="service-create-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS */}
      {showSuccessModal && (
        <CustomAlertModal
          icon="/assets/icons/DB-Success.png"
          title="Service Updated Successfully!"
          message={`The AWS service "${serviceName}" has been updated successfully.`}
          buttonText="←  Back to Catalog"
          onButtonClick={() => { setShowSuccessModal(false); setCurrentPage("labcatalog"); }}
        />
      )}

      {/* FAILED */}
      {showFailedModal && (
        <CustomAlertModal
          icon="/assets/icons/Failed.png"
          iconClass="failed"
          showLine={false}
          title="Service Update Failed"
          message={failedMessage}
          buttonText="←  Back to Catalog"
          onButtonClick={() => { setShowFailedModal(false); setCurrentPage("labcatalog"); }}
        />
      )}
    </>
  );
}