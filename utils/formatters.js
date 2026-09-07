function formatDate(value) {
  if (!value) {
    return "-";
  }

  /*
    FORCE UTC PARSING
  */

  const date = new Date(value + "Z");

  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const formattedTime = date
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    .toLowerCase();

  return formattedDate + "\n" + formattedTime;
}

function formatTime(value) {
  if (!value) {
    return "--";
  }

  /*
    FORCE UTC PARSING
  */

  const date = new Date(value + "Z");

  return date
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    .toLowerCase();
}

function formatHours(minutes) {
  if (!minutes) {
    return "0 h";
  }

  const hours = minutes / 60;

  if (hours % 1 === 0) {
    return `${hours} h`;
  }

  return `${hours.toFixed(1)} h`;
}

function shortText(value, length = 40) {
  if (!value) {
    return "";
  }

  if (value.length <= length) {
    return value;
  }

  return value.substring(0, length) + "...";
}
