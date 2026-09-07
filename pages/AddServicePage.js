function AddServicePage({ setCurrentPage }) {
  const [serviceName, setServiceName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [duration, setDuration] = React.useState(60);

  const [awsInput, setAwsInput] = React.useState("");
  const [awsServices, setAwsServices] = React.useState([]);

  const [inlinePolicy, setInlinePolicy] = React.useState(
    '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": [\n        "glue:*",\n        "s3:ListBucket"\n      ],\n      "Resource": "*"\n    }\n  ]\n}'
  );
  const [boundaryPolicy, setBoundaryPolicy] = React.useState(
    '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "glue:*",\n      "Resource": "*"\n    }\n  ]\n}'
  );

  const [iconFile, setIconFile] = React.useState(null);
  const [iconPreview, setIconPreview] = React.useState(null);
  const [iconError, setIconError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [isCreating, setIsCreating] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showFailedModal, setShowFailedModal] = React.useState(false);
  const [failedMessage, setFailedMessage] = React.useState("");
  const [showServiceDropdown, setShowServiceDropdown] = React.useState(false);
  const [serviceInput, setServiceInput] = React.useState("");

  const [zoomedEditor, setZoomedEditor] = React.useState(null);

  const removeAwsService = (service) => {
    setAwsServices((prev) => prev.filter((item) => item !== service));
  };

  // SCROLL SYNC REFS FOR PREVIEW
  const previewLinesRef = React.useRef(null);
  const previewTextRef = React.useRef(null);

  const MAX_SIZE = 50 * 1024;

  const normalizedService = serviceName.trim();

  const permissionSetName = normalizedService
    ? `${normalizedService}-Basic-PermissionSet`
    : "";

  const policyName = normalizedService
    ? `${normalizedService}-PermissionPolicy`
    : "";

  const boundaryName = normalizedService
    ? `${normalizedService}-LabBoundary`
    : "";

  const iconName = iconFile
    ? `${normalizedService || "service"}.${iconFile.name.split(".").pop().toLowerCase()}`
    : "";

  // FULLSCREEN ZOOM BEHAVIOR (ESC KEY + SCROLL LOCK)
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setZoomedEditor(null);
    };

    if (zoomedEditor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "auto";
    };
  }, [zoomedEditor]);

  // PREVIEW LINE NUMBER & SCROLL HELPERS
  const handlePreviewScroll = () => {
    if (previewTextRef.current && previewLinesRef.current) {
      previewLinesRef.current.scrollTop = previewTextRef.current.scrollTop;
    }
  };

  const renderPreviewLineNumbers = () => {
    const lines = [];
    const count = previewJSON.split("\n").length;
    for (let i = 1; i <= Math.max(count, 20); i++) {
      lines.push(<div key={i}>{i}</div>);
    }
    return lines;
  };

  const addService = () => {
    const value = awsInput.trim();
    if (!value) return;

    if (!awsServices.includes(value)) {
      setAwsServices([...awsServices, value]);
      setFieldErrors((prev) => ({
        ...prev,
        awsServices: "",
      }));
    }
    setAwsInput("");
  };

  const removeService = (s) => {
    setAwsServices(awsServices.filter((item) => item !== s));
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    setIconFile(null);
    setIconPreview(null);
    setIconError("");

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      setIconError("Only PNG, JPG, JPEG or SVG images are allowed");
      return;
    }

    if (file.size > MAX_SIZE) {
      setIconError("File must be less than 50KB");
      return;
    }

    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const parseJSON = (value) => {
    try {
      return value.trim() ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  };

  const parsedInlinePolicy = parseJSON(inlinePolicy);
  const parsedBoundaryPolicy = parseJSON(boundaryPolicy);

  const addAwsService = () => {
    const service = serviceInput.trim();
    if (!service) return;

    if (!awsServices.includes(service)) {
      setAwsServices((prev) => [...prev, service]);

      setFieldErrors((prev) => ({
        ...prev,
        awsServices: "",
      }));
    }

    setServiceInput("");
  };

  const previewJSON = JSON.stringify(
    {
      service: normalizedService || "",
      description: description || "",
      duration: Number(duration) || 0,
      awsServices,
      permissionSet: permissionSetName || "-Basic-PermissionSet",
      policyName: policyName || "-PermissionPolicy",
      boundaryName: boundaryName || "-LabBoundary",
      icon: iconName,
      policies: {
        inlinePolicy: parsedInlinePolicy,
        boundaryPolicy: parsedBoundaryPolicy,
      },
    },
    null,
    2
  );

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = reader.result.split(",")[1];

        const extension = file.name
          .split(".")
          .pop()
          .toLowerCase();

        const safeServiceName = normalizedService
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        resolve({
          fileName: `${safeServiceName}.${extension}`,
          contentType: file.type,
          base64,
        });
      };

      reader.onerror = () => {
        reject(new Error("Failed to read icon file"));
      };

      reader.readAsDataURL(file);
    });
  };

  const validatePolicy = (value, name) => {
    if (!value.trim()) {
      return `${name} is required.`;
    }

    try {
      JSON.parse(value);
      return "";
    } catch {
      return "Please enter valid JSON.";
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;

    const errors = {};

    if (!serviceName.trim()) {
      errors.serviceName = "Service Name is required.";
    }

    if (!duration || Number(duration) <= 0) {
      errors.duration = "Duration is required.";
    }

    if (!description.trim()) {
      errors.description = "Description is required.";
    }

    if (awsServices.length === 0) {
      errors.awsServices = "At least one AWS Service is required.";
    }

    if (!iconFile) {
      errors.icon = "Service Icon is required.";
    }

    const inlineError = validatePolicy(inlinePolicy, "Permission Policy");
    const boundaryError = validatePolicy(boundaryPolicy, "Permissions Boundary Policy");

    if (inlineError) {
      errors.inlinePolicy = inlineError;
    }

    if (boundaryError) {
      errors.boundaryPolicy = boundaryError;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsCreating(true);

    try {
      const icon = await fileToBase64(iconFile);
      const finalInlinePolicy = JSON.parse(inlinePolicy);
      const finalBoundaryPolicy = JSON.parse(boundaryPolicy);

      const serviceData = {
        service: normalizedService,
        description: description.trim(),
        duration: Number(duration),
        awsServices,
        permissionSetName,
        policyName,
        boundaryName,
        inlinePolicy: finalInlinePolicy,
        boundaryPolicy: finalBoundaryPolicy,
        icon,
      };

      console.log("Sending service data:", serviceData);

      const result = await createService(serviceData);
      console.log("Response from Admin Lambda:", result);

      if (!result || !result.success) {
        throw new Error(
          result?.message || "Service creation failed."
        );
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to create service:", error);
      setFailedMessage(error.message || "Failed to create service.");
      setShowFailedModal(true);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="service-page">
        {/* BACKDROP FOR ZOOM MODAL */}
        {zoomedEditor && (
          <div
            className="zoom-backdrop"
            onClick={() => setZoomedEditor(null)}
          />
        )}

        {/* HEADER */}
        <div className="service-header">
          <button
            type="button"
            className="service-back-btn"
            onClick={() => setCurrentPage("labcatalog")}
          >
            ← Back to Catalog
          </button>

          <h1>Add New Service</h1>
          <p>Create service config with permissions and policies</p>
        </div>

        <div className="service-layout">

          {/* TOP ROW */}
          <div className="service-top-row">

            {/* LEFT - BASIC INFO */}
            <div className="service-card">

              <div className="section-header">
                <div className="section-number">1</div>
                <div>
                  <h3>Basic Information</h3>
                  <p>Provide basic details about the service.</p>
                </div>
              </div>

              <div className="service-grid">
                <div>
                  <label>
                    Service Name <span className="required">*</span>
                  </label>
                  <input
                    className={`service-input ${fieldErrors.serviceName ? "input-error" : ""}`}
                    value={serviceName}
                    onChange={(e) => {
                      setServiceName(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        serviceName: "",
                      }));
                    }}
                    placeholder="dynamodb"
                  />
                  {fieldErrors.serviceName && (
                    <div className="field-error">
                      {fieldErrors.serviceName}
                    </div>
                  )}
                </div>

                <div>
                  <label>
                    Duration (minutes) <span className="required">*</span>
                  </label>
                  <input
                    className={`service-input ${fieldErrors.duration ? "input-error" : ""}`}
                    type="number"
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        duration: "",
                      }));
                    }}
                  />
                  {fieldErrors.duration && (
                    <div className="field-error">
                      {fieldErrors.duration}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label>
                  Description <span className="required">*</span>
                </label>
                <textarea
                  className={`service-textarea-small ${fieldErrors.description ? "input-error" : ""}`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      description: "",
                    }));
                  }}
                  placeholder="Short description"
                />
                {fieldErrors.description && (
                  <div className="field-error">
                    {fieldErrors.description}
                  </div>
                )}
              </div>

              {/* ICON UPLOAD */}
              <div className="service-icon-section">
                <label>
                  Service Icon <span className="required">*</span>
                </label>

                <div className="service-icon-wrapper">
                  <label
                    className={`service-upload-box ${fieldErrors.icon || iconError ? "error" : ""
                      }`}
                  >
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={(e) => {
                        handleFileUpload(e.target.files[0]);
                        if (e.target.files[0]) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            icon: "",
                          }));
                        }
                      }}
                    />

                    {!iconPreview ? (
                      <div className="upload-content">
                        <div className="upload-icon">↥</div>
                        <div className="upload-text">
                          Click to upload or drag and drop
                        </div>
                        <div className="upload-subtext">
                          PNG, JPG or SVG (Max 50KB)
                        </div>
                      </div>
                    ) : (
                      <img
                        src={iconPreview}
                        alt="preview"
                        className="service-icon-preview"
                      />
                    )}
                  </label>

                  {iconPreview && (
                    <button
                      type="button"
                      className="service-remove-btn"
                      onClick={() => {
                        setIconFile(null);
                        setIconPreview(null);
                        setIconError("");
                        setFieldErrors((prev) => ({
                          ...prev,
                          icon: "Service Icon is required.",
                        }));
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {iconError && (
                  <div className="field-error">
                    {iconError}
                  </div>
                )}

                {!iconError && fieldErrors.icon && (
                  <div className="field-error">
                    {fieldErrors.icon}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT - PREVIEW CARD */}
            <div className={`preview-card ${zoomedEditor === "preview" ? "zoomed" : ""}`}>
              <div className="preview-header">
                <h3>Service JSON</h3>

                <button
                  type="button"
                  className="service-zoom-btn"
                  title="Toggle Fullscreen"
                  onClick={() =>
                    setZoomedEditor(zoomedEditor === "preview" ? null : "preview")
                  }
                >
                  ⤢
                </button>
              </div>

              <div className="preview-body">
                <div className="code-editor dark">
                  <div className="line-numbers preview-lines" ref={previewLinesRef}>
                    {renderPreviewLineNumbers()}
                  </div>

                  <pre
                    className="preview-json"
                    ref={previewTextRef}
                    onScroll={handlePreviewScroll}
                  >
                    {previewJSON}
                  </pre>
                </div>
              </div>
            </div>

          </div>

          {/* PERMISSION CONFIGURATION */}
          <div className="service-card">
            <div className="section-header">
              <div className="section-number">2</div>
              <div>
                <h3>Permission Configuration</h3>
                <p>Configure permission set, AWS services and IAM policies.</p>
              </div>
            </div>

            {/* PERMISSION SET NAME & AWS SERVICES GRID */}
            <div className="service-grid">

              {/* PERMISSION SET */}
              <div className="service-form-group">
                <label>
                  Permission Set Name <span className="required">*</span>
                </label>

                <input
                  className="service-input service-input-readonly"
                  value={permissionSetName || "dynamodb-Basic-PermissionSet"}
                  readOnly
                />

                <span className="service-help-text">
                  This will be used to create the permission set.
                </span>
              </div>

              {/* AWS SERVICES */}
              <div className="service-form-group add-lab-services-field" style={{ position: "relative" }}>
                <label>
                  AWS Services <span className="required">*</span>
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
                            e.preventDefault();
                          }}
                          onClick={() => {
                            if (!awsServices.includes(svc.name)) {
                              setAwsServices((prev) => [...prev, svc.name]);

                              setFieldErrors((prev) => ({
                                ...prev,
                                awsServices: "",
                              }));
                            }

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
                  {awsServices.length}{" "}
                  {awsServices.length === 1 ? "service" : "services"} added
                </div>

                {fieldErrors.awsServices && (
                  <div className="add-lab-validation-error">
                    {fieldErrors.awsServices}
                  </div>
                )}
              </div>

            </div>

            {/* IAM POLICY EDITORS SIDE-BY-SIDE */}
            <div className="policy-grid">

              {/* INLINE PERMISSION POLICY */}
              <div>
                <JsonCodeEditor
                  title={
                    <>
                      Permission Policy (JSON)
                      <span className="editor-info">ℹ</span>
                    </>
                  }
                  value={inlinePolicy}
                  onChange={(value) => {
                    setInlinePolicy(value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      inlinePolicy: "",
                    }));
                  }}
                  required
                  minLines={25}
                  isZoomed={zoomedEditor === "inline"}
                  onZoom={() =>
                    setZoomedEditor(
                      zoomedEditor === "inline" ? null : "inline"
                    )
                  }
                  fieldError={fieldErrors.inlinePolicy}
                />
              </div>

              {/* PERMISSIONS BOUNDARY POLICY */}
              <div>
                <JsonCodeEditor
                  title={
                    <>
                      Permissions Boundary Policy (JSON)
                      <span className="editor-info">ℹ</span>
                    </>
                  }
                  value={boundaryPolicy}
                  onChange={(value) => {
                    setBoundaryPolicy(value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      boundaryPolicy: "",
                    }));
                  }}
                  required
                  minLines={25}
                  isZoomed={zoomedEditor === "boundary"}
                  onZoom={() =>
                    setZoomedEditor(
                      zoomedEditor === "boundary" ? null : "boundary"
                    )
                  }
                  fieldError={fieldErrors.boundaryPolicy}
                />
              </div>

            </div>

          </div>

          {/* CREATE SERVICE */}
          <button
            type="button"
            className="service-create-btn"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? "Creating Service..." : "Create Service"}
          </button>

        </div>
      </div>

      {showSuccessModal && (
        <CustomAlertModal
          icon="/assets/icons/DB-Success.png"
          title="Service Created Successfully!"
          message={`Your AWS service "${normalizedService}" has been added successfully to the Lab Catalog.`}
          buttonText="←  Back to Catalog"
          onButtonClick={() => {
            setShowSuccessModal(false);
            setCurrentPage("labcatalog");
          }}
        />
      )}

      {showFailedModal && (
        <CustomAlertModal
          icon="/assets/icons/Failed.png"
          title="Service Creation Failed"
          message={failedMessage}
          buttonText="←  Back to Catalog"
          onButtonClick={() => {
            setShowFailedModal(false);
            setCurrentPage("labcatalog");
          }}
        />
      )}
    </>
  );
}