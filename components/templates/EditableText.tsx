"use client";

import { useLayoutEffect, useRef } from "react";
import styles from "./templates.module.css";

type Props = {
  value: string;
  onCommit: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  tag?: "span" | "h1" | "p";
};

export default function EditableText({ value, onCommit, editable = false, placeholder, className = "", tag: Tag = "span" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  // React never reconciles the editable children, preserving the selection while typing.
  useLayoutEffect(() => {
    const node = ref.current;
    if (editable && node && document.activeElement !== node && node.innerText !== value) {
      node.textContent = value;
    }
  }, [value, editable]);

  if (!editable) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      ref={(node) => { ref.current = node; }}
      className={`${styles.editable} ${className}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      aria-multiline
      data-placeholder={placeholder}
      onBlur={(event) => {
        const text = event.currentTarget.innerText.replace(/\r\n/g, "\n").trim();
        event.currentTarget.textContent = text;
        onCommit(text);
      }}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        // insertText keeps the browser's native selection and undo history.
        document.execCommand("insertText", false, text);
      }}
    />
  );
}
