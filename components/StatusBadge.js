function StatusBadge({ status }) {
  const normalized = (status || "UNKNOWN").toUpperCase();

  let badgeClass = "status-badge ";

  /*
    USER STATUS
  */

  if (normalized === "ACTIVE") {
    badgeClass += "active";
  } else if (normalized === "BLOCKED") {
    badgeClass += "blocked";
  } else if (normalized === "AVAILABLE") {

  /*
    ACCOUNT STATUS
  */
    badgeClass += "available";
  } else if (normalized === "ASSIGNING") {
    badgeClass += "assigning";
  } else if (normalized === "CLEANING") {
    badgeClass += "cleaning";
  } else if (normalized === "FAILED") {
    badgeClass += "failed";
  } else {
    badgeClass += "unknown";
  }

  return <span className={badgeClass}>{normalized}</span>;
}
