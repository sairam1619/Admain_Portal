function EditLabPage({ setCurrentPage, selectedService, selectedLab }) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [highestStepReached, setHighestStepReached] = React.useState(1);
  const [loadingLab, setLoadingLab] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [updatingLab, setUpdatingLab] = React.useState(false);

  const [originalSectionImages, setOriginalSectionImages] = React.useState([]);
  const [originalIssueImages, setOriginalIssueImages] = React.useState([]);

  const totalSteps = 4;

  // =========================================
  // STEP 1 STATES
  // =========================================
  const [labName, setLabName] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [overview, setOverview] = React.useState("");
  const [learningObjectives, setLearningObjectives] = React.useState([]);
  const [awsServices, setAwsServices] = React.useState([]);
  const [serviceInput, setServiceInput] = React.useState("");
  const [documentationUrl, setDocumentationUrl] = React.useState("");
  const [labSetupErrors, setLabSetupErrors] = React.useState({});

  // =========================================
  // STEP 2 & 3 STATES
  // =========================================
  const [openCodeSnippets, setOpenCodeSnippets] = React.useState({});
  const [issueCounter, setIssueCounter] = React.useState(1);
  const [sectionValidationErrors, setSectionValidationErrors] = React.useState({});
  const [issueValidationErrors, setIssueValidationErrors] = React.useState({});
  const [showServiceDropdown, setShowServiceDropdown] = React.useState(false);

  const [sections, setSections] = React.useState([]);
  const [issues, setIssues] = React.useState([]);

  // =========================================
  // MODAL STATES
  // =========================================
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showFailedModal, setShowFailedModal] = React.useState(false);
  const [failedMessage, setFailedMessage] = React.useState("");

  // =========================================
  // COMPUTED VALUES
  // =========================================
  const serviceCategory =
    typeof selectedService === "object" && selectedService !== null
      ? (selectedService.title || selectedService.service || "").replace(/\s+Deep Dive\s*$/i, "")
      : (selectedService || "").replace(/\s+Deep Dive\s*$/i, "");

  const serviceName = serviceCategory;

  const countLines = (str) =>
    str ? str.split("\n").filter((l) => l.trim().length > 0).length : 0;

  const missingCount = React.useMemo(() => {
    let count = 0;
    if (!labName.trim()) count++;
    if (!subtitle.trim()) count++;
    if (!overview.trim()) count++;
    if (!learningObjectives.some((o) => o.trim())) count++;
    if (!awsServices.length) count++;
    if (!documentationUrl.trim()) count++;
    return count;
  }, [labName, subtitle, overview, learningObjectives, awsServices, documentationUrl]);

  // =========================================
  // LOAD LAB DETAILS
  // =========================================
  React.useEffect(() => {
    if (!selectedService || !selectedLab) return;
    loadLabDetails();
  }, [selectedService, selectedLab]);

  const loadLabDetails = async () => {
    try {
      setLoadingLab(true);
      setLoadError("");
      const data = await fetchLab(serviceCategory, selectedLab.name);
      populateLabData(data);
    } catch (error) {
      console.error("Failed to load lab:", error);
      setLoadError("Failed to load lab details.");
    } finally {
      setLoadingLab(false);
    }
  };

  // =========================================
  // POPULATE LAB DATA
  // =========================================
  const populateLabData = (data) => {
    const lab = data?.lab || data;
    if (!lab) throw new Error("Lab data not found.");

    setLabName(lab.name || "");
    setSubtitle(lab.subtitle || "");
    setOverview(lab.overview || lab.description || "");
    setLearningObjectives(Array.isArray(lab.objectives) ? lab.objectives : []);
    setAwsServices(Array.isArray(lab.services) ? lab.services : []);
    setDocumentationUrl(lab.documentationUrl || "");

    const loadedSections = (lab.sections || []).map((section, sectionIndex) => ({
      id: section.id || sectionIndex + 1,
      title: section.title || "",
      objective: section.objective || "",
      outcome: section.outcome || "",
      tasks: Array.isArray(section.tasks) ? section.tasks : ["", "", "", ""],
      description: section.description || "",
      tip: {
        title: section.tip?.title || "",
        points: Array.isArray(section.tip?.points) ? section.tip.points : []
      },
      expanded: section.expanded !== false,
      steps: (section.steps || []).map((step, stepIndex) => ({
        id: step.id || stepIndex + 1,
        title: step.title || "",
        instructions: Array.isArray(step.instructions)
          ? step.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join("\n")
          : step.instructions || "",
        images: Array.isArray(step.images) ? step.images : [],
        codeSnippets:
          Array.isArray(step.codeSnippets) && step.codeSnippets.length
            ? step.codeSnippets
            : [{ code: "" }],
        expanded: step.expanded !== false
      }))
    }));

    setOriginalSectionImages(
      loadedSections.flatMap((section, sectionIndex) =>
        (section.steps || []).flatMap((step, stepIndex) =>
          (step.images || []).map((image) => ({
            sectionIndex,
            stepIndex,
            id: image.id,
            fileName: image.fileName,
            caption: image.caption || ""
          }))
        )
      )
    );

    const loadedIssues = (lab.issues || []).map((issue, issueIndex) => ({
      id: issue.id || issueIndex + 1,
      title: issue.title || "",
      summary: issue.summary || "",
      why: Array.isArray(issue.why)
        ? issue.why.map((p, idx) => `${idx + 1}. ${p}`).join("\n")
        : issue.why || "",
      fix: Array.isArray(issue.fix)
        ? issue.fix.map((p, idx) => `${idx + 1}. ${p}`).join("\n")
        : issue.fix || "",
      images: Array.isArray(issue.images) ? issue.images : [],
      tip: issue.tip || "",
      isExpanded: issue.isExpanded !== false
    }));

    setOriginalIssueImages(
      loadedIssues.flatMap((issue, issueIndex) =>
        (issue.images || []).map((image) => ({
          issueIndex,
          id: image.id,
          fileName: image.fileName,
          caption: image.caption || ""
        }))
      )
    );

    setSections(loadedSections);
    setIssues(loadedIssues);
    setIssueCounter(loadedIssues.length || 1);
  };

  // =========================================
  // STEP 1 HANDLERS
  // =========================================
  const addObjective = () => {
    setLearningObjectives((prev) => [...prev, ""]);
  };

  const updateObjective = (index, value) => {
    setLearningObjectives((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const removeObjective = (index) => {
    setLearningObjectives((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleObjectiveChange = (index, value, event) => {
    const textarea = event.target;
    updateObjective(index, value);
    requestAnimationFrame(() => {
      textarea.style.height = "40px";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 82)}px`;
    });
  };

  const addAwsService = () => {
    const service = serviceInput.trim();
    if (!service) return;

    if (!awsServices.includes(service)) {
      setAwsServices((prev) => [...prev, service]);
      setLabSetupErrors((prev) => ({
        ...prev,
        awsServices: ""
      }));
    }
    setServiceInput("");
  };

  const removeAwsService = (service) => {
    setAwsServices((prev) => prev.filter((item) => item !== service));
  };

  // =========================================
  // STEP 2 SECTION & TASK HANDLERS
  // =========================================
  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        objective: "",
        outcome: "",
        tasks: ["", "", "", ""],
        description: "",
        tip: { title: "", points: [] },
        steps: [
          {
            id: crypto.randomUUID(),
            title: "",
            instructions: "",
            images: [],
            codeSnippets: [{ code: "" }],
            expanded: true
          }
        ],
        expanded: true
      }
    ]);
  };

  const updateSection = (sIdx, field, value) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === sIdx ? { ...sec, [field]: value } : sec))
    );
  };

  const removeSection = (sIdx) => {
    setSections((prev) => prev.filter((_, idx) => idx !== sIdx));
  };

  const toggleSection = (sIdx) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === sIdx ? { ...sec, expanded: !sec.expanded } : sec))
    );
  };

  const addTask = (sIdx) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx ? { ...sec, tasks: [...sec.tasks, ""] } : sec
      )
    );
  };

  const updateTask = (sIdx, tIdx, value) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            tasks: sec.tasks.map((task, i) => (i === tIdx ? value : task))
          }
          : sec
      )
    );
  };

  const removeTask = (sIdx, tIdx) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            tasks: sec.tasks.filter((_, i) => i !== tIdx)
          }
          : sec
      )
    );
  };

  // =========================================
  // STEP 2 GUIDE STEP HANDLERS
  // =========================================
  const addGuideStep = (sIdx) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            steps: [
              ...sec.steps,
              {
                id: crypto.randomUUID(),
                title: "",
                instructions: "",
                images: [],
                codeSnippets: [{ code: "" }],
                expanded: true
              }
            ]
          }
          : sec
      )
    );
  };

  const updateGuideStep = (sIdx, stIdx, field, value) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            steps: sec.steps.map((step, i) =>
              i === stIdx ? { ...step, [field]: value } : step
            )
          }
          : sec
      )
    );
  };

  const removeGuideStep = (sIdx, stIdx) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            steps: sec.steps.filter((_, i) => i !== stIdx)
          }
          : sec
      )
    );
  };

  const toggleGuideStep = (sIdx, stIdx) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            steps: sec.steps.map((step, i) =>
              i === stIdx ? { ...step, expanded: !step.expanded } : step
            )
          }
          : sec
      )
    );
  };

  // =========================================
  // CODE SNIPPET HANDLERS
  // =========================================
  const getCodeSnippetKey = (sIdx, stIdx, cIdx) => `${sIdx}-${stIdx}-${cIdx}`;

  const toggleCodeSnippet = (sIdx, stIdx, cIdx) => {
    const key = getCodeSnippetKey(sIdx, stIdx, cIdx);
    setOpenCodeSnippets((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addCodeSnippet = (sIdx, stIdx) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            steps: sec.steps.map((step, i) =>
              i === stIdx
                ? {
                  ...step,
                  codeSnippets: [...(step.codeSnippets || []), { code: "" }]
                }
                : step
            )
          }
          : sec
      )
    );

    const newIdx = sections[sIdx]?.steps[stIdx]?.codeSnippets?.length || 0;
    setOpenCodeSnippets((prev) => ({
      ...prev,
      [getCodeSnippetKey(sIdx, stIdx, newIdx)]: true
    }));
  };

  const updateCodeSnippet = (sIdx, stIdx, cIdx, field, value) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            steps: sec.steps.map((step, i) =>
              i === stIdx
                ? {
                  ...step,
                  codeSnippets: (step.codeSnippets || []).map((snip, ci) =>
                    ci === cIdx ? { ...snip, [field]: value } : snip
                  )
                }
                : step
            )
          }
          : sec
      )
    );
  };

  const formatCode = (code) => {
    if (!code || !code.trim()) return "";
    try {
      return JSON.stringify(JSON.parse(code.trim()), null, 2);
    } catch {
      return code;
    }
  };

  const removeCodeSnippet = (sIdx, stIdx, cIdx) => {
    const removedKey = getCodeSnippetKey(sIdx, stIdx, cIdx);
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
            ...sec,
            steps: sec.steps.map((step, i) =>
              i === stIdx
                ? {
                  ...step,
                  codeSnippets: (step.codeSnippets || []).filter((_, ci) => ci !== cIdx)
                }
                : step
            )
          }
          : sec
      )
    );

    setOpenCodeSnippets((prev) => {
      const updated = { ...prev };
      delete updated[removedKey];
      return updated;
    });
  };

  // =========================================
  // STEP 2 IMAGE HANDLERS
  // =========================================
  const addStepImages = (sectionIndex, stepIndex, event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const processedImages = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      fileName: file.name,
      contentType: file.type,
      previewUrl: URL.createObjectURL(file),
      caption: ""
    }));

    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex
          ? {
            ...sec,
            steps: sec.steps.map((step, si) =>
              si === stepIndex
                ? {
                  ...step,
                  images: [...(step.images || []), ...processedImages]
                }
                : step
            )
          }
          : sec
      )
    );

    event.target.value = null;
  };

  const removeStepImage = (sectionIndex, stepIndex, imageIndex) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex
          ? {
            ...sec,
            steps: sec.steps.map((step, si) =>
              si === stepIndex
                ? {
                  ...step,
                  images: (step.images || []).filter((_, ii) => ii !== imageIndex)
                }
                : step
            )
          }
          : sec
      )
    );
  };

  const replaceStepImage = (sectionIndex, stepIndex, imageIndex, newFile) => {
    if (!newFile) return;

    setSections((prev) =>
      prev.map((sec, idx) => {
        if (idx !== sectionIndex) return sec;

        return {
          ...sec,
          steps: sec.steps.map((step, si) => {
            if (si !== stepIndex) return step;

            const images = [...(step.images || [])];
            const oldImage = images[imageIndex];

            if (!oldImage) return step;
            if (oldImage.previewUrl) URL.revokeObjectURL(oldImage.previewUrl);

            images[imageIndex] = {
              ...oldImage,
              file: newFile,
              fileName: newFile.name,
              contentType: newFile.type,
              previewUrl: URL.createObjectURL(newFile)
            };

            return { ...step, images };
          })
        };
      })
    );
  };

  const updateStepImageCaption = (sectionIndex, stepIndex, imageIndex, value) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex
          ? {
            ...sec,
            steps: sec.steps.map((step, si) =>
              si === stepIndex
                ? {
                  ...step,
                  images: (step.images || []).map((img, ii) =>
                    ii === imageIndex ? { ...img, caption: value } : img
                  )
                }
                : step
            )
          }
          : sec
      )
    );
  };

  // =========================================
  // STEP 3: ISSUES HANDLERS
  // =========================================
  const createNewIssue = () => {
    const newId = issueCounter + 1;
    setIssueCounter(newId);
    return {
      id: newId,
      title: "",
      summary: "",
      why: "",
      fix: "",
      images: [],
      tip: "",
      isExpanded: true
    };
  };

  const addIssue = () => {
    setIssues((prev) => [
      ...prev.map((i) => ({ ...i, isExpanded: false })),
      createNewIssue()
    ]);
  };

  const deleteIssue = (id) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const updateIssue = (id, field, value) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const toggleAccordion = (id) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isExpanded: !i.isExpanded } : i))
    );
  };

  const removeImage = (issueId, fileName) => {
    setIssues((prev) =>
      prev.map((iss) =>
        iss.id === issueId
          ? {
            ...iss,
            images: (iss.images || []).filter((img) => img.fileName !== fileName)
          }
          : iss
      )
    );
  };

  const replaceImage = (issueId, imageIndex, newFile) => {
    if (!newFile) return;

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id !== issueId) return iss;

        const images = [...(iss.images || [])];
        const oldImage = images[imageIndex];

        if (!oldImage) return iss;
        if (oldImage.previewUrl) URL.revokeObjectURL(oldImage.previewUrl);

        images[imageIndex] = {
          ...oldImage,
          file: newFile,
          fileName: newFile.name,
          contentType: newFile.type,
          previewUrl: URL.createObjectURL(newFile)
        };

        return { ...iss, images };
      })
    );
  };

  const updateImageCaption = (issueId, imageId, caption) => {
    setIssues((prev) =>
      prev.map((iss) =>
        iss.id === issueId
          ? {
            ...iss,
            images: (iss.images || []).map((img) =>
              img.id === imageId ? { ...img, caption } : img
            )
          }
          : iss
      )
    );
  };

  const autoResizeTextarea = (el) => {
    requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
  };

  // =========================================
  // VALIDATIONS
  // =========================================
  const validateLabSetup = () => {
    const errors = {};

    if (!labName.trim()) errors.labName = "Lab name is required.";
    if (!subtitle.trim()) errors.subtitle = "Subtitle is required.";
    if (!overview.trim()) errors.overview = "Overview is required.";
    if (!learningObjectives.some((obj) => obj.trim())) {
      errors.learningObjectives = "At least one learning objective is required.";
    }
    if (!awsServices.length) errors.awsServices = "At least one AWS service is required.";

    if (!documentationUrl.trim()) {
      errors.documentationUrl = "Documentation URL is required.";
    } else {
      try {
        new URL(documentationUrl);
      } catch {
        errors.documentationUrl = "Please enter a valid documentation URL.";
      }
    }

    setLabSetupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSections = () => {
    const errors = {};
    let isValid = true;

    sections.forEach((section, sIdx) => {
      const secErrors = {};
      if (!section.title?.trim()) { secErrors.title = "Section title is required."; isValid = false; }
      if (!section.objective?.trim()) { secErrors.objective = "Objective is required."; isValid = false; }
      if (!section.outcome?.trim()) { secErrors.outcome = "Outcome is required."; isValid = false; }
      if (!section.description?.trim()) { secErrors.description = "Description is required."; isValid = false; }

      if (!(section.tasks || []).some((t) => t.trim())) {
        secErrors.tasks = "At least one task is required.";
        isValid = false;
      }

      const hasTipTitle = section.tip?.title?.trim();
      const hasTipPoints = (section.tip?.points || []).some((p) => p.trim());

      if (hasTipTitle && !hasTipPoints) {
        secErrors.tip = "Please enter the Tip points.";
        isValid = false;
      }
      if (hasTipPoints && !hasTipTitle) {
        secErrors.tipTitle = "Please enter the Tip Title.";
        isValid = false;
      }

      if (Object.keys(secErrors).length > 0) errors[`sec-${sIdx}`] = secErrors;

      (section.steps || []).forEach((step, stIdx) => {
        const stepErrors = {};
        if (!step.title?.trim()) { stepErrors.title = "Step title is required."; isValid = false; }
        if (!step.instructions?.trim()) { stepErrors.instructions = "Instructions are required."; isValid = false; }
        if ((step.images || []).some((img) => !img.caption?.trim())) {
          stepErrors.image = "Please add a caption for every image.";
          isValid = false;
        }

        if (Object.keys(stepErrors).length > 0) errors[`${sIdx}-${stIdx}`] = stepErrors;
      });
    });

    setSectionValidationErrors(errors);
    return isValid;
  };

  const validateIssues = () => {
    const errors = {};
    let isValid = true;

    issues.forEach((issue) => {
      const issueErrors = {};
      if (!issue.title?.trim()) { issueErrors.title = "Issue title is required."; isValid = false; }
      if (!issue.summary?.trim()) { issueErrors.summary = "Summary is required."; isValid = false; }
      if (!issue.why?.trim()) { issueErrors.why = "Reason is required."; isValid = false; }
      if (!issue.fix?.trim()) { issueErrors.fix = "Fix instructions are required."; isValid = false; }
      if ((issue.images || []).some((img) => !img.caption?.trim())) {
        issueErrors.image = "Please add a caption for every image.";
        isValid = false;
      }

      if (Object.keys(issueErrors).length > 0) errors[issue.id] = issueErrors;
    });

    setIssueValidationErrors(errors);
    return isValid;
  };

  // =========================================
  // NAVIGATION
  // =========================================
  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return;

    if (targetStep > currentStep) {
      if (currentStep <= 1 && targetStep > 1 && !validateLabSetup()) {
        setCurrentStep(1);
        return;
      }
      if (currentStep <= 2 && targetStep > 2 && !validateSections()) {
        setCurrentStep(2);
        return;
      }
      if (currentStep <= 3 && targetStep > 3 && !validateIssues()) {
        setCurrentStep(3);
        return;
      }
      setCurrentStep(targetStep);
      setHighestStepReached((prev) => Math.max(prev, targetStep));
    } else {
      setCurrentStep(targetStep);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateLabSetup()) return;
    if (currentStep === 2 && !validateSections()) return;
    if (currentStep === 3 && !validateIssues()) return;

    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setHighestStepReached((prev) => Math.max(prev, nextStep));
    }
  };

  // =========================================
  // SAVE / UPDATE LAB
  // =========================================
  const handleUpdateLab = async () => {
    try {
      setUpdatingLab(true);

      const modifiedImageSections = [];
      const modifiedImageIssues = [];
      const addedSectionImages = [];
      const deletedSectionImages = [];
      const replacedSectionImages = [];
      const unchangedSectionImages = [];
      const addedIssueImages = [];
      const deletedIssueImages = [];
      const replacedIssueImages = [];
      const unchangedIssueImages = [];

      // Sections Image Processing
      sections.forEach((section, sectionIndex) => {
        const sectionNumber = sectionIndex + 1;
        const originalImages = originalSectionImages.filter(
          (img) => Number(img.sectionIndex) === sectionIndex
        );
        const currentImages = [];

        (section.steps || []).forEach((step, stepIndex) => {
          (step.images || []).forEach((image, imageIndex) => {
            currentImages.push({ image, stepIndex, imageIndex });
          });
        });

        let hasImageChange = false;

        currentImages.forEach(({ image, stepIndex }) => {
          const originalImage = originalImages.find(
            (orig) => String(orig.id) === String(image.id)
          );

          if (image.file && !originalImage) {
            addedSectionImages.push({
              section: sectionNumber,
              step: stepIndex + 1,
              image
            });
            hasImageChange = true;
          } else if (originalImage && image.file) {
            replacedSectionImages.push({
              section: sectionNumber,
              step: stepIndex + 1,
              id: image.id,
              oldFileName: originalImage.fileName,
              image
            });
            hasImageChange = true;
          } else if (originalImage && !image.file) {
            unchangedSectionImages.push({
              section: sectionNumber,
              step: stepIndex + 1,
              id: image.id,
              fileName: image.fileName
            });
          }
        });

        originalImages.forEach((originalImage) => {
          const stillExists = currentImages.some(
            ({ image }) => String(image.id) === String(originalImage.id)
          );

          if (!stillExists) {
            deletedSectionImages.push({
              section: sectionNumber,
              fileName: originalImage.fileName,
              id: originalImage.id
            });
            hasImageChange = true;
          }
        });

        if (hasImageChange) modifiedImageSections.push(sectionNumber);
      });

      // Issues Image Processing
      issues.forEach((issue, issueIndex) => {
        const issueNumber = issueIndex + 1;
        const originalImages = originalIssueImages.filter(
          (img) => Number(img.issueIndex) === issueIndex
        );
        const currentImages = issue.images || [];
        let hasImageChange = false;

        currentImages.forEach((image, imageIndex) => {
          const originalImage = originalImages.find(
            (orig) => String(orig.id) === String(image.id)
          );

          if (originalImage && image.file) {
            replacedIssueImages.push({
              issue: issueNumber,
              position: imageIndex + 1,
              id: image.id,
              oldFileName: originalImage.fileName,
              image
            });
            hasImageChange = true;
          } else if (originalImage && !image.file) {
            unchangedIssueImages.push({
              issue: issueNumber,
              position: imageIndex + 1,
              id: image.id,
              fileName: image.fileName
            });
          } else if (!originalImage && image.file) {
            addedIssueImages.push({
              issue: issueNumber,
              position: imageIndex + 1,
              image
            });
            hasImageChange = true;
          }
        });

        originalImages.forEach((originalImage) => {
          const stillExists = currentImages.some(
            (image) => String(image.id) === String(originalImage.id)
          );

          if (!stillExists) {
            const originalPosition =
              originalImages.findIndex(
                (img) => String(img.id) === String(originalImage.id)
              ) + 1;

            deletedIssueImages.push({
              issue: issueNumber,
              id: originalImage.id,
              fileName: originalImage.fileName,
              position: originalPosition
            });
            hasImageChange = true;
          }
        });

        if (hasImageChange) modifiedImageIssues.push(issueNumber);
      });

      const labData = {
        name: labName,
        subtitle,
        overview,
        objectives: learningObjectives,
        services: awsServices,
        documentationUrl,

        sections: sections.map((section, sectionIndex) => {
          const sectionNumber = sectionIndex + 1;
          const isModified = modifiedImageSections.includes(sectionNumber);
          let pictureNumber = 1;

          return {
            id: sectionNumber,
            title: section.title,
            objective: section.objective,
            outcome: section.outcome,
            tasks: section.tasks,
            description: section.description,
            tipTitle: section.tip?.title || "",
            tip: section.tip?.points || [],
            steps: (section.steps || []).map((step, stepIndex) => ({
              id: stepIndex + 1,
              title: step.title,
              instructions: step.instructions,
              images: (step.images || []).map((image) => {
                if (!isModified) {
                  const replacementInfo = replacedSectionImages.find(
                    (rep) =>
                      rep.section === sectionNumber &&
                      String(rep.id) === String(image.id)
                  );

                  if (replacementInfo) {
                    const originalFileName =
                      replacementInfo.oldFileName || image.fileName || "";
                    const baseName = originalFileName.replace(/\.[^/.]+$/, "");
                    const newExt = image.file?.name?.includes(".")
                      ? image.file.name.split(".").pop().toLowerCase()
                      : originalFileName.split(".").pop().toLowerCase();

                    return {
                      ...image,
                      id: image.id,
                      fileName: `${baseName}.${newExt}`,
                      contentType: image.file?.type || image.contentType,
                      caption: image.caption || ""
                    };
                  }

                  return {
                    ...image,
                    id: image.id,
                    fileName: image.fileName,
                    contentType: image.contentType,
                    caption: image.caption || ""
                  };
                }

                const rawFileName = image.file?.name || image.fileName || "";
                const extension = rawFileName.includes(".")
                  ? rawFileName.split(".").pop().toLowerCase()
                  : "png";

                const newFileName = `sec_${sectionNumber}_pic_${pictureNumber}.${extension}`;
                pictureNumber++;

                return {
                  ...image,
                  id: image.id || null,
                  fileName: newFileName,
                  contentType: image.file ? image.file.type : image.contentType,
                  caption: image.caption || ""
                };
              }),
              codeSnippets: step.codeSnippets
            }))
          };
        }),

        issues: issues.map((issue, issueIndex) => {
          const issueNumber = issueIndex + 1;
          const isModified = modifiedImageIssues.includes(issueNumber);
          let pictureNumber = 1;

          return {
            id: issueNumber,
            title: issue.title,
            summary: issue.summary,
            why: issue.why,
            fix: issue.fix,
            images: (issue.images || []).map((image) => {
              if (!isModified) {
                const replacementInfo = replacedIssueImages.find(
                  (rep) =>
                    rep.issue === issueNumber &&
                    String(rep.id) === String(image.id)
                );

                if (replacementInfo) {
                  const oldFileName =
                    replacementInfo.oldFileName || image.fileName || "";
                  const baseName = oldFileName.replace(/\.[^/.]+$/, "");
                  const newExtension = image.file?.name?.includes(".")
                    ? image.file.name.split(".").pop().toLowerCase()
                    : oldFileName.split(".").pop().toLowerCase();

                  return {
                    ...image,
                    id: image.id,
                    fileName: `${baseName}.${newExtension}`,
                    contentType: image.file?.type || image.contentType || "",
                    caption: image.caption || ""
                  };
                }

                return {
                  ...image,
                  id: image.id,
                  fileName: image.fileName,
                  contentType: image.contentType || image.file?.type || "",
                  caption: image.caption || ""
                };
              }

              const rawFileName = image.file?.name || image.fileName || "";
              const extension = rawFileName.includes(".")
                ? rawFileName.split(".").pop().toLowerCase()
                : "png";

              const newFileName = `issue_${issueNumber}_pic_${pictureNumber}.${extension}`;
              pictureNumber++;

              return {
                ...image,
                id: image.id || null,
                fileName: newFileName,
                contentType: image.file?.type || image.contentType || "",
                caption: image.caption || ""
              };
            }),
            tip: issue.tip
          };
        }),

        modifiedImageSections,
        modifiedImageIssues,
        addedSectionImages,
        deletedSectionImages,
        replacedSectionImages,
        unchangedSectionImages,
        addedIssueImages,
        deletedIssueImages,
        replacedIssueImages,
        unchangedIssueImages
      };

      const result = await updateLab(serviceCategory, labData.name, labData);
      if (!result || !result.success) {
        throw new Error(result?.message || "Lab Updation Failed");
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to update lab:", error);
      setFailedMessage(error.message || "Failed to update the lab.");
      setShowFailedModal(true);
    } finally {
      setUpdatingLab(false);
    }
  };

  return (
    <>
      <div className="add-lab-page">
        <div className="add-lab-top">
          <button
            type="button"
            className="service-back-btn"
            onClick={() => setCurrentPage("labcatalog")}
          >
            ← Back to Catalog
          </button>
        </div>

        <div className="add-lab-title-area">
          <div className="add-lab-title-content">
            <h1>Edit Lab</h1>
            <p>Modify the existing lab content and configuration.</p>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="add-lab-stepper">
          {[
            { s: 1, l: "Lab Setup" },
            { s: 2, l: "Sections" },
            { s: 3, l: "Issues" },
            { s: 4, l: "Review" }
          ].map((st, i) => (
            <React.Fragment key={st.s}>
              {i > 0 && <div className="add-lab-step-line"></div>}
              <div
                className={`add-lab-step-item ${currentStep === st.s ? "active" : ""}`}
                onClick={() => handleStepClick(st.s)}
                style={{ cursor: "pointer" }}
              >
                <div className="add-lab-step-circle">{st.s}</div>
                <div className="add-lab-step-label">{st.l}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* =====================================
            STEP 1: SETUP
        ===================================== */}
        {currentStep === 1 && (
          <section className="add-lab-step-card">
            <div className="add-lab-section-header">
              <div className="add-lab-section-number">1</div>
              <div>
                <h2>Lab Setup</h2>
                <p>Modify the basic information and configuration for the lab.</p>
              </div>
            </div>

            <div className="add-lab-form-content">
              <div className="add-lab-form-section">
                <div className="add-lab-form-section-title">Basic Lab Information</div>

                <div className="add-lab-form-grid">
                  <div className="add-lab-field add-lab-service-category-field">
                    <label>
                      Service Category <span className="required">*</span>
                    </label>
                    <div className="add-lab-readonly-field">{serviceCategory}</div>
                  </div>

                  <div className="add-lab-field add-lab-name-field">
                    <label>
                      Lab Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={labName}
                      readOnly
                      className="add-lab-readonly-field"
                    />
                  </div>
                </div>

                <div className="add-lab-two-column-layout">
                  {/* Left Column */}
                  <div className="add-lab-form-column">
                    <div className="add-lab-field">
                      <label>
                        Subtitle <span className="required">*</span>
                      </label>
                      <textarea
                        value={subtitle}
                        onChange={(e) => {
                          setSubtitle(e.target.value);
                          if (e.target.value.trim()) {
                            setLabSetupErrors((prev) => ({ ...prev, subtitle: "" }));
                          }
                        }}
                        placeholder="Enter a short description of the lab"
                        className="add-lab-subtitle-textarea"
                      />
                      {labSetupErrors.subtitle && (
                        <div className="add-lab-validation-error">
                          {labSetupErrors.subtitle}
                        </div>
                      )}
                    </div>

                    <div className="add-lab-field add-lab-objectives-field">
                      <label>
                        Learning Objectives <span className="required">*</span>
                      </label>

                      <div className="add-lab-objectives-list edit-lab-objectives-list">
                        {learningObjectives.map((objective, index) => (
                          <div className="add-lab-objective-item" key={index}>
                            <span className="add-lab-drag-handle">⋮⋮</span>
                            <textarea
                              value={objective}
                              onChange={(e) => {
                                handleObjectiveChange(index, e.target.value, e);
                                if (e.target.value.trim()) {
                                  setLabSetupErrors((prev) => ({
                                    ...prev,
                                    learningObjectives: ""
                                  }));
                                }
                              }}
                              placeholder="Enter learning objective"
                              className="add-lab-objective-textarea"
                            />
                            {learningObjectives.length > 1 && (
                              <button
                                type="button"
                                className="add-lab-remove-button"
                                onClick={() => removeObjective(index)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {labSetupErrors.learningObjectives && (
                        <div className="add-lab-validation-error">
                          {labSetupErrors.learningObjectives}
                        </div>
                      )}

                      <button
                        type="button"
                        className="add-lab-add-objective-button"
                        onClick={addObjective}
                      >
                        <span>+</span> Add Objective
                      </button>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="add-lab-form-column">
                    <div className="add-lab-field">
                      <label>
                        Overview <span className="required">*</span>
                      </label>
                      <textarea
                        value={overview}
                        onChange={(e) => {
                          setOverview(e.target.value);
                          if (e.target.value.trim()) {
                            setLabSetupErrors((prev) => ({ ...prev, overview: "" }));
                          }
                        }}
                        placeholder="Describe what the learner will accomplish in this lab"
                        rows="5"
                        maxLength="700"
                        className="edit-lab-overview-textarea"
                      />
                      {labSetupErrors.overview && (
                        <div className="add-lab-validation-error">
                          {labSetupErrors.overview}
                        </div>
                      )}
                      <div className="add-lab-character-count">
                        {overview.length}/700
                      </div>
                    </div>

                    <div
                      className="add-lab-field add-lab-services-field"
                      style={{ position: "relative" }}
                    >
                      <label>
                        AWS Services Used <span className="required">*</span>
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
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  if (!awsServices.includes(svc.name)) {
                                    setAwsServices((prev) => [...prev, svc.name]);
                                    setLabSetupErrors((prev) => ({
                                      ...prev,
                                      awsServices: ""
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

                      {labSetupErrors.awsServices && (
                        <div className="add-lab-validation-error">
                          {labSetupErrors.awsServices}
                        </div>
                      )}
                    </div>

                    <div className="add-lab-field add-lab-documentation-field">
                      <label>
                        Documentation URL <span className="required">*</span>
                      </label>
                      <input
                        type="url"
                        value={documentationUrl}
                        onChange={(e) => {
                          setDocumentationUrl(e.target.value);
                          if (e.target.value.trim()) {
                            setLabSetupErrors((prev) => ({
                              ...prev,
                              documentationUrl: ""
                            }));
                          }
                        }}
                        placeholder="https://docs.example.com/..."
                      />
                      {labSetupErrors.documentationUrl && (
                        <div className="add-lab-validation-error">
                          {labSetupErrors.documentationUrl}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================
            STEP 2: SECTIONS
        ===================================== */}
        {currentStep === 2 && (
          <section className="add-lab-step-card add-lab-sections-step">
            <div className="add-lab-section-header">
              <div className="add-lab-section-number">2</div>
              <div>
                <h2>Sections</h2>
                <p>
                  Add sections to organize the lab content. Each section includes a
                  summary and a detailed step-by-step guide.
                </p>
              </div>
            </div>

            <div className="add-lab-sections-container">
              {sections.map((section, sectionIndex) => {
                const sectionOpen = section.expanded !== false;
                const secErrors =
                  sectionValidationErrors[`sec-${sectionIndex}`] || {};

                return (
                  <div
                    className="add-lab-section-card"
                    key={section.id || sectionIndex}
                  >
                    <div
                      className="add-lab-section-card-header"
                      onClick={() => toggleSection(sectionIndex)}
                    >
                      <div className="add-lab-section-card-title">
                        <span className="add-lab-drag-handle">⋮⋮</span>
                        <strong>Section {sectionIndex + 1}</strong>
                      </div>

                      <div className="add-lab-section-card-actions">
                        <button
                          type="button"
                          className="add-lab-delete-text-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(sectionIndex);
                          }}
                        >
                          <i className="bi bi-trash"></i> Delete Section
                        </button>

                        <button
                          type="button"
                          className="add-lab-collapse-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(sectionIndex);
                          }}
                        >
                          {sectionOpen ? "⌃" : "⌄"}
                        </button>
                      </div>
                    </div>

                    {sectionOpen && (
                      <div className="add-lab-section-card-body">
                        {/* Section Summary */}
                        <div className="add-lab-section-summary-wrapper">
                          <div className="add-lab-subsection-heading">
                            <div className="add-lab-subsection-icon">
                              <i className="bi bi-file-earmark-text"></i>
                            </div>
                            <div>
                              <h3>Section Summary</h3>
                              <p>Provide a brief overview of this section.</p>
                            </div>
                          </div>

                          <div className="add-lab-section-summary">
                            <div className="add-lab-section-summary-left">
                              <div className="add-lab-field">
                                <label>
                                  Section Title <span className="required">*</span>
                                </label>
                                <div className="add-lab-input-with-count">
                                  <input
                                    type="text"
                                    value={section.title || ""}
                                    onChange={(e) =>
                                      updateSection(sectionIndex, "title", e.target.value)
                                    }
                                    placeholder="Enter section title"
                                    maxLength={100}
                                  />
                                  <span>{(section.title || "").length}/100</span>
                                </div>
                                {secErrors.title && (
                                  <div className="add-lab-validation-error">
                                    {secErrors.title}
                                  </div>
                                )}
                              </div>

                              <div className="add-lab-field">
                                <label>
                                  Objective <span className="required">*</span>
                                </label>
                                <div className="add-lab-textarea-count">
                                  <textarea
                                    value={section.objective || ""}
                                    onChange={(e) =>
                                      updateSection(
                                        sectionIndex,
                                        "objective",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Describe what the learner will accomplish in this section"
                                    maxLength={250}
                                  />
                                  <span>{(section.objective || "").length}/250</span>
                                </div>
                                {secErrors.objective && (
                                  <div className="add-lab-validation-error">
                                    {secErrors.objective}
                                  </div>
                                )}
                              </div>

                              <div className="add-lab-field">
                                <label>
                                  Outcome <span className="required">*</span>
                                </label>
                                <div className="add-lab-textarea-count">
                                  <textarea
                                    value={section.outcome || ""}
                                    onChange={(e) =>
                                      updateSection(sectionIndex, "outcome", e.target.value)
                                    }
                                    placeholder="Describe the expected result after completing this section"
                                    maxLength={250}
                                  />
                                  <span>{(section.outcome || "").length}/250</span>
                                </div>
                                {secErrors.outcome && (
                                  <div className="add-lab-validation-error">
                                    {secErrors.outcome}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="add-lab-section-summary-right">
                              <div className="add-lab-subsection-heading">
                                <div>
                                  <h3>
                                    Tasks <span className="required">*</span>
                                  </h3>
                                  <p>
                                    Add the key tasks that learners will complete in
                                    this section.
                                  </p>
                                </div>
                              </div>

                              <div className="add-lab-tasks-list">
                                {(section.tasks || []).map((task, taskIndex) => (
                                  <div className="add-lab-task-item" key={taskIndex}>
                                    <div className="add-lab-task-drag-area">
                                      <span className="add-lab-drag-handle">⋮⋮</span>
                                    </div>

                                    <span className="add-lab-task-number">
                                      {taskIndex + 1}.
                                    </span>

                                    <textarea
                                      value={task || ""}
                                      onChange={(e) => {
                                        updateTask(sectionIndex, taskIndex, e.target.value);
                                        const textarea = e.target;
                                        textarea.style.height = "40px";
                                        textarea.style.height = `${Math.min(
                                          textarea.scrollHeight,
                                          72
                                        )}px`;
                                      }}
                                      placeholder="Enter task"
                                      rows="1"
                                    />

                                    {section.tasks.length > 1 && (
                                      <button
                                        type="button"
                                        className="add-lab-task-delete"
                                        onClick={() =>
                                          removeTask(sectionIndex, taskIndex)
                                        }
                                        title="Delete task"
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    )}
                                  </div>
                                ))}

                                {secErrors.tasks && (
                                  <div className="add-lab-validation-error">
                                    {secErrors.tasks}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                className="add-lab-add-task-button"
                                onClick={() => addTask(sectionIndex)}
                              >
                                <span>+</span> Add Task
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Guide */}
                        <div className="add-lab-detailed-guide">
                          <div className="add-lab-subsection-heading">
                            <div className="add-lab-subsection-icon">
                              <i className="bi bi-book"></i>
                            </div>
                            <div>
                              <h3>Detailed Guide</h3>
                              <p>
                                Provide a comprehensive step-by-step guide for this
                                section.
                              </p>
                            </div>
                          </div>

                          <div className="add-lab-field">
                            <label>
                              Description <span className="required">*</span>
                            </label>
                            <div className="add-lab-textarea-count add-lab-guide-description">
                              <textarea
                                maxLength={250}
                                value={section.description || ""}
                                onChange={(e) =>
                                  updateSection(
                                    sectionIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Describe what this section covers"
                              />
                              <span>{(section.description || "").length}/250</span>
                            </div>
                            {secErrors.description && (
                              <div className="add-lab-validation-error">
                                {secErrors.description}
                              </div>
                            )}
                          </div>

                          <div className="add-lab-guide-steps">
                            <div className="add-lab-guide-steps-header">
                              <div>
                                <label>
                                  Steps <span className="required">*</span>
                                </label>
                                <p>
                                  Add detailed, step-by-step instructions with images
                                  and code examples.
                                </p>
                              </div>
                            </div>

                            {(section.steps || []).map((step, stepIndex) => {
                              const stepOpen = step.expanded !== false;
                              const stepErrors =
                                sectionValidationErrors[
                                `${sectionIndex}-${stepIndex}`
                                ] || {};

                              return (
                                <div
                                  className="add-lab-guide-step"
                                  key={step.id || stepIndex}
                                >
                                  <div
                                    className="add-lab-guide-step-header"
                                    onClick={() =>
                                      toggleGuideStep(sectionIndex, stepIndex)
                                    }
                                  >
                                    <div className="add-lab-guide-step-title">
                                      <span className="add-lab-step-number">
                                        {stepIndex + 1}
                                      </span>
                                      <strong>
                                        {step.title || `Step ${stepIndex + 1}`}
                                      </strong>
                                    </div>

                                    <div className="add-lab-guide-step-actions">
                                      <button
                                        type="button"
                                        className="add-lab-step-delete"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeGuideStep(sectionIndex, stepIndex);
                                        }}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                      <span>{stepOpen ? "⌃" : "⌄"}</span>
                                    </div>
                                  </div>

                                  {stepOpen && (
                                    <div className="add-lab-guide-step-body">
                                      <div className="add-lab-field">
                                        <label>
                                          Step Title <span className="required">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={step.title || ""}
                                          onChange={(e) =>
                                            updateGuideStep(
                                              sectionIndex,
                                              stepIndex,
                                              "title",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Enter step title"
                                        />
                                        {stepErrors.title && (
                                          <div className="add-lab-validation-error">
                                            {stepErrors.title}
                                          </div>
                                        )}
                                      </div>

                                      <div className="add-lab-step-two-column">
                                        {/* Instructions */}
                                        <div className="add-lab-field instructions-field">
                                          <label>
                                            Instructions{" "}
                                            <span className="required">*</span>
                                          </label>
                                          <ListEditor
                                            value={step.instructions}
                                            onChange={(value) =>
                                              updateGuideStep(
                                                sectionIndex,
                                                stepIndex,
                                                "instructions",
                                                value
                                              )
                                            }
                                            type="number"
                                            maxLength={2000}
                                            placeholder={
                                              "1. Sign in to the AWS Management Console.\n" +
                                              "2. Open the required service.\n" +
                                              "3. Configure the required settings."
                                            }
                                          />
                                          <div className="add-lab-character-count">
                                            {step.instructions.length}/2000
                                          </div>
                                          {stepErrors.instructions && (
                                            <div className="add-lab-validation-error">
                                              {stepErrors.instructions}
                                            </div>
                                          )}
                                        </div>

                                        {/* Images */}
                                        <div className="add-lab-field">
                                          <label>
                                            Images{" "}
                                            <span className="optional">(Optional)</span>
                                          </label>

                                          <div className="add-lab-images-scroll-area">
                                            <div className="add-lab-images-grid">
                                              {(step.images || []).map((image, imageIndex) => (
                                                <div
                                                  className="add-lab-image-card"
                                                  key={image.id || imageIndex}
                                                >
                                                  <div className="add-lab-issues-image-preview-area">
                                                    <img
                                                      src={image.previewUrl || image.preview}
                                                      alt={
                                                        image.fileName ||
                                                        image.name ||
                                                        `Image ${imageIndex + 1}`
                                                      }
                                                    />

                                                    <div className="edit-lab-image-actions">
                                                      <label
                                                        className="add-lab-issues-btn-replace-img"
                                                        title="Replace Image"
                                                      >
                                                        <span className="edit-lab-replace-image-icon">
                                                          ⇄
                                                        </span>
                                                        <input
                                                          type="file"
                                                          accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                                                          hidden
                                                          onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                              replaceStepImage(
                                                                sectionIndex,
                                                                stepIndex,
                                                                imageIndex,
                                                                file
                                                              );
                                                            }
                                                            e.target.value = null;
                                                          }}
                                                        />
                                                      </label>

                                                      <button
                                                        type="button"
                                                        className="edit-lab-issues-btn-remove-img"
                                                        onClick={() =>
                                                          removeStepImage(
                                                            sectionIndex,
                                                            stepIndex,
                                                            imageIndex
                                                          )
                                                        }
                                                        title="Remove Image"
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  </div>

                                                  <div className="add-lab-image-description-area">
                                                    <input
                                                      type="text"
                                                      className="add-lab-image-description"
                                                      placeholder="Add a caption..."
                                                      value={image.caption || ""}
                                                      onChange={(e) =>
                                                        updateStepImageCaption(
                                                          sectionIndex,
                                                          stepIndex,
                                                          imageIndex,
                                                          e.target.value
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          <label className="add-lab-add-image-button">
                                            <span className="add-lab-add-image-content">
                                              <span className="add-lab-add-image-plus">
                                                +
                                              </span>
                                              <span className="add-lab-add-image-text">
                                                Add Image
                                              </span>
                                            </span>

                                            <input
                                              type="file"
                                              accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                                              multiple
                                              hidden
                                              onChange={(e) =>
                                                addStepImages(sectionIndex, stepIndex, e)
                                              }
                                            />
                                          </label>

                                          {stepErrors.image && (
                                            <div className="add-lab-validation-error">
                                              {stepErrors.image}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* CODE SNIPPETS */}
                                      <div className="add-lab-field">
                                        <label>
                                          Code Snippets{" "}
                                          <span className="optional">(Optional)</span>
                                        </label>

                                        <div className="add-lab-section-code-accordion">
                                          {(step.codeSnippets || []).map((snippet, codeIndex) => {
                                            const codeKey = `${sectionIndex}-${stepIndex}-${codeIndex}`;
                                            const isExpanded = !!openCodeSnippets[codeKey];

                                            return (
                                              <div
                                                className="add-lab-section-code-accordion-item"
                                                key={codeIndex}
                                              >
                                                <div className="add-lab-section-code-accordion-header">
                                                  <div
                                                    className="add-lab-section-code-accordion-title"
                                                    onClick={() =>
                                                      toggleCodeSnippet(
                                                        sectionIndex,
                                                        stepIndex,
                                                        codeIndex
                                                      )
                                                    }
                                                  >
                                                    <span className="add-lab-section-code-accordion-arrow">
                                                      {isExpanded ? "▼" : "▶"}
                                                    </span>
                                                    <span className="add-lab-section-code-accordion-text">
                                                      {`Code Snippet ${codeIndex + 1}`}
                                                    </span>
                                                  </div>

                                                  <button
                                                    type="button"
                                                    className="add-lab-section-code-copy-button"
                                                    onClick={() =>
                                                      navigator.clipboard.writeText(
                                                        snippet.code || ""
                                                      )
                                                    }
                                                  >
                                                    <i className="bi bi-clipboard"></i> Copy
                                                  </button>
                                                </div>

                                                {isExpanded && (
                                                  <div className="add-lab-section-code-content">
                                                    <textarea
                                                      value={snippet.code || ""}
                                                      onChange={(e) =>
                                                        updateCodeSnippet(
                                                          sectionIndex,
                                                          stepIndex,
                                                          codeIndex,
                                                          "code",
                                                          e.target.value
                                                        )
                                                      }
                                                      onPaste={(e) => {
                                                        const pastedText =
                                                          e.clipboardData.getData("text");
                                                        const formattedCode =
                                                          formatCode(pastedText);
                                                        if (formattedCode !== pastedText) {
                                                          e.preventDefault();
                                                          updateCodeSnippet(
                                                            sectionIndex,
                                                            stepIndex,
                                                            codeIndex,
                                                            "code",
                                                            formattedCode
                                                          );
                                                        }
                                                      }}
                                                      onBlur={(e) => {
                                                        const currentCode = e.target.value;
                                                        const formattedCode =
                                                          formatCode(currentCode);
                                                        if (formattedCode !== currentCode) {
                                                          updateCodeSnippet(
                                                            sectionIndex,
                                                            stepIndex,
                                                            codeIndex,
                                                            "code",
                                                            formattedCode
                                                          );
                                                        }
                                                      }}
                                                      placeholder="Enter code snippet"
                                                      spellCheck="false"
                                                      autoCorrect="off"
                                                      autoCapitalize="off"
                                                    />

                                                    {step.codeSnippets.length > 1 && (
                                                      <button
                                                        type="button"
                                                        className="add-lab-section-code-remove-button"
                                                        onClick={() =>
                                                          removeCodeSnippet(
                                                            sectionIndex,
                                                            stepIndex,
                                                            codeIndex
                                                          )
                                                        }
                                                      >
                                                        × Remove Code
                                                      </button>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        <button
                                          type="button"
                                          className="add-lab-add-code-button"
                                          onClick={() =>
                                            addCodeSnippet(sectionIndex, stepIndex)
                                          }
                                        >
                                          + Add Code
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            className="add-lab-add-step-button"
                            onClick={() => addGuideStep(sectionIndex)}
                          >
                            <span>+</span> Add Step
                          </button>

                          {/* SECTION TIP */}
                          <div className="add-lab-tip-section">
                            <div className="add-lab-field">
                              <label>
                                Tip Title <span className="optional">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                maxLength={100}
                                value={section.tip?.title || ""}
                                onChange={(e) =>
                                  updateSection(sectionIndex, "tip", {
                                    ...(section.tip || {}),
                                    title: e.target.value
                                  })
                                }
                                placeholder="Enter tip title"
                              />
                            </div>

                            <div className="add-lab-field">
                              <label>
                                Tip <span className="optional">(Optional)</span>
                              </label>
                              <textarea
                                maxLength={700}
                                value={(section.tip?.points || [])
                                  .map((point) => `• ${point}`)
                                  .join("\n")}
                                onChange={(e) => {
                                  const lines = e.target.value
                                    .split(/\r?\n/)
                                    .map((line) => line.replace(/^\s*•\s*/, "").trim())
                                    .filter(Boolean);
                                  updateSection(sectionIndex, "tip", {
                                    ...(section.tip || {}),
                                    points: lines
                                  });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter") return;
                                  e.preventDefault();

                                  const textarea = e.target;
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const currentValue = textarea.value;
                                  const newValue =
                                    currentValue.substring(0, start) +
                                    "\n• " +
                                    currentValue.substring(end);
                                  const lines = newValue
                                    .split(/\r?\n/)
                                    .map((line) => line.replace(/^\s*•\s*/, "").trim());

                                  updateSection(sectionIndex, "tip", {
                                    ...(section.tip || {}),
                                    points: lines
                                  });

                                  setTimeout(() => {
                                    textarea.selectionStart = start + 3;
                                    textarea.selectionEnd = start + 3;
                                  }, 0);
                                }}
                                placeholder="Add a useful tip or additional information"
                              />
                              <div className="add-lab-character-count">
                                {(section.tip?.points || []).join("\n").length}/700
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="add-lab-add-section-button"
                onClick={addSection}
              >
                <span>+</span>
                <div>
                  <strong>Add Section</strong>
                  <small>Add another section to this lab.</small>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* =====================================
            STEP 3: ISSUES
        ===================================== */}
        {currentStep === 3 && (
          <section className="add-lab-step-card">
            <div className="add-lab-section-header">
              <div className="add-lab-section-number">3</div>
              <div>
                <h2>Issues</h2>
                <p>Add troubleshooting issues and their solutions.</p>
              </div>
            </div>

            <div className="add-lab-form-content">
              <div className="add-lab-issues-list">
                {issues.map((issue, index) => {
                  const issueErrors = issueValidationErrors[issue.id] || {};

                  return (
                    <div
                      key={issue.id}
                      className={`add-lab-issues-card ${issue.isExpanded ? "add-lab-issues-expanded" : ""}`}
                    >
                      <div
                        className="add-lab-issues-card-header"
                        onClick={() => toggleAccordion(issue.id)}
                      >
                        <div className="add-lab-issues-card-title-group">
                          <div className="add-lab-issues-drag-handle">
                            <i className="bi bi-grip-vertical"></i>
                          </div>
                          <span className="add-lab-issues-card-heading">
                            Issue {index + 1}
                            {!issue.isExpanded && issue.title ? `: ${issue.title}` : ""}
                          </span>
                        </div>

                        <div className="add-lab-issues-card-actions">
                          <button
                            type="button"
                            className="add-lab-issues-btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteIssue(issue.id);
                            }}
                            title="Delete Issue"
                          >
                            <i className="bi bi-trash3" style={{ fontSize: "15px" }}></i>
                            {issue.isExpanded && (
                              <span className="add-lab-issues-delete-text">
                                Delete Issue
                              </span>
                            )}
                          </button>
                          <div className="add-lab-issues-chevron">
                            <i className="bi bi-chevron-down"></i>
                          </div>
                        </div>
                      </div>

                      <div className="add-lab-issues-card-body">
                        <div className="add-lab-field">
                          <label>
                            Issue Title <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            className="add-lab-issues-input"
                            placeholder="Enter issue title"
                            value={issue.title}
                            onChange={(e) =>
                              updateIssue(issue.id, "title", e.target.value)
                            }
                          />
                          {issueErrors.title && (
                            <div className="add-lab-validation-error">
                              {issueErrors.title}
                            </div>
                          )}
                        </div>

                        <div className="add-lab-field">
                          <label>
                            Summary <span className="required">*</span>
                          </label>
                          <textarea
                            className="add-lab-issues-textarea"
                            placeholder="Enter issue summary"
                            value={issue.summary}
                            onChange={(e) => {
                              updateIssue(issue.id, "summary", e.target.value);
                              autoResizeTextarea(e.target);
                            }}
                            rows={2}
                          />
                          {issueErrors.summary && (
                            <div className="add-lab-validation-error">
                              {issueErrors.summary}
                            </div>
                          )}
                        </div>

                        <div className="add-lab-field why-field">
                          <label>
                            Why This Happens <span className="required">*</span>
                          </label>
                          <ListEditor
                            value={issue.why || ""}
                            onChange={(value) =>
                              updateIssue(issue.id, "why", value)
                            }
                            type="number"
                            maxLength={2000}
                            className="add-lab-issues-textarea"
                            placeholder="Enter why this happens"
                          />
                          <div className="add-lab-character-count">
                            {(issue.why || "").length}/2000
                          </div>
                          {issueErrors.why && (
                            <div className="add-lab-validation-error">
                              {issueErrors.why}
                            </div>
                          )}
                        </div>

                        <div className="add-lab-field fix-field">
                          <label>
                            How to Fix <span className="required">*</span>
                          </label>
                          <ListEditor
                            value={issue.fix || ""}
                            onChange={(value) =>
                              updateIssue(issue.id, "fix", value)
                            }
                            type="number"
                            maxLength={2000}
                            className="add-lab-issues-textarea"
                            placeholder="Enter the troubleshooting steps"
                          />
                          <div className="add-lab-character-count">
                            {(issue.fix || "").length}/2000
                          </div>
                          {issueErrors.fix && (
                            <div className="add-lab-validation-error">
                              {issueErrors.fix}
                            </div>
                          )}
                        </div>

                        <div className="add-lab-field edit-image">
                          <label>
                            Images <span className="optional">(Optional)</span>
                          </label>

                          <div className="add-lab-issues-images-grid">
                            {(issue.images || []).map((img, imgIdx) => (
                              <div
                                key={img.id || `${img.fileName}-${imgIdx}`}
                                className="add-lab-issues-image-card"
                              >
                                <div className="add-lab-issues-image-preview-area">
                                  <img
                                    src={img.previewUrl}
                                    alt={img.fileName || "Preview"}
                                  />
                                  <div className="add-lab-issues-image-actions">
                                    <label
                                      className="add-lab-issues-btn-replace-img"
                                      title="Replace Image"
                                    >
                                      <span className="replace-image-icon">⇄</span>
                                      <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                                        hidden
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            replaceImage(issue.id, imgIdx, file);
                                          }
                                          e.target.value = null;
                                        }}
                                      />
                                    </label>

                                    <button
                                      type="button"
                                      className="edit-lab-issues-btn-remove-img"
                                      onClick={() =>
                                        removeImage(issue.id, img.fileName)
                                      }
                                      title="Remove Image"
                                    >
                                      <i className="bi bi-x-lg"></i>
                                    </button>
                                  </div>
                                </div>

                                <div className="add-lab-issues-image-caption-area">
                                  <input
                                    type="text"
                                    className="add-lab-issues-caption-input"
                                    placeholder="Add a caption..."
                                    value={img.caption || ""}
                                    onChange={(e) =>
                                      updateImageCaption(
                                        issue.id,
                                        img.id,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            ))}

                            <label className="add-lab-issues-btn-add-image">
                              <i
                                className="bi bi-plus-lg"
                                style={{ fontSize: "24px" }}
                              ></i>
                              <span>Add Image</span>
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                                multiple
                                hidden
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length > 0) {
                                    const newImages = files.map((file) => ({
                                      id: crypto.randomUUID(),
                                      file: file,
                                      fileName: file.name,
                                      contentType: file.type,
                                      previewUrl: URL.createObjectURL(file),
                                      caption: ""
                                    }));
                                    setIssues((prev) =>
                                      prev.map((iss) =>
                                        iss.id === issue.id
                                          ? {
                                            ...iss,
                                            images: [
                                              ...(iss.images || []),
                                              ...newImages
                                            ]
                                          }
                                          : iss
                                      )
                                    );
                                  }
                                  e.target.value = null;
                                }}
                              />
                            </label>
                          </div>

                          {issueErrors.image && (
                            <div className="add-lab-validation-error">
                              {issueErrors.image}
                            </div>
                          )}
                        </div>

                        <div className="add-lab-field">
                          <label>
                            Tip <span className="optional">(Optional)</span>
                          </label>
                          <textarea
                            className="add-lab-issues-textarea add-lab-issues-tip-textarea"
                            placeholder="Enter an optional tip"
                            value={issue.tip}
                            onChange={(e) => {
                              updateIssue(issue.id, "tip", e.target.value);
                              autoResizeTextarea(e.target);
                            }}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="add-lab-issues-btn-add-issue"
                  onClick={addIssue}
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: "18px" }}></i> Add Issue
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =====================================
            STEP 4: REVIEW
        ===================================== */}
        {currentStep === 4 && (
          <section className="add-lab-step-card">
            <div className="add-lab-section-header">
              <div className="add-lab-section-number">4</div>
              <div>
                <h2>Review</h2>
                <p>Review the lab configuration before publishing.</p>
              </div>
            </div>

            <div className="add-lab-form-content">
              <div className="add-lab-review-wrapper">
                <div
                  className={`add-lab-review-banner ${missingCount > 0
                    ? "add-lab-review-banner-warning"
                    : "add-lab-review-banner-success"
                    }`}
                >
                  <div className="add-lab-review-banner-left">
                    <span className="add-lab-review-banner-icon">
                      {missingCount > 0 ? "⚠️" : "✅"}
                    </span>
                    <div>
                      <strong>Review your lab</strong>
                      <p>
                        Please review all sections. You can go back and edit any
                        part if needed.
                      </p>
                    </div>
                  </div>

                  <div className="add-lab-review-banner-right">
                    <div
                      className={`add-lab-review-status-badge ${missingCount === 0 ? "success" : ""
                        }`}
                    >
                      View Missing Items ({missingCount}){" "}
                      {missingCount === 0 && (
                        <i className="bi bi-check-circle-fill"></i>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. Lab Information */}
                <div className="add-lab-review-card">
                  <div className="add-lab-review-card-header">
                    <div className="add-lab-review-card-title">
                      <div className="add-lab-review-icon-circle">
                        <i className="bi bi-file-earmark-text-fill"></i>
                      </div>
                      <h3>1. Lab Information</h3>
                    </div>
                    <button
                      type="button"
                      className="add-lab-review-edit-button"
                      onClick={() => setCurrentStep(1)}
                    >
                      <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                  </div>

                  <div className="add-lab-review-card-body add-lab-review-grid-3">
                    <div className="add-lab-review-col">
                      <div className="add-lab-review-field">
                        <label>Service Category</label>
                        <div className="add-lab-review-value">
                          {serviceCategory || (
                            <span className="add-lab-review-empty">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="add-lab-review-field">
                        <label>Lab Name</label>
                        <div className="add-lab-review-value">
                          {labName || (
                            <span className="add-lab-review-empty">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="add-lab-review-field">
                        <label>Subtitle</label>
                        <div className="add-lab-review-value">
                          {subtitle || (
                            <span className="add-lab-review-empty">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="add-lab-review-field">
                        <label>Documentation URL</label>
                        <div className="add-lab-review-value">
                          {documentationUrl ? (
                            <a
                              href={documentationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {documentationUrl}
                            </a>
                          ) : (
                            <span className="add-lab-review-empty">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="add-lab-review-col add-lab-review-col-bordered">
                      <div className="add-lab-review-field">
                        <label>Overview</label>
                        <div className="add-lab-review-value">
                          {overview || (
                            <span className="add-lab-review-empty">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="add-lab-review-field">
                        <label>Learning Objectives</label>
                        <ul className="add-lab-review-list">
                          {learningObjectives.filter((obj) => obj.trim()).length > 0 ? (
                            learningObjectives
                              .filter((obj) => obj.trim())
                              .map((obj, i) => (
                                <li key={i}>
                                  <i className="bi bi-check-circle text-success"></i>{" "}
                                  {obj}
                                </li>
                              ))
                          ) : (
                            <span className="add-lab-review-empty">
                              Not provided
                            </span>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="add-lab-review-col add-lab-review-col-bordered">
                      <div className="add-lab-review-field">
                        <label>AWS Services</label>
                        {awsServices.length > 0 ? (
                          <div className="add-lab-review-aws-services-list">
                            {awsServices.map((service, idx) => {
                              const foundService = AWS_SERVICES.find(
                                (item) => item.name === service
                              );
                              const formattedIconName = foundService
                                ? foundService.icon
                                : service.toLowerCase().replace(/\s+/g, "");

                              return (
                                <div key={idx} className="add-lab-review-aws-tag">
                                  <img
                                    src={`assets/AWS_Icons/${formattedIconName}.png`}
                                    alt={service}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                  <span>{service}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="add-lab-review-empty">
                            Not provided
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Sections */}
                <div className="add-lab-review-card">
                  <div className="add-lab-review-card-header">
                    <div className="add-lab-review-card-title">
                      <div className="add-lab-review-icon-circle">
                        <i className="bi bi-list-task"></i>
                      </div>
                      <h3>2. Sections</h3>
                    </div>

                    <div className="add-lab-review-header-actions">
                      <span className="add-lab-review-count-badge">
                        {sections.length} Sections
                      </span>
                      <button
                        type="button"
                        className="add-lab-review-edit-button"
                        onClick={() => setCurrentStep(2)}
                      >
                        <i className="bi bi-pencil-fill"></i> Edit
                      </button>
                    </div>
                  </div>

                  <div className="add-lab-review-list-container">
                    {sections.map((section, idx) => {
                      const totalSecSteps = section.steps?.length || 0;
                      const totalImages = (section.steps || []).reduce(
                        (acc, s) => acc + (s.images?.length || 0),
                        0
                      );
                      const totalCode = (section.steps || []).reduce(
                        (acc, s) =>
                          acc +
                          (s.codeSnippets?.filter((c) => c.code.trim())?.length || 0),
                        0
                      );

                      return (
                        <details
                          key={section.id || idx}
                          className="add-lab-review-details"
                        >
                          <summary className="add-lab-review-summary">
                            <div className="add-lab-review-section-summary-grid">
                              <div className="add-lab-review-summary-col">
                                <h4 className="add-lab-review-item-title">
                                  {idx + 1}. {section.title || "Untitled Section"}
                                </h4>
                                <label>Objective</label>
                                <p>
                                  {section.objective || (
                                    <span className="add-lab-review-empty">
                                      Not provided
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="add-lab-review-summary-col">
                                <label>Tasks</label>
                                <ul className="add-lab-review-bullet-list">
                                  {(section.tasks || []).filter((t) => t.trim()).length > 0 ? (
                                    (section.tasks || [])
                                      .filter((t) => t.trim())
                                      .map((task, tIdx) => (
                                        <li key={tIdx}>{task}</li>
                                      ))
                                  ) : (
                                    <span className="add-lab-review-empty">
                                      Not provided
                                    </span>
                                  )}
                                </ul>
                              </div>

                              <div className="add-lab-review-summary-col add-lab-review-stats-col">
                                <div className="add-lab-review-stats-header">
                                  <label>Detailed Guide</label>
                                  <i className="bi bi-chevron-down add-lab-review-chevron"></i>
                                </div>
                                <div className="add-lab-review-stat-row">
                                  <span>Steps</span>{" "}
                                  <span className="add-lab-review-stat-num">
                                    {totalSecSteps}
                                  </span>
                                </div>
                                <div className="add-lab-review-stat-row">
                                  <span>Images</span>{" "}
                                  <span className="add-lab-review-stat-num">
                                    {totalImages}
                                  </span>
                                </div>
                                <div className="add-lab-review-stat-row">
                                  <span>Code Snippets</span>{" "}
                                  <span className="add-lab-review-stat-num">
                                    {totalCode}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </summary>

                          <div className="add-lab-review-details-content">
                            <div className="add-lab-review-steps-list">
                              {(section.steps || []).map((step, sIdx) => (
                                <div
                                  key={step.id || sIdx}
                                  className="add-lab-review-step-card"
                                >
                                  <h5>
                                    Step {sIdx + 1} — {step.title || "Untitled Step"}
                                  </h5>
                                  <div className="add-lab-review-field mt-2">
                                    <label>Instructions</label>
                                    <div className="add-lab-review-instructions">
                                      {step.instructions ? (
                                        step.instructions
                                          .split(/(?:\n|,\s*)(?=\d+\.\s)/)
                                          .map((instruction, i) => (
                                            <div
                                              key={i}
                                              className="add-lab-review-instruction-item"
                                            >
                                              {instruction.trim()}
                                            </div>
                                          ))
                                      ) : (
                                        <span className="add-lab-review-empty">
                                          Not provided
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Issues */}
                <div className="add-lab-review-card">
                  <div className="add-lab-review-card-header">
                    <div className="add-lab-review-card-title">
                      <div className="add-lab-review-icon-circle warning-icon">
                        <i className="bi bi-exclamation-triangle"></i>
                      </div>
                      <h3>3. Issues (Troubleshooting)</h3>
                    </div>

                    <div className="add-lab-review-header-actions">
                      <span className="add-lab-review-count-badge">
                        {issues.length} Issues
                      </span>
                      <button
                        type="button"
                        className="add-lab-review-edit-button"
                        onClick={() => setCurrentStep(3)}
                      >
                        <i className="bi bi-pencil-fill"></i> Edit
                      </button>
                    </div>
                  </div>

                  <div className="add-lab-review-list-container">
                    {issues.map((issue, idx) => (
                      <details
                        key={issue.id || idx}
                        className="add-lab-review-details"
                      >
                        <summary className="add-lab-review-summary">
                          <div className="add-lab-review-issue-summary-grid">
                            <div className="add-lab-review-issue-main">
                              <div className="add-lab-review-issue-number">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="add-lab-review-item-title error-text">
                                  {issue.title || "Untitled Issue"}
                                </h4>
                                <p className="add-lab-review-issue-desc">
                                  {issue.summary || (
                                    <span className="add-lab-review-empty">
                                      Not provided
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="add-lab-review-issue-stats">
                              <div className="add-lab-review-issue-stat">
                                <label>Why This Happens</label>
                                <span>{countLines(issue.why)} reasons</span>
                              </div>
                              <div className="add-lab-review-issue-stat">
                                <label>How to Fix</label>
                                <span>{countLines(issue.fix)} steps</span>
                              </div>
                              <i className="bi bi-chevron-down add-lab-review-chevron"></i>
                            </div>
                          </div>
                        </summary>

                        <div className="add-lab-review-details-content add-lab-review-issue-expanded">
                          <div className="add-lab-review-grid-2">
                            <div className="add-lab-review-field">
                              <label>Why This Happens</label>
                              <div
                                className="add-lab-review-formatted-text"
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {issue.why || (
                                  <span className="add-lab-review-empty">
                                    Not provided
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="add-lab-review-field">
                              <label>How to Fix</label>
                              <div
                                className="add-lab-review-formatted-text"
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {issue.fix || (
                                  <span className="add-lab-review-empty">
                                    Not provided
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>

                {missingCount === 0 && (
                  <div className="add-lab-review-success-banner">
                    <i className="bi bi-check-circle-fill add-lab-review-success-icon-large"></i>
                    <div>
                      <strong>Everything looks good!</strong>
                      <p>
                        Your lab content is complete and ready to be published.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Navigation Bar */}
        <div className="add-lab-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              className="add-lab-previous-button"
              onClick={handlePrevious}
            >
              <span>←</span> Previous
            </button>
          )}

          {currentStep < totalSteps && (
            <button
              type="button"
              className="add-lab-next-button"
              onClick={handleNext}
            >
              Next <span>→</span>
            </button>
          )}

          {currentStep === totalSteps && (
            <button
              type="button"
              className="add-lab-create-button"
              onClick={handleUpdateLab}
              disabled={updatingLab}
            >
              {updatingLab ? "Saving..." : "Save Changes"} <span>✔</span>
            </button>
          )}
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <CustomAlertModal
          icon="/assets/icons/DB-Success.png"
          title="Lab Updated Successfully!"
          message={`The Lab was successfully updated in ${serviceName} Labs.`}
          buttonText="← Back to Catalog"
          onButtonClick={() => {
            setShowSuccessModal(false);
            setCurrentPage("labcatalog");
          }}
        />
      )}

      {/* FAILED MODAL */}
      {showFailedModal && (
        <CustomAlertModal
          icon="/assets/icons/Failed.png"
          iconClass="failed"
          showLine={false}
          title="Lab Update Failed"
          message={failedMessage}
          buttonText="Close"
          onButtonClick={() => setShowFailedModal(false)}
        />
      )}
    </>
  );
}