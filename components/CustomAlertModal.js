function CustomAlertModal({
  icon,
  title,
  message,
  buttonText,
  buttonClass = "custom-alert-button",
  iconClass = "",
  showLine = true,
  onButtonClick,
}) {
  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert-modal">

        <div className={`custom-alert-icon ${iconClass}`}>
          <img src={icon} alt="" />
        </div>

        <h3>{title}</h3>

        {showLine && (
          <div className="custom-alert-line"></div>
        )}

        <p>{message}</p>

        <button
          className={buttonClass}
          onClick={onButtonClick}
        >
          {buttonText}
        </button>

      </div>
    </div>
  );
}

function CustomConfirmModal({
  title,
  message,
  confirmText = "delete",
  confirmButtonText = "Delete Lab",
  confirmButtonDisabled = false,
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = React.useState("");

  const canConfirm = inputValue === confirmText;

  return (
    <div className="custom-confirm-overlay">
      <div className="custom-confirm-modal">

        {/* TITLE */}
        <h3 className="custom-confirm-title">
          {title}
        </h3>

        {/* MESSAGE */}
        <p className="custom-confirm-message">
          {message}
        </p>

        {/* WARNING */}
        <p className="custom-confirm-warning">
          This action cannot be undone.
        </p>

        {/* CONFIRMATION TEXT */}
        <label className="custom-confirm-label">
          To confirm, type <strong>{confirmText}</strong> below.
        </label>

        {/* INPUT */}
        <input
          type="text"
          className="custom-confirm-input"
          placeholder={`Type ${confirmText}`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={confirmButtonDisabled}
          autoFocus
        />

        {/* ACTIONS */}
        <div className="custom-confirm-actions">
          <button
            type="button"
            className="custom-confirm-cancel"
            onClick={onCancel}
            disabled={confirmButtonDisabled}
          >
            Cancel
          </button>

          <button
            type="button"
            className="custom-confirm-delete"
            disabled={!canConfirm || confirmButtonDisabled}
            onClick={onConfirm}
          >
            {confirmButtonDisabled ? "Deleting..." : confirmButtonText}
          </button>
        </div>

      </div>
    </div>
  );
}