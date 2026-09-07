function JsonCodeEditor({
  title,
  value,
  onChange,
  required = false,
  minLines = 20,
  isZoomed = false,
  onZoom,
  fieldError = "",
}) {
  const linesRef = React.useRef(null);
  const textRef = React.useRef(null);

  const validation = React.useMemo(() => {
    if (!value.trim()) {
      return {
        isValid: true,
        error: null,
      };
    }

    // 1. Check Size Limits (AWS evaluates policy size excluding whitespaces)
    const policySize = value.replace(/\s/g, "").length;
    const MAX_SIZE = 10240; // Maximum characters for a standard IAM User inline policy

    if (policySize > MAX_SIZE) {
      return {
        isValid: false,
        error: `Policy exceeds the size limit of ${MAX_SIZE} characters (current size: ${policySize}).`,
      };
    }

    try {
      const parsed = JSON.parse(value);

      // 2. Verify Required Elements: Version
      if (!parsed.Version) {
        throw new Error('Policy must include a "Version" element (typically "2012-10-17").');
      }

      // 2. Verify Required Elements: Statement Array
      if (!parsed.Statement || !Array.isArray(parsed.Statement)) {
        throw new Error('Policy must include a "Statement" array.');
      }

      // 2. Verify Required Elements: Effect, Action, and Resource
      for (let i = 0; i < parsed.Statement.length; i++) {
        const stmt = parsed.Statement[i];
        if (!stmt.Effect) {
          throw new Error(`Statement [${i}] is missing the required "Effect" element.`);
        }
        if (!stmt.Action) {
          throw new Error(`Statement [${i}] is missing the required "Action" element.`);
        }
        if (!stmt.Resource) {
          throw new Error(`Statement [${i}] is missing the required "Resource" element.`);
        }
      }

      return {
        isValid: true,
        error: null,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }, [value]);

  const lineCount = value.split("\n").length;
  const totalLines = Math.max(lineCount, minLines);

  const handleScroll = () => {
    if (textRef.current && linesRef.current) {
      linesRef.current.scrollTop = textRef.current.scrollTop;
    }
  };

  const handleBlur = () => {
    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Keep invalid JSON unchanged
    }
  };

  return (
    <div
      className={`editor-box ${!validation.isValid ? "error" : ""
        } ${isZoomed ? "zoomed" : ""}`}
    >
      <div className="editor-header">
        <label className="editor-title">
          {title}

          {required && (
            <span className="required">*</span>
          )}
        </label>

        <button
          type="button"
          className="service-zoom-btn"
          title={isZoomed ? "Exit Fullscreen" : "Fullscreen"}
          onClick={onZoom}
        >
          ⤢
        </button>
      </div>

      <div className="code-editor light">
        <div
          className="line-numbers"
          ref={linesRef}
        >
          {Array.from(
            { length: totalLines },
            (_, index) => (
              <div key={index + 1}>
                {index + 1}
              </div>
            )
          )}
        </div>

        <textarea
          ref={textRef}
          className="code-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onBlur={handleBlur}
          spellCheck="false"
          wrap="off"
        />
      </div>

      <div
        className={`editor-footer ${validation.isValid ? "valid" : "error"
          }`}
      >
        {validation.isValid
          ? "✓ JSON is valid"
          : validation.error}
      </div>

      {fieldError && (
        <div className="field-error">
          {fieldError}
        </div>
      )}
    </div>
  );
}