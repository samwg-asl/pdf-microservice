import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import { setupQuillIcons, quillModules } from "../configs/QuillRichTextConfig";
import { Typography } from "antd";
import React from "react";
import { countWords } from "../services/FormValidateService";

const { Text } = Typography;

/**
 * @typedef {Object} WebFormQuillEditorProps
 * @property {string} [value] - HTML string content (controlled); also used as initial value
 * @property {string} [placeholder]
 * @property {boolean} [disabled]
 * @property {boolean} [readOnly]
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 * @property {(html: string) => void} [onChange]
 * @property {() => void} [onBlur]
 * @property {string} [errorMsg]
 * @property {number} [maxInputLength] - max plain-text character count; shows counter when set
 * @property {number} [maxWordCount]   - max word count; shows word counter when set
 */

/**
 * Rich-text editor wrapper around Quill.
 * Matches the quill initialisation pattern used across webforms.
 *
 * External `value` updates (e.g. draft loading) are applied to the editor.
 * Internal typing fires `onChange` without triggering a re-render loop.
 *
 * @param {WebFormQuillEditorProps} props
 */
export default function WebFormQuillEditor({
  value,
  placeholder = "Please Input",
  disabled = false,
  readOnly = false,
  className,
  style,
  onChange,
  onBlur,
  errorMsg,
  maxInputLength,
  maxWordCount,
}) {
  const quillRef = useRef(null);
  const quillInstance = useRef(null);
  const pendingContent = useRef(null);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const isFirstRef = useRef(true);
  // Tracks the last HTML string written into Quill (from either direction)
  // so we can skip redundant syncs and prevent cursor-reset loops.
  const lastSetValue = useRef(undefined);
  // Refs to latest callbacks so the one-time Quill event handlers always
  // invoke the current onChange/onBlur without stale closure issues.
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  onChangeRef.current = onChange;
  onBlurRef.current = onBlur;

  // Initialise Quill once on mount
  useEffect(() => {
    if (quillRef.current && !quillInstance.current) {
      setupQuillIcons();
      quillInstance.current = new Quill(quillRef.current, {
        theme: "snow",
        modules: quillModules,
        placeholder: disabled ? "" : placeholder,
        readOnly: disabled || readOnly,
      });

      quillInstance.current.on("text-change", (_delta, _oldDelta, source) => {
        const html = quillInstance.current.root.innerHTML;
        // getText() includes a trailing newline, subtract 1
        const len = Math.max(0, quillInstance.current.getText().length - 1);
        setCharCount(len);
        setWordCount(countWords(html, true));
        // Only propagate user-initiated changes to RHF.
        // When source is 'api' (e.g. setting root.innerHTML after reset/draft load),
        // Quill normalises an empty editor to "<p><br></p>" — calling onChange here
        // would overwrite the reset value of null/"" and mark the form dirty.
        if (source === "user") {
          // Normalise Quill's empty state to "" so RHF required validation triggers
          const normalized = len === 0 ? "" : html;
          lastSetValue.current = normalized;
          onChangeRef.current?.(normalized);
          // Trigger blur when emptied so RHF re-validates immediately
          if (len === 0) {
            onBlurRef.current?.();
          }
        }
      });

      quillInstance.current.on("selection-change", (_range, _oldRange, source) => {
        if (source === "user" && !isFirstRef.current) {
          onBlurRef.current?.();
        }
        if (isFirstRef.current) {
          isFirstRef.current = false;
        }
      });

      // Apply content that arrived before the editor was ready
      if (pendingContent.current !== null) {
        quillInstance.current.clipboard.dangerouslyPasteHTML(pendingContent.current, "api");
        lastSetValue.current = pendingContent.current;
        pendingContent.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. draft loading) into the editor
  useEffect(() => {
    if (value === lastSetValue.current) return;

    if (!quillInstance.current) {
      pendingContent.current = value ?? "";
      return;
    }

    lastSetValue.current = value;
    quillInstance.current.clipboard.dangerouslyPasteHTML(value ?? "", "api");
  }, [value]);

  // Sync disabled / readOnly changes
  useEffect(() => {
    if (quillInstance.current) {
      quillInstance.current.enable(!(disabled || readOnly));
    }
  }, [disabled, readOnly]);

  return (
    <div>
      <div ref={quillRef} className={`quill-wrapper${className ? ` ${className}` : ""}`} style={style} />
      <div style={{ display: "flex", gap: 12 }}>
        {maxInputLength != null && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {charCount}/{maxInputLength}
          </Text>
        )}
        {maxWordCount != null && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {wordCount} / {maxWordCount} words
          </Text>
        )}
      </div>

      <div>
        {errorMsg && (
          <Text type="danger" style={{ fontSize: 12 }}>
            {errorMsg}
          </Text>
        )}
      </div>
    </div>
  );
}
