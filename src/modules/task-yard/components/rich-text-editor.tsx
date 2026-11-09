"use client";

import * as React from "react";
import {
  ListBullets,
  ListNumbers,
  TextB,
  TextHOne,
  TextItalic,
  TextUnderline,
} from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export function RichTextEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const command = (name: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, argument);
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const tools = [
    { label: "Bold", icon: TextB, command: () => command("bold") },
    { label: "Italic", icon: TextItalic, command: () => command("italic") },
    { label: "Underline", icon: TextUnderline, command: () => command("underline") },
    { label: "Heading", icon: TextHOne, command: () => command("formatBlock", "h2") },
    { label: "Bulleted list", icon: ListBullets, command: () => command("insertUnorderedList") },
    { label: "Numbered list", icon: ListNumbers, command: () => command("insertOrderedList") },
  ];

  return (
    <div className="overflow-hidden rounded bg-surface-raised/70 shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-separator/10 p-1.5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.label}
              type="button"
              aria-label={tool.label}
              title={tool.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.command}
              className="grid h-8 w-8 place-items-center rounded text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text note"
        data-placeholder="Write the context, references, or working notes for this task…"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className={cn(
          "min-h-48 px-4 py-3 text-body leading-relaxed text-foreground-primary outline-none",
          "[&:empty]:before:text-foreground-quaternary [&:empty]:before:content-[attr(data-placeholder)]",
          "[&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_h2]:mt-3 [&_h2]:text-heading [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-surface-inset [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5",
          className,
        )}
      />
    </div>
  );
}
