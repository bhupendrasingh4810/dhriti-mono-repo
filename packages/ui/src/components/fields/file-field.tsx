"use client";

import { useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
import {
  FieldFrame,
  fieldActionClass,
  fieldSurface,
  useFieldIdentity,
  type FieldPresentationProps,
} from "./field-primitives";

export interface DhritiFileInputProps extends FieldPresentationProps {
  value: readonly File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  name?: string;
  actionLabel?: string;
  acceptLabel?: string;
  uploading?: boolean;
  uploadLabel?: string;
  progress?: number;
}

/** The parent validates file type/size and owns uploads. `accept` is a chooser hint, not validation. */
export function DhritiFileInput({
  value,
  onChange,
  accept,
  multiple = false,
  name,
  actionLabel = "Upload supporting document",
  acceptLabel,
  uploading = false,
  uploadLabel = "Uploading...",
  progress,
  ...props
}: DhritiFileInputProps) {
  const identity = useFieldIdentity(props);
  const input = useRef<HTMLInputElement>(null);
  if (progress !== undefined && (!Number.isFinite(progress) || progress < 0 || progress > 100))
    throw new RangeError("DhritiFileInput progress must be between 0 and 100.");
  const blocked = props.disabled || props.readOnly || uploading;
  return (
    <FieldFrame
      {...props}
      id={identity.id}
      details={
        value.length > 0 && (
          <ul className="space-y-1" aria-label={`${props.label} files`}>
            {value.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex min-w-0 items-center gap-2 rounded-md bg-background px-3 py-2"
              >
                <FileText className="size-4 shrink-0 text-brand" aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words text-sm text-text-primary">{file.name}</span>
                <span className="shrink-0 text-xs text-text-muted">{Math.ceil(file.size / 1024)} KB</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className={fieldActionClass}
                  disabled={blocked}
                  onClick={() => onChange(value.filter((_, fileIndex) => fileIndex !== index))}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )
      }
    >
      <div
        className="relative"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = blocked ? "none" : "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (blocked) return;
          const files = Array.from(event.dataTransfer.files);
          if (files.length) onChange(multiple ? files : files.slice(0, 1));
        }}
      >
        <input
          ref={input}
          {...identity.input}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={blocked}
          aria-required={props.required || undefined}
          className="peer sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (!blocked && files.length) onChange(multiple ? files : files.slice(0, 1));
            // Reset only the native chooser so selecting the same file again still emits an event.
            event.target.value = "";
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Choose ${props.label}`}
          disabled={blocked}
          aria-busy={uploading}
          onClick={() => input.current?.click()}
          className={`${fieldSurface(props)} flex cursor-pointer flex-col items-center gap-2 border-dashed p-6 text-center hover:border-brand peer-focus-visible:shadow-field-focus disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Upload className="size-5 text-brand" aria-hidden="true" />
          <span className="text-sm font-semibold text-text-primary">{uploading ? uploadLabel : actionLabel}</span>
          {acceptLabel && <span className="text-xs text-text-muted">{acceptLabel}</span>}
          {uploading && progress !== undefined && (
            <progress
              aria-label={`${props.label} upload progress`}
              max={100}
              value={progress}
              className="h-1 w-full accent-brand"
            />
          )}
        </button>
      </div>
    </FieldFrame>
  );
}
