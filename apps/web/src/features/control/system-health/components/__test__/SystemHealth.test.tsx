import { resetPdfRenderer } from "@/test/pdf-preview-mock";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SystemHealthSnapshot } from "@dhriti/types";
import SystemHealth from "@/app/(workspace)/[organizationSlug]/control/platform/system-health/page";
import { controlPlatformService } from "@/services/control.service";
import * as pdfReport from "../../health-report-pdf";
import { PDFDocument } from "pdf-lib";

vi.mock("@/services/control.service", () => ({
  controlPlatformService: { systemHealth: vi.fn(), systemHealthReport: vi.fn() },
}));

const rows = [
  ["api", "API Gateway"],
  ["auth", "Auth Service"],
  ["database", "Database (Primary)"],
  ["replica", "Database (Replica)"],
  ["redis", "Redis Cache"],
  ["storage", "File Storage (S3)"],
  ["email", "Email Service"],
  ["websocket", "WebSocket Server"],
  ["search", "Search (Elasticsearch)"],
  ["cdn", "CDN"],
];
function report(overrides: Partial<SystemHealthSnapshot> = {}): SystemHealthSnapshot {
  return {
    timestamp: "2026-11-18T03:30:00Z",
    instanceId: "instance",
    processStartedAt: "2026-11-18T03:00:00Z",
    sampleIntervalSeconds: 30,
    availabilityWindowStartedAt: "2026-11-18T03:00:00Z",
    summary: { operational: 5, degraded: 0, outage: 0, unavailable: 5 },
    services: rows.map(([id, name]) => ({
      id,
      name,
      status: ["api", "auth", "database", "redis", "storage"].includes(id) ? "operational" : "unavailable",
      uptimePercent: ["api", "auth", "database", "redis", "storage"].includes(id) ? 100 : null,
      latencyMs: ["api", "auth", "database", "redis", "storage"].includes(id) ? 12 : null,
      checkedAt: "2026-11-18T03:30:00Z",
      detail: `${name} measured scope`,
      samples: 1,
    })),
    resources: [
      { id: "cpu", label: "CPU Usage", value: 8.5, detail: "Process CPU" },
      { id: "memory", label: "Memory", value: 2.4, detail: "Process memory" },
      { id: "disk", label: "Disk I/O", value: null, detail: "Not instrumented" },
      { id: "network", label: "Network", value: null, detail: "Not instrumented" },
    ],
    connections: { active: 12, changeLast5m: null, detail: "Local /connect sockets" },
    ...overrides,
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}
function blobContents(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
function mockDownloads() {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:system-health");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    },
  );
  const downloads: { href: string; filename: string }[] = [];
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ href: this.href, filename: this.download });
  });
  return { createObjectURL, revokeObjectURL, click, downloads };
}
beforeEach(() => {
  vi.resetAllMocks();
  resetPdfRenderer();
  vi.mocked(controlPlatformService.systemHealth).mockResolvedValue(report());
  vi.mocked(controlPlatformService.systemHealthReport).mockResolvedValue(report());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("API-connected System Health without refresh flicker", () => {
  it("preserves the original cards, all ten rows and resource panel while showing initial skeletons", async () => {
    const pending = deferred<SystemHealthSnapshot>();
    vi.mocked(controlPlatformService.systemHealth).mockReturnValueOnce(pending.promise);
    render(<SystemHealth />);
    expect(screen.getByRole("status", { name: "Loading System Health" })).toBeInTheDocument();
    expect(screen.getAllByTestId("system-health-skeleton").length).toBeGreaterThan(30);
    expect(screen.getAllByRole("row")).toHaveLength(11);
    for (const [, name] of rows) expect(screen.getByText(name)).toBeInTheDocument();
    for (const heading of ["System Health", "Service Status", "Resource Usage"])
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    for (const column of ["Service", "Status", "Uptime", "Latency", "Last Check"])
      expect(screen.getByRole("columnheader", { name: column })).toBeInTheDocument();
    expect(screen.queryByText("4,821")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Health Report" })).toBeDisabled();
    await act(async () => pending.resolve(report()));
    expect(screen.queryByTestId("system-health-skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("8.5%")).toBeInTheDocument();
    expect(screen.getByText("2.4%")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(11);
    expect(screen.getByRole("button", { name: "Download Health Report" })).toBeEnabled();
  });

  it("keeps the existing rows, scroll and readings mounted during a slow manual refresh", async () => {
    vi.useFakeTimers();
    const pending = deferred<SystemHealthSnapshot>();
    vi.mocked(controlPlatformService.systemHealth).mockResolvedValueOnce(report()).mockReturnValueOnce(pending.promise);
    render(<SystemHealth />);
    await act(async () => undefined);
    const row = screen.getByText("API Gateway").closest("tr");
    const table = screen.getByRole("table");
    table.scrollTop = 90;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await act(async () => undefined);
    expect(controlPlatformService.systemHealth).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
    expect(screen.queryByTestId("system-health-skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("8.5%")).toBeInTheDocument();
    expect(screen.getByText("API Gateway").closest("tr")).toBe(row);
    expect(table.scrollTop).toBe(90);
    await act(async () =>
      pending.resolve(
        report({
          timestamp: "2026-11-18T03:30:30Z",
          resources: report().resources.map((resource) =>
            resource.id === "cpu" ? { ...resource, value: 9.5 } : resource,
          ),
        }),
      ),
    );
    expect(screen.getByText("9.5%")).toBeInTheDocument();
    expect(screen.getByText("API Gateway").closest("tr")).toBe(row);
    expect(table.scrollTop).toBe(90);
  });

  it("retains the last good data and reports refresh failures explicitly, without skeleton flashes on retry", async () => {
    vi.useFakeTimers();
    vi.mocked(controlPlatformService.systemHealth)
      .mockResolvedValueOnce(report())
      .mockRejectedValueOnce(new Error("Service temporarily unavailable"))
      .mockResolvedValue(report({ timestamp: "2026-11-18T03:31:00Z" }));
    render(<SystemHealth />);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await act(async () => undefined);
    expect(screen.getByRole("alert")).toHaveTextContent("Showing the last successful readings");
    expect(screen.getByText("8.5%")).toBeInTheDocument();
    expect(screen.queryByTestId("system-health-skeleton")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByTestId("system-health-skeleton")).not.toBeInTheDocument();
    await act(async () => undefined);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(controlPlatformService.systemHealth).toHaveBeenCalledTimes(3);
  });

  it("does not poll while idle or on focus, and aborts active requests on unmount", async () => {
    vi.useFakeTimers();
    const pending = deferred<SystemHealthSnapshot>();
    vi.mocked(controlPlatformService.systemHealth).mockResolvedValueOnce(report()).mockReturnValueOnce(pending.promise);
    const view = render(<SystemHealth />);
    await act(async () => undefined);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120000);
    });
    fireEvent.focus(window);
    expect(controlPlatformService.systemHealth).toHaveBeenCalledTimes(1);
    const row = screen.getByText("API Gateway").closest("tr")!;
    expect(within(row).getByText(new Date(report().timestamp).toLocaleTimeString())).toHaveAttribute(
      "datetime",
      report().timestamp,
    );
    expect(within(row).queryByText(/s ago$/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await act(async () => undefined);
    expect(controlPlatformService.systemHealth).toHaveBeenCalledTimes(2);
    const signal = vi.mocked(controlPlatformService.systemHealth).mock.calls[1][0];
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => pending.resolve(report()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(controlPlatformService.systemHealth).toHaveBeenCalledTimes(2);
  });

  it("handles initial API failure without showing demo data and supports retry", async () => {
    vi.mocked(controlPlatformService.systemHealth).mockRejectedValueOnce(new Error("Access denied"));
    render(<SystemHealth />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
    expect(screen.queryByTestId("system-health-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByText("847ms")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(11);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("8.5%")).toBeInTheDocument();
  });

  it("does not replace a newer snapshot with an older load-balanced response", async () => {
    vi.useFakeTimers();
    vi.mocked(controlPlatformService.systemHealth)
      .mockResolvedValueOnce(report())
      .mockResolvedValueOnce(
        report({
          timestamp: "2026-11-18T03:29:00Z",
          resources: report().resources.map((resource) => ({ ...resource, value: 99 })),
        }),
      );
    render(<SystemHealth />);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await act(async () => undefined);
    expect(screen.getByText("8.5%")).toBeInTheDocument();
    expect(screen.queryByText("99%")).not.toBeInTheDocument();
  });

  it("shows unsupported measurements as unavailable instead of counting them as outages or successful checks", async () => {
    render(<SystemHealth />);
    await screen.findByText("8.5%");
    const replica = screen.getByText("Database (Replica)").closest("tr")!;
    expect(within(replica).getByText("unavailable")).toBeInTheDocument();
    expect(within(replica).getAllByText("—")).toHaveLength(2);
    expect(screen.getByText("5m comparison unavailable")).toBeInTheDocument();
  });

  it("downloads actual API JSON only after success, retaining the existing button label", async () => {
    const { createObjectURL, revokeObjectURL, click, downloads } = mockDownloads();
    const pending = deferred<SystemHealthSnapshot>();
    vi.mocked(controlPlatformService.systemHealthReport).mockReturnValueOnce(pending.promise);
    const view = render(<SystemHealth />);
    await screen.findByText("8.5%");
    fireEvent.click(screen.getByRole("button", { name: "Download Health Report" }));
    expect(controlPlatformService.systemHealthReport).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "PDF" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByRole("button", { name: "Download Health Report" })).toBeDisabled();
    expect(screen.queryByText("Health report downloaded")).not.toBeInTheDocument();
    await act(async () => pending.resolve(report()));
    expect(screen.getByText("Health report downloaded")).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    const json = JSON.parse(new TextDecoder().decode(await blobContents(blob)));
    expect(json).toEqual(report());
    expect(click).toHaveBeenCalledTimes(1);
    expect(downloads[0].filename).toMatch(/\.json$/);
    expect(screen.getByRole("button", { name: "Download Health Report" })).toBeEnabled();
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:system-health");
  });

  it("does not falsely report successful downloads when the report API fails", async () => {
    vi.mocked(controlPlatformService.systemHealthReport).mockRejectedValueOnce(new Error("Report unavailable"));
    render(<SystemHealth />);
    await screen.findByText("8.5%");
    fireEvent.click(screen.getByRole("button", { name: "Download Health Report" }));
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    expect(await screen.findByText("Report unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Health report downloaded")).not.toBeInTheDocument();
  });

  it("previews the actual PDF before download, reuses its exact URL and releases it on close", async () => {
    const { createObjectURL, revokeObjectURL, click, downloads } = mockDownloads();
    const blob = new Blob(["pdf-test-bytes"], { type: "application/pdf" });
    vi.spyOn(pdfReport, "createHealthReportPdf").mockResolvedValueOnce(blob);
    render(<SystemHealth />);
    await screen.findByText("8.5%");
    fireEvent.click(screen.getByRole("button", { name: "Download Health Report" }));
    fireEvent.click(screen.getByRole("button", { name: "PDF" }));
    const dialog = await screen.findByRole("dialog", { name: "Health Report PDF Preview" });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(await within(dialog).findByRole("region", { name: "Health Report PDF" })).toBeInTheDocument();
    expect(within(dialog).getByRole("toolbar", { name: "PDF controls" })).toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();
    expect(screen.queryByText("Health report downloaded")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Download PDF" }));
    expect(downloads[0].href).toBe("blob:system-health");
    expect(downloads[0].filename).toMatch(/\.pdf$/);
    expect(controlPlatformService.systemHealthReport).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: /^Close$/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:system-health");
  });

  it("shows PDF generation errors without opening a preview or reporting success", async () => {
    vi.spyOn(pdfReport, "createHealthReportPdf").mockRejectedValueOnce(new Error("PDF could not be generated"));
    render(<SystemHealth />);
    await screen.findByText("8.5%");
    fireEvent.click(screen.getByRole("button", { name: "Download Health Report" }));
    fireEvent.click(screen.getByRole("button", { name: "PDF" }));
    expect(await screen.findByText("PDF could not be generated")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Health report downloaded")).not.toBeInTheDocument();
  });

  it("cancels exports on unmount and never creates late preview URLs", async () => {
    const { createObjectURL } = mockDownloads();
    const pending = deferred<SystemHealthSnapshot>();
    vi.mocked(controlPlatformService.systemHealthReport).mockReturnValueOnce(pending.promise);
    const view = render(<SystemHealth />);
    await screen.findByText("8.5%");
    fireEvent.click(screen.getByRole("button", { name: "Download Health Report" }));
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    const signal = vi.mocked(controlPlatformService.systemHealthReport).mock.calls[0][0];
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => pending.resolve(report()));
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("dismisses the format selector with Escape or outside pointer actions", async () => {
    render(<SystemHealth />);
    await screen.findByText("8.5%");
    const button = screen.getByRole("button", { name: "Download Health Report" });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "PDF" })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("button", { name: "PDF" })).not.toBeInTheDocument();
    expect(controlPlatformService.systemHealthReport).not.toHaveBeenCalled();
  });

  it("generates a real paginated PDF including long details and non-Latin text safely", async () => {
    const data = report();
    data.services[0].detail = `健康 проверка ${"Very long detail ".repeat(600)}`;
    const blob = await pdfReport.createHealthReportPdf(data);
    expect(blob.type).toBe("application/pdf");
    const bytes = await blobContents(blob);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const document = await PDFDocument.load(bytes);
    expect(document.getTitle()).toBe("Dhriti System Health Report");
    expect(document.getPageCount()).toBeGreaterThan(3);
    expect(document.getSubject()).toContain(data.timestamp);
  });
});
