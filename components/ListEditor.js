function ListEditor({
  value,
  onChange,
  type = "number",
  maxLength = 2000,
  placeholder = "",
  className = "",
}) {
  const editorRef = React.useRef(null);
  const initializedRef = React.useRef(false);

  // =========================================================
  // INITIAL CONTENT
  // =========================================================

  React.useEffect(() => {
    if (!editorRef.current || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    const editor = editorRef.current;

    const lines = (value || "")
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*\d+\.\s*/, "")
          .replace(/^\s*[•\-*]\s*/, "")
          .trim()
      )
      .filter(Boolean);

    // Keep editor empty when there is no value.
    // CSS placeholder will be displayed.
    if (lines.length === 0) {
      editor.innerHTML = "";
      editor.dataset.empty = "true";
      return;
    }

    const tag = type === "number" ? "ol" : "ul";

    editor.innerHTML = `
      <${tag}>
        ${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </${tag}>
    `;

    editor.dataset.empty = "false";
  }, [value, type]);

  // =========================================================
  // INPUT
  // =========================================================

  const handleInput = (e) => {
    const editor = e.currentTarget;

    // If the editor has been completely cleared,
    // remove the list and show the placeholder.
    const rawText = (editor.innerText || "").replace(/\u00a0/g, " ").trim();

    if (!rawText) {
      editor.innerHTML = "";
      editor.dataset.empty = "true";
      onChange("");
      return;
    }

    // Make sure manually typed text is inside
    // the correct list structure.
    const listSelector = type === "number" ? "ol" : "ul";
    const existingList = editor.querySelector(listSelector);

    if (!existingList) {
      createListFromText(editor, type);
    }

    editor.dataset.empty = "false";

    // Get the exact value that will be stored.
    // This includes:
    // 1. 
    // 2.
    // 3.
    // etc.
    let formattedValue = getListText(editor, type);

    // =======================================================
    // MAX LENGTH
    // =======================================================

    if (formattedValue.length > maxLength) {
      trimListToMaxLength(editor, type, maxLength);

      // Recalculate after trimming.
      formattedValue = getListText(editor, type);

      // Keep cursor at the end if trimming
      // modified the content.
      const lastListItem = editor.querySelector(`${listSelector} > li:last-child`);

      if (lastListItem) {
        placeCursorAtEnd(lastListItem);
      }
    }

    onChange(formattedValue);
  };

  // =========================================================
  // KEY DOWN
  // =========================================================

  const handleKeyDown = (e) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    // -------------------------------------------------------
    // ENTER
    // -------------------------------------------------------

    if (e.key === "Enter") {
      const selection = window.getSelection();

      if (!selection || !selection.rangeCount) {
        return;
      }

      const range = selection.getRangeAt(0);
      let node = range.startContainer;

      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }

      const currentLi = node?.closest?.("li");

      if (!currentLi) {
        return;
      }

      // Browser automatically creates
      // the next numbered list item.
      return;
    }

    // -------------------------------------------------------
    // BACKSPACE
    // -------------------------------------------------------

    if (e.key === "Backspace") {
      requestAnimationFrame(() => {
        cleanupEmptyList();
      });

      return;
    }
  };

  // =========================================================
  // PASTE
  // =========================================================

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain");

    if (!pastedText) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const lines = pastedText
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/^\s*\d+\.\s*/, "")
          .replace(/^\s*[•\-*]\s*/, "")
          .trim()
      )
      .filter(Boolean);

    if (!lines.length) {
      return;
    }

    const selection = window.getSelection();

    if (!selection || !selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);

    // Make sure the paste happened
    // inside this editor.
    if (!editor.contains(range.commonAncestorContainer)) {
      return;
    }

    let node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    let currentLi = node?.closest?.("li");

    // =======================================================
    // PASTE WHEN EDITOR IS EMPTY
    // =======================================================

    if (!currentLi) {
      editor.innerHTML = "";
      const list = document.createElement(type === "number" ? "ol" : "ul");
      editor.appendChild(list);

      lines.forEach((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        list.appendChild(li);
      });

      const lastLi = list.lastElementChild;
      placeCursorAtEnd(lastLi);
      editor.dataset.empty = "false";

      handleInput({
        currentTarget: editor,
      });

      return;
    }

    // =======================================================
    // DELETE SELECTED CONTENT
    // =======================================================

    range.deleteContents();

    // =======================================================
    // SINGLE LINE PASTE
    // =======================================================

    if (lines.length === 1) {
      const textNode = document.createTextNode(lines[0]);

      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);

      handleInput({
        currentTarget: editor,
      });

      return;
    }

    // =======================================================
    // MULTIPLE LINE PASTE
    // =======================================================

    const firstText = document.createTextNode(lines[0]);

    range.insertNode(firstText);
    range.setStartAfter(firstText);
    range.collapse(true);

    let referenceLi = currentLi;

    lines.slice(1).forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      referenceLi.after(li);
      referenceLi = li;
    });

    // Put cursor at the end of
    // the last pasted item.
    placeCursorAtEnd(referenceLi);
    editor.dataset.empty = "false";

    handleInput({
      currentTarget: editor,
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className={`list-editor ${className}`}
      data-placeholder={placeholder}
      data-empty="true"
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
}

// =========================================================
// CREATE LIST FROM FIRST TYPED TEXT
// =========================================================

function createListFromText(editor, type) {
  const text = (editor.innerText || "").trim();

  if (!text) {
    return;
  }

  const tag = type === "number" ? "ol" : "ul";
  const list = document.createElement(tag);
  const li = document.createElement("li");

  li.textContent = text;
  list.appendChild(li);
  editor.innerHTML = "";
  editor.appendChild(list);

  placeCursorAtEnd(li);
}

// =========================================================
// CLEANUP EMPTY LIST
// =========================================================

function cleanupEmptyList() {
  const editor = document.querySelector(".list-editor:focus");

  if (!editor) {
    return;
  }

  const text = (editor.innerText || "").replace(/\u00a0/g, " ").trim();

  if (!text) {
    editor.innerHTML = "";
    editor.dataset.empty = "true";
  }
}

// =========================================================
// PLACE CURSOR AT END
// =========================================================

function placeCursorAtEnd(element) {
  if (!element) {
    return;
  }

  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);
}

