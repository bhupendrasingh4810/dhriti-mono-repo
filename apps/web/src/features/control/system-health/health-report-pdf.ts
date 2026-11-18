import type { SystemHealthSnapshot } from "@dhriti/types";
import { lightTheme } from "@dhriti/ui";
import { PDFDocument, PageSizes, StandardFonts, rgb } from "pdf-lib";

/** Render locally: health data never leaves the authenticated browser for PDF conversion. */
export async function createHealthReportPdf(report: SystemHealthSnapshot): Promise<Blob> {
  const document = await PDFDocument.create();
  // Standard PDF fonts keep exports portable without downloading a remote font.
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(regular.getCharacterSet());
  // Preserve unsupported characters explicitly rather than silently dropping report content.
  const printable = (value: string) =>
    Array.from(value.normalize("NFC"), (character) =>
      character === "\n" || character === "\r" || supported.has(character.codePointAt(0)!)
        ? character
        : `[U+${character.codePointAt(0)!.toString(16).toUpperCase()}]`,
    ).join("");
  const color = (hex: string) => {
    const value = Number.parseInt(hex.replace("#", ""), 16);
    return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
  };
  const margin = lightTheme.tokens.spacing["3xl"];
  const bodySize = Number.parseFloat(lightTheme.typography.body2.fontSize) * 12;
  const headingSize = Number.parseFloat(lightTheme.typography.h3.fontSize) * 12;
  const lineHeight = bodySize * lightTheme.typography.body2.lineHeight;
  let page = document.addPage(PageSizes.A4);
  let y = page.getHeight() - margin;
  const write = (value: string, heading = false) => {
    const font = heading ? bold : regular;
    const size = heading ? headingSize : bodySize;
    const height = heading ? headingSize * lightTheme.typography.h3.lineHeight : lineHeight;
    const width = page.getWidth() - margin * 2;
    let line = "";
    const flush = () => {
      if (y - height < margin) {
        page = document.addPage(PageSizes.A4);
        y = page.getHeight() - margin;
      }
      y -= height;
      page.drawText(line, { x: margin, y, font, size, color: color(lightTheme.tokens.color.text.primary) });
      line = "";
    };
    for (const paragraph of printable(value).split(/\r?\n/)) {
      // Character wrapping also bounds long URLs/instance IDs with no spaces.
      for (const character of paragraph) {
        if (font.widthOfTextAtSize(line + character, size) > width && line) flush();
        line += character;
      }
      flush();
    }
    y -= lightTheme.tokens.spacing.sm;
  };

  document.setTitle("Dhriti System Health Report");
  document.setSubject(`Instance ${report.instanceId}; sampled ${report.timestamp}`);
  write("Dhriti System Health Report", true);
  write(`Sampled at: ${report.timestamp}\nInstance: ${report.instanceId}`);
  write(
    `Process started: ${report.processStartedAt}\nObservation window started: ${report.availabilityWindowStartedAt}\nSampling interval: ${report.sampleIntervalSeconds}s`,
  );
  write("Summary", true);
  write(
    `Operational: ${report.summary.operational} | Degraded: ${report.summary.degraded} | Outage: ${report.summary.outage} | Unavailable: ${report.summary.unavailable}`,
  );
  write("Services", true);
  for (const service of report.services) {
    write(`${service.name} - ${service.status}`);
    write(
      `Availability: ${service.uptimePercent === null ? "Unavailable" : `${service.uptimePercent}%`} | Latency: ${service.latencyMs === null ? "Unavailable" : `${service.latencyMs}ms`} | Samples: ${service.samples}\nChecked: ${service.checkedAt}\n${service.detail}`,
    );
  }
  write("Resources", true);
  for (const resource of report.resources) {
    write(`${resource.label}: ${resource.value === null ? "Unavailable" : `${resource.value}%`}\n${resource.detail}`);
  }
  write("Connections", true);
  write(
    `Active: ${report.connections.active} | Change over 5m: ${report.connections.changeLast5m ?? "Unavailable"}\n${report.connections.detail}`,
  );
  write("Scope and limitations", true);
  write(
    "Per-instance sampled availability, not an SLA or fleet-wide uptime. Unavailable checks are not successful checks. History resets on process restart. Unsupported PDF font characters are represented as [U+codepoint]; JSON retains original text.",
  );
  const pages = document.getPages();
  pages.forEach((entry, index) => {
    entry.drawText(`${index + 1} / ${pages.length}`, {
      x: margin,
      y: margin / 2,
      font: regular,
      size: bodySize,
      color: color(lightTheme.tokens.color.text.secondary),
    });
  });
  const bytes = await document.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}
