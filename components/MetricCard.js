function MetricCard({ title, value, colorClass = "users-card" }) {
  return (
    <div className={"metric-card " + colorClass}>
      <div className="metric-top"></div>

      <div className="metric-content">
        <div>
          <div className="metric-value">{value}</div>

          <div className="metric-label">{title}</div>
        </div>
      </div>
    </div>
  );
}