// =========================================================
// CONVERT LIST → TEXT
// =========================================================

function getListText(editor, type) {
  const selector = type === "number" ? "ol > li" : "ul > li";
  const items = editor.querySelectorAll(selector);

  return Array.from(items)
    .map((item) => item.innerText.trim())
    .filter(Boolean)
    .map((text, index) => {
      if (type === "number") {
        return `${index + 1}. ${text}`;
      }
      return `• ${text}`;
    })
    .join("\n");
}

// =========================================================
// TRIM LIST TO MAX LENGTH
// =========================================================

function trimListToMaxLength(editor, type, maxLength) {
  const list = editor.querySelector(type === "number" ? "ol" : "ul");

  if (!list) {
    return;
  }

  const items = Array.from(list.querySelectorAll(":scope > li"));
  let totalLength = 0;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const text = item.innerText || "";
    const prefix = type === "number" ? `${index + 1}. ` : "• ";

    // Add newline between list items.
    const newlineLength = index > 0 ? 1 : 0;
    const fullLength = prefix.length + text.length + newlineLength;

    // Entire item fits.
    if (totalLength + fullLength <= maxLength) {
      totalLength += fullLength;
      continue;
    }

    // Calculate how many characters
    // from this item can remain.
    const available = maxLength - totalLength - prefix.length - newlineLength;

    if (available > 0) {
      item.textContent = text.substring(0, available);
    } else {
      item.remove();
    }

    // Remove every item after
    // the item that exceeded the limit.
    items.slice(index + 1).forEach((remainingItem) => {
      remainingItem.remove();
    });

    break;
  }
}

// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}