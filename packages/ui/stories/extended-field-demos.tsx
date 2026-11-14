import { useState } from "react";
import {
  DhritiDateField,
  DhritiFileInput,
  DhritiTextareaField,
  DhritiTimeField,
  type FieldPresentationProps,
} from "../src/components/fields";

export interface ExtendedFieldDemoProps extends Pick<
  FieldPresentationProps,
  "size" | "variant" | "required" | "disabled" | "readOnly" | "error" | "success" | "clearable"
> {
  kind: "date" | "textarea" | "file" | "time";
  dateMode?: "date" | "month" | "year";
  prefilled?: boolean;
  initiallyOpen?: boolean;
  longContent?: boolean;
  minuteStep?: number;
  uploading?: boolean;
  multiple?: boolean;
}
export const extendedFieldArgs = {
  size: "md",
  variant: "outlined",
  required: false,
  disabled: false,
  readOnly: false,
  clearable: true,
  prefilled: false,
  initiallyOpen: false,
  longContent: false,
  minuteStep: 5,
  uploading: false,
  multiple: false,
} satisfies Omit<ExtendedFieldDemoProps, "kind">;

export function ExtendedFieldDemo({
  kind,
  dateMode = "date",
  prefilled,
  initiallyOpen,
  longContent,
  minuteStep,
  uploading,
  multiple,
  ...props
}: ExtendedFieldDemoProps) {
  const [date, setDate] = useState(
    prefilled ? (dateMode === "month" ? "2026-11" : dateMode === "year" ? "2026" : "2026-11-14") : "",
  );
  const [month, setMonth] = useState("2026-11");
  const [time, setTime] = useState(prefilled ? "09:00" : "");
  const [text, setText] = useState(
    prefilled
      ? longContent
        ? "Planning leave for an extended family visit. ".repeat(12)
        : "I am planning a family visit."
      : "",
  );
  const [files, setFiles] = useState<File[]>(() =>
    prefilled
      ? [
          new File(
            ["Example supporting document"],
            longContent
              ? "Supporting-document-for-annual-leave-and-family-travel-approval-with-a-very-long-file-name.pdf"
              : "supporting-document.pdf",
            { type: "application/pdf" },
          ),
        ]
      : [],
  );
  const [fileError, setFileError] = useState("");
  const [open, setOpen] = useState(initiallyOpen ?? false);
  return (
    <div className="w-full max-w-md p-6">
      {kind === "date" && (
        <DhritiDateField
          {...props}
          label="From date"
          mode={dateMode}
          placeholder="Choose a date"
          value={date}
          onChange={setDate}
          month={month}
          onMonthChange={setMonth}
          open={open}
          onOpenChange={setOpen}
        />
      )}
      {kind === "time" && (
        <DhritiTimeField
          {...props}
          label="Clock in"
          placeholder="--:--"
          value={time}
          onChange={setTime}
          open={open}
          onOpenChange={setOpen}
          minuteStep={minuteStep}
          helperText="Select hours and minutes. Changes apply immediately."
        />
      )}
      {kind === "textarea" && (
        <DhritiTextareaField
          {...props}
          label="Reason"
          placeholder="Tell your approver why you need time off"
          value={text}
          onChange={setText}
          rows={4}
          resize="vertical"
          showCharacterCount
          maxLength={1000}
        />
      )}
      {kind === "file" && (
        <DhritiFileInput
          {...props}
          label="Attachment"
          value={files}
          onChange={(next) => {
            // Example application policy: files are never uploaded by this story or the shared field.
            const invalid = next.find(
              (file) =>
                !["application/pdf", "image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024,
            );
            setFileError(invalid ? "Choose a PDF, JPG or PNG file no larger than 2 MB." : "");
            setFiles(next);
          }}
          error={props.error || fileError || undefined}
          accept=".pdf,.jpg,.jpeg,.png"
          acceptLabel="PDF, JPG or PNG · Maximum 2 MB"
          helperText="Optional supporting document. Drop a file here or choose one."
          uploading={uploading}
          progress={uploading ? 45 : undefined}
          multiple={multiple}
        />
      )}
    </div>
  );
}

export function ExtendedFieldStory(props: ExtendedFieldDemoProps) {
  return (
    <ExtendedFieldDemo
      key={`${props.kind}-${props.dateMode}-${props.prefilled}-${props.initiallyOpen}-${props.longContent}`}
      {...props}
    />
  );
}
