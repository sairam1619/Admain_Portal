async function adminFetch(path, options = {}) {
  let token = getAdminToken();

  /*
    WAIT FOR COGNITO SESSION RESTORE
  */
  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    token = getAdminToken();
  }

  /*
    STILL NO TOKEN
  */
  if (!token) {
    startAdminLogin();
    return Promise.reject("No admin token");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: "Bearer " + token,
  };

  // Only set Content-Type to JSON if body is NOT FormData
  // When body is FormData, browser automatically attaches multipart/form-data with boundary
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(
    ADMIN_API + path,
    {
      ...options,
      headers,
    }
  );

  /*
    TOKEN INVALID OR EXPIRED
  */
  if (response.status === 401) {
    adminLogout();
    return Promise.reject("Unauthorized");
  }

  /*
    API FAILED
  */
  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}

/*
  USERS
*/

async function fetchUsers() {
  return adminFetch("/admin/users");
}

/*
  BLOCK-USER
*/

async function blockUser(userId) {
  return adminFetch(
    "/admin/block-user",
    {
      method: "POST",
      body: JSON.stringify({
        userId,
      }),
    }
  );
}

/*
  UNBLOCK-USER
*/

async function unblockUser(userId) {
  return adminFetch(
    "/admin/unblock-user",
    {
      method: "POST",
      body: JSON.stringify({
        userId,
      }),
    }
  );
}

/*
  SESSIONS
*/

async function fetchSessions() {
  return adminFetch("/admin/sessions");
}

/*
  ACCOUNT POOL
*/

async function fetchAccounts() {
  return adminFetch("/admin/accounts");
}

/*
  ANALYTICS
*/

async function getAnalytics() {
  return adminFetch("/admin/analytics");
}

async function fetchAnalyticsTrend(period = 7) {
  return adminFetch(`/admin/analytics/trend?period=${period}`);
}

/*
  DASHBOARD
*/

async function fetchDashboard() {
  return adminFetch("/admin/dashboard");
}

/*
  PERMISSION SETS
*/

async function fetchPermissionSets() {
  return adminFetch("/admin/permissionsets");
}

/*
  LAB CATALOG
*/

async function fetchLabCatalog() {
  return adminFetch("/admin/labcatalog");
}

/*
  CREATE SERVICE
*/

async function createService(serviceData) {
  return adminFetch(
    "/admin/services",
    {
      method: "POST",
      body: JSON.stringify(serviceData),
    }
  );
}

/*
  GET SERVICE DETAILS
*/

async function fetchService(service, permissionSetName) {
  const params = new URLSearchParams({
    permissionSetName,
  });

  return adminFetch(
    `/admin/services/${encodeURIComponent(service)}?${params.toString()}`
  );
}

/*
  UPDATE SERVICE
*/

