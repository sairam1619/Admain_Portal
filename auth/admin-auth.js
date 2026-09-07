const ADMIN_API = "https://nwjx221gs1.execute-api.us-east-1.amazonaws.com/prod";

const adminClientId = "2demgh65090h0o6sdllm0n07v2";

const adminDomain =
  "https://us-east-1cvzdhl3e1.auth.us-east-1.amazoncognito.com";

const adminRedirect = window.location.origin;

function adminCognitoLogoutRedirect() {
  return (
    adminDomain +
    "/logout?client_id=" +
    adminClientId +
    "&logout_uri=" +
    encodeURIComponent(window.location.origin)
  );
}

function startAdminLogin() {
  window.location.href =
    adminDomain +
    "/oauth2/authorize" +
    "?response_type=token" +
    "&client_id=" +
    adminClientId +
    "&scope=email+openid+profile" +
    "&prompt=login" +
    "&redirect_uri=" +
    adminRedirect;
}

function saveAdminToken() {
  const existingToken = getAdminToken();

  if (existingToken) {
    return;
  }

  if (!window.location.hash) {
    startAdminLogin();

    return;
  }

  const params = new URLSearchParams(window.location.hash.substring(1));

  const token = params.get("id_token");

  if (token) {
    localStorage.setItem("adminToken", token);

    window.history.replaceState(null, "", window.location.pathname);

    window.history.pushState(null, "", window.location.pathname);
  }
}

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function adminLogout() {
  localStorage.removeItem("adminToken");

  localStorage.removeItem("adminUser");

  localStorage.removeItem("adminDashboardData");

  window.location.href = "logout-success.html";
}

function adminUser() {
  const token = getAdminToken();

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return payload;
  } catch (error) {
    console.error("Invalid admin token", error);

    return null;
  }
}

function adminUsername() {
  const user = adminUser();

  if (!user) {
    return "";
  }

  return user.name || user.email || "";
}

function adminEmail() {
  const user = adminUser();

  if (!user) {
    return "";
  }

  return user.email || "";
}

function isAdminAuthenticated() {
  const token = getAdminToken();

  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    const currentTime = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < currentTime) {
      adminLogout();

      return false;
    }

    return true;
  } catch (error) {
    console.error("Admin authentication validation failed", error);

    adminLogout();

    return false;
  }
}

function adminAuthHeader() {
  const token = getAdminToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: "Bearer " + token,
  };
}
