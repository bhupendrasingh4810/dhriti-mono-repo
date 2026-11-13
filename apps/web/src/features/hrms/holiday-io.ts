import type { HrmsHoliday, HrmsHolidayImportItem } from "@/services/hrms.service";

/** CSV/ICS import and export for holidays. Columns: date (YYYY-MM-DD), name, half_day (yes/no), location (blank = all). */

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
const day = (holiday: HrmsHoliday) => holiday.date.slice(0, 10);

export function holidaysToCsv(holidays: HrmsHoliday[]) {
  const rows = holidays.map((holiday) =>
    [day(holiday), holiday.name, holiday.isHalfDay ? "yes" : "no", holiday.workLocation?.name ?? ""].map(csvCell).join(","),
  );
  return ["date,name,half_day,location", ...rows].join("\r\n");
}

const icsEscape = (value: string) => value.replace(/\\/g, "\\\\").replace(/[,;]/g, (char) => `\\${char}`).replace(/\n/g, "\\n");
const compact = (isoDay: string) => isoDay.replace(/-/g, "");

export function holidaysToIcs(holidays: HrmsHoliday[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const events = holidays.flatMap((holiday) => {
    const next = new Date(`${day(holiday)}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return [
      "BEGIN:VEVENT",
      `UID:${holiday.id}@dhriti`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(day(holiday))}`,
      `DTEND;VALUE=DATE:${compact(next.toISOString().slice(0, 10))}`,
      `SUMMARY:${icsEscape(holiday.isHalfDay ? `${holiday.name} (half day)` : holiday.name)}`,
      ...(holiday.workLocation ? [`LOCATION:${icsEscape(holiday.workLocation.name)}`] : []),
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dhriti//Holidays//EN", ...events, "END:VCALENDAR"].join("\r\n");
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

const truthy = (value: string | undefined) => /^(yes|true|1|y|half)/i.test(value ?? "");

export function parseHolidayCsv(text: string): HrmsHolidayImportItem[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const header = splitCsvLine(lines[0] ?? "").map((cell) => cell.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  if (col("date") < 0 || col("name") < 0) throw new Error('CSV must have "date" and "name" columns.');
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return {
      date: cells[col("date")] ?? "",
      name: cells[col("name")] ?? "",
      isHalfDay: truthy(cells[col("half_day")]),
      locationName: cells[col("location")] || undefined,
    };
  });
}

export function parseHolidayIcs(text: string): HrmsHolidayImportItem[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const unescape = (value: string) => value.replace(/\\([,;nN\\])/g, (_, char: string) => (char.toLowerCase() === "n" ? "\n" : char));
  return unfolded
    .split(/BEGIN:VEVENT/)
    .slice(1)
    .map((block) => {
      const prop = (name: string) => block.match(new RegExp(`^${name}[^:\\r\\n]*:(.*)$`, "m"))?.[1]?.trim();
      const start = prop("DTSTART") ?? "";
      const summary = unescape(prop("SUMMARY") ?? "");
      const half = /\s*\(half day\)$/i.test(summary);
      return {
        date: `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`,
        name: summary.replace(/\s*\(half day\)$/i, ""),
        isHalfDay: half,
        locationName: unescape(prop("LOCATION") ?? "") || undefined,
      };
    });
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