async function updateService(serviceData) {
  return adminFetch(
    `/admin/services/${encodeURIComponent(serviceData.service)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        permissionSetName: serviceData.permissionSetName,
        duration: serviceData.duration,
        awsServices: serviceData.services,
        inlinePolicy: serviceData.inlinePolicy,
        boundaryPolicy: serviceData.boundaryPolicy,
      }),
    }
  );
}

/*
  CREATE LAB
*/

async function createLab(service, labData) {
  const formData = new FormData();

  const sectionImages = [];
  const issueImages = [];

  const cleanLabData = {
    ...labData,

    sections: (labData.sections || []).map((section, sectionIndex) => {
      let pictureNumber = 1;

      return {
        ...section,

        steps: (section.steps || []).map((step) => {
          const images = (step.images || []).map((image) => {
            const extension =
              image.file?.name?.split(".").pop()?.toLowerCase() || "png";

            const fileName =
              `sec_${sectionIndex + 1}_pic_${pictureNumber}.${extension}`;

            if (image.file) {
              const renamedFile = new File(
                [image.file],
                fileName,
                {
                  type: image.file.type
                }
              );

              sectionImages.push(renamedFile);
            }

            pictureNumber++;

            return {
              id: image.id,
              fileName: fileName,
              contentType: image.contentType,
              caption: image.caption || ""
            };
          });

          return {
            ...step,
            images
          };
        })
      };
    }),

    issues: (labData.issues || []).map((issue, issueIndex) => {
      const images = (issue.images || []).map((image, imageIndex) => {
        const extension =
          image.file?.name?.split(".").pop() || "png";

        const fileName =
          `issue_${issueIndex + 1}_pic_${imageIndex + 1}.${extension}`;

        if (image.file) {
          const renamedFile = new File(
            [image.file],
            fileName,
            { type: image.file.type }
          );

          issueImages.push(renamedFile);
        }

        return {
          id: image.id,
          fileName: fileName,
          contentType: image.contentType,
          caption: image.caption || ""
        };
      });

      return {
        ...issue,
        images
      };
    })
  };

  formData.append(
    "labData",
    JSON.stringify(cleanLabData)
  );

  sectionImages.forEach((file) => {
    formData.append(
      "sectionImages",
      file
    );
  });

  issueImages.forEach((file) => {
    formData.append(
      "issueImages",
      file
    );
  });

  console.log(
    "Section images:",
    sectionImages.map(file => file.name)
  );

  console.log(
    "Issue images:",
    issueImages.map(file => file.name)
  );

  return adminFetch(
    `/admin/services/${encodeURIComponent(service)}/labs`,
    {
      method: "POST",
      body: formData
    }
  );
}


/*
  GET LAB DETAILS
*/

async function fetchLab(service, labName) {
  return adminFetch(
    `/admin/services/${encodeURIComponent(service)}/labs/${encodeURIComponent(labName)}`
  );
}

/*
  UPDATE LAB (admin-api.js)
*/

async function updateLab(service, labName, labData) {
  console.log("========================================");
  console.log("        UPDATE LAB CALLED");
  console.log("========================================");
  console.log("Service:", service);
  console.log("Lab Name:", labName);
  console.log("Lab Data:", labData);

  const formData = new FormData();
  const sectionFilesToUpload = [];
  const issueFilesToUpload = [];

  // =========================================================
  // 1. COLLECT SECTION IMAGE BINARIES ONLY
  // =========================================================
  (labData.sections || []).forEach((section, sectionIndex) => {
    const sectionNumber = sectionIndex + 1;

    (section.steps || []).forEach((step) => {
      (step.images || []).forEach((image) => {
        if (!image.file) {
          return;
        }

        const replacement = (labData.replacedSectionImages || []).find(
          (item) =>
            item.section === sectionNumber &&
            (String(item.id) === String(image.id) ||
              String(item.image?.id) === String(image.id))
        );

        const targetFileName =
          image.fileName ||
          (replacement ? replacement.oldFileName : image.file.name);

        const renamedFile = new File([image.file], targetFileName, {
          type: image.file.type || image.contentType || "image/png"
        });

        sectionFilesToUpload.push({
          file: renamedFile,
          section: sectionNumber,
          id: image.id || null,
          oldFileName: replacement ? replacement.oldFileName : null,
          newFileName: targetFileName
        });
      });
    });
  });

  // =========================================================
  // 2. COLLECT ISSUE IMAGE BINARIES ONLY
  // =========================================================
  (labData.issues || []).forEach((issue, issueIndex) => {
    const issueNumber = issueIndex + 1;

    (issue.images || []).forEach((image, imageIndex) => {
      if (!image.file) {
        return;
      }

      const replacement = (labData.replacedIssueImages || []).find(
        (item) =>
          item.issue === issueNumber &&
          (String(item.id) === String(image.id) ||
            String(item.image?.id) === String(image.id) ||
            item.position === imageIndex + 1)
      );

      const targetFileName =
        image.fileName ||
        (replacement ? replacement.oldFileName : image.file.name);

      const renamedFile = new File([image.file], targetFileName, {
        type: image.file.type || image.contentType || "image/png"
      });

      issueFilesToUpload.push({
        file: renamedFile,
        issue: issueNumber,
        id: image.id || null,
        oldFileName: replacement ? replacement.oldFileName : null,
        newFileName: targetFileName
      });
    });
  });

  // =========================================================
  // 3. CLEAN JSON (STRIP RAW FILE HANDLES, RETAIN METADATA)
  // =========================================================
  const cleanLabData = {
    ...labData,

    sections: (labData.sections || []).map((section) => ({
      ...section,
      steps: (section.steps || []).map((step) => ({
        ...step,
        images: (step.images || []).map((image) => ({
          id: image.id || null,
          fileName: image.fileName,
          contentType: image.contentType || image.file?.type || "",
          caption: image.caption || ""
        }))
      }))
    })),

    issues: (labData.issues || []).map((issue) => ({
      ...issue,
      images: (issue.images || []).map((image) => ({
        id: image.id || null,
        fileName: image.fileName,
        contentType: image.contentType || image.file?.type || "",
        caption: image.caption || ""
      }))
    })),

    addedSectionImages: (labData.addedSectionImages || []).map((item) => ({
      ...item,
      image: {
        id: item.image?.id || null,
        fileName: item.image?.fileName,
        contentType: item.image?.contentType || item.image?.file?.type || "",
        caption: item.image?.caption || ""
      }
    })),

    replacedSectionImages: (labData.replacedSectionImages || []).map((item) => ({
      ...item,
      image: {
        id: item.image?.id || null,
        fileName: item.image?.fileName,
        contentType: item.image?.contentType || item.image?.file?.type || "",
        caption: item.image?.caption || ""
      }
    })),

    addedIssueImages: (labData.addedIssueImages || []).map((item) => ({
      ...item,
      image: {
        id: item.image?.id || null,
        fileName: item.image?.fileName,
        contentType: item.image?.contentType || item.image?.file?.type || "",
        caption: item.image?.caption || ""
      }
    })),

    replacedIssueImages: (labData.replacedIssueImages || []).map((item) => ({
      ...item,
      image: {
        id: item.image?.id || null,
        fileName: item.image?.fileName,
        contentType: item.image?.contentType || item.image?.file?.type || "",
        caption: item.image?.caption || ""
      }
    }))
  };

  // =========================================================
  // 4. ATTACH FULL JSON (INCLUDES ALL TRACKING ARRAYS)
  // =========================================================
  formData.append("labData", JSON.stringify(cleanLabData));

  // =========================================================
  // 5. ATTACH UPLOAD / RENAME METADATA
  // =========================================================
  formData.append(
    "sectionImageChanges",
    JSON.stringify(
      sectionFilesToUpload.map((item) => ({
        section: item.section,
        id: item.id,
        oldFileName: item.oldFileName,
        newFileName: item.newFileName
      }))
    )
  );

  formData.append(
    "issueImageChanges",
    JSON.stringify(
      issueFilesToUpload.map((item) => ({
        issue: item.issue,
        id: item.id,
        oldFileName: item.oldFileName,
        newFileName: item.newFileName
      }))
    )
  );

  // =========================================================
  // 6. ATTACH BINARIES
  // =========================================================
  sectionFilesToUpload.forEach((item) => {
    formData.append("sectionImages", item.file);
  });

  issueFilesToUpload.forEach((item) => {
    formData.append("issueImages", item.file);
  });

  // =========================================================
  // 7. DEBUG LOGS
  // =========================================================
  console.log("========================================");
  console.log("        UPDATE LAB IMAGE METADATA");
  console.log("========================================");
  console.log("modifiedImageSections:", labData.modifiedImageSections);
  console.log("addedSectionImages:", labData.addedSectionImages);
  console.log("deletedSectionImages:", labData.deletedSectionImages);
  console.log("replacedSectionImages:", labData.replacedSectionImages);
  console.log("unchangedSectionImages:", labData.unchangedSectionImages);
  console.log("modifiedImageIssues:", labData.modifiedImageIssues);
  console.log("addedIssueImages:", labData.addedIssueImages);
  console.log("deletedIssueImages:", labData.deletedIssueImages);
  console.log("replacedIssueImages:", labData.replacedIssueImages);
  console.log("unchangedIssueImages:", labData.unchangedIssueImages);
  console.log("========================================");
  console.log(
    "Section images to upload:",
    sectionFilesToUpload.map((i) => `${i.oldFileName || "NEW"} -> ${i.newFileName}`)
  );
  console.log(
    "Issue images to upload:",
    issueFilesToUpload.map((i) => `${i.oldFileName || "NEW"} -> ${i.newFileName}`)
  );
  console.log("Unchanged images skipped from binary upload.");

  // =========================================================
  // 8. DISPATCH REQUEST
  // =========================================================
  const url =
    `/admin/services/${encodeURIComponent(service)}` +
    `/labs/${encodeURIComponent(labName)}`;

  return adminFetch(url, {
    method: "PUT",
    body: formData
  });
}

/*
  DELETE LAB
*/

async function deleteLab(service, labName) {
  console.log("========================================");
  console.log("        DELETE LAB CALLED");
  console.log("========================================");
  console.log("Service:", service);
  console.log("Lab Name:", labName);

  const url =
    `/admin/services/${encodeURIComponent(service)}` +
    `/labs/${encodeURIComponent(labName)}`;

  return adminFetch(url, {
    method: "DELETE"
  });
}

async function getLabDeleteStatus(jobId) {
  return adminFetch(
    `/admin/lab-delete-status/${encodeURIComponent(jobId)}`
  );
}

/*
  DELETE SERVICE
*/

async function deleteService(service) {
  console.log("========================================");
  console.log("        DELETE SERVICE CALLED");
  console.log("========================================");
  console.log("Service:", service);

  const url =
    `/admin/services/${encodeURIComponent(service)}`;

  return adminFetch(url, {
    method: "DELETE"
  });
}

/*
  SERVICE DELETE STATUS
*/

async function getServiceDeleteStatus(jobId) {
  return adminFetch(
    `/admin/service-delete-status/${encodeURIComponent(jobId)}`
  );
}