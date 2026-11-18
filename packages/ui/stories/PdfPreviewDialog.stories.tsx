import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { PdfPreviewDialog, type PdfPreviewDialogProps } from "../src/components/PdfPreviewDialog";
import { DhritiButton } from "../src/components/buttons-and-actions/button";

const samplePdf = new URL("./assets/atlas-quarterly-plan.pdf", import.meta.url).href;

function PreviewExample(props: PdfPreviewDialogProps) {
  const [open, setOpen] = useState(props.open);
  return (
    <>
      <DhritiButton onClick={() => setOpen(true)}>Preview Atlas report</DhritiButton>
      <PdfPreviewDialog
        {...props}
        open={open}
        onClose={() => {
          setOpen(false);
          props.onClose();
        }}
      />
    </>
  );
}

const meta = {
  title: "Documents/PDF Preview Dialog",
  component: PdfPreviewDialog,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    src: samplePdf,
    title: "Atlas quarterly planning report",
    documentTitle: "Atlas Q1 roadmap PDF",
    onClose: fn(),
    onDownload: fn(),
  },
  render: (args) => <PreviewExample {...args} />,
} satisfies Meta<typeof PdfPreviewDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Atlas Q1 roadmap PDF" })).toBeInTheDocument();
    await expect(await canvas.findByRole("document", { name: "Atlas Q1 roadmap PDF, page 1" })).toBeInTheDocument();
    await expect(canvas.getByRole("toolbar", { name: "PDF controls" })).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByRole("button", { name: "Zoom in" })).toBeEnabled());
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await expect(canvas.getByText("125%")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Fit width" }));
    const download = canvas.getByRole("button", { name: "Download PDF" });
    await userEvent.hover(download);
    download.focus();
    await expect(download).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onDownload).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: /^Close$/ }));
    await expect(args.onClose).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const Loading: Story = { args: { loading: true, src: null } };
export const Downloading: Story = { args: { downloading: true } };
export const DisabledDownload: Story = { args: { downloadDisabled: true } };
export const Error: Story = { args: { error: "The Atlas report could not be loaded. Please try again." } };
export const Empty: Story = { args: { src: null } };
export const InvalidDocument: Story = { args: { src: "data:application/pdf;base64,bm90LWEtdmFsaWQtcGRm" } };
export const LongContent: Story = {
  args: {
    title: "Atlas quarterly planning report for cross-functional delivery teams across all regional workspaces",
    description:
      "Review the complete Atlas roadmap, including delivery milestones, dependencies, owner assignments and regional planning assumptions before sharing this quarterly planning report with stakeholders.",
    documentTitle: "Atlas quarterly cross-functional roadmap and delivery planning PDF",
  },
};
export const Responsive: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };
