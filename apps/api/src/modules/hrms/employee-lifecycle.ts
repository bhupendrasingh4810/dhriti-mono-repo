import { HttpStatus } from "@nestjs/common";
import type { HrmsEmployeeLifecycle, HrmsEmployeeLifecycleResponse, UpdateHrmsLifecycleInput } from "@dhriti/types";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";

export const lifecycleError = (message: string, status = HttpStatus.BAD_REQUEST) =>
  new AppError(ErrorCode.VALIDATION_FAILED, message, status);

/** Tracking never writes employee status/endDate or payroll. Only explicit HR commands record decisions. */
export function applyLifecycleAction(
  current: HrmsEmployeeLifecycle,
  input: UpdateHrmsLifecycleInput,
  joiningDate: string | null,
  resignationDate: string | null,
  today: string,
): HrmsEmployeeLifecycle {
  const next = { ...current };
  if (input.action === "CONFIGURE") {
    if (current.probationEndDate && input.data.probationEndDate !== current.probationEndDate) {
      throw lifecycleError("Use Extend probation to change an existing probation end date.");
    }
    if (
      current.contractEndDate &&
      (input.data.contractEndDate !== current.contractEndDate ||
        input.data.contractStartDate !== current.contractStartDate)
    ) {
      throw lifecycleError("Use Renew contract to change an existing contract.");
    }
    Object.assign(next, input.data);
  } else if (input.action === "CONFIRM_PROBATION") {
    if (!current.probationEndDate || current.probationConfirmedOn) {
      throw lifecycleError("Only an employee on probation can be confirmed.");
    }
    if (input.date > today) {
      throw lifecycleError("Confirmation cannot be recorded in the future.");
    }
    next.probationConfirmedOn = input.date;
  } else if (input.action === "EXTEND_PROBATION") {
    if (
      !current.probationEndDate ||
      current.probationConfirmedOn ||
      input.date <= current.probationEndDate ||
      input.date < today
    ) {
      throw lifecycleError("Extend an ongoing probation to a later date, today or in the future.");
    }
    next.probationEndDate = input.date;
  } else if (input.action === "RENEW_CONTRACT") {
    if (!current.contractEndDate || input.date <= current.contractEndDate || input.date < today) {
      throw lifecycleError("A renewal must extend the existing contract to a later date, today or in the future.");
    }
    next.contractEndDate = input.date;
  } else {
    if (!resignationDate || input.date < resignationDate) {
      throw lifecycleError("Record a resignation date first; the last working date cannot precede it.");
    }
    next.approvedLastWorkingDate = input.date;
  }
  if (next.contractEndDate && !next.contractStartDate) {
    throw lifecycleError("A contract start date is required when an end date is set.");
  }
  if (next.contractStartDate && next.contractEndDate && next.contractEndDate < next.contractStartDate) {
    throw lifecycleError("Contract end date cannot precede its start date.");
  }
  for (const date of [
    next.probationEndDate,
    next.probationConfirmedOn,
    next.contractStartDate,
    next.approvedLastWorkingDate,
  ]) {
    if (date && joiningDate && date < joiningDate) {
      throw lifecycleError("Lifecycle dates cannot precede the joining date.");
    }
  }
  if (next.approvedLastWorkingDate && (!resignationDate || next.approvedLastWorkingDate < resignationDate)) {
    throw lifecycleError("An approved last working date requires an earlier or same-day resignation date.");
  }
  return next;
}

export function lifecycleSummary(
  data: HrmsEmployeeLifecycle,
  resignationDate: string | null,
  today: string,
): Pick<HrmsEmployeeLifecycleResponse, "probationStatus" | "contractStatus" | "proposedLastWorkingDate"> {
  let proposedLastWorkingDate: string | null = null;
  // Calendar days after the resignation date; zero is a configured same-day notice, null is unconfigured.
  if (resignationDate && data.noticePeriodDays !== null) {
    const date = new Date(`${resignationDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + data.noticePeriodDays);
    proposedLastWorkingDate = date.toISOString().slice(0, 10);
  }
  return {
    proposedLastWorkingDate,
    probationStatus: data.probationConfirmedOn
      ? "CONFIRMED"
      : !data.probationEndDate
        ? "UNCONFIGURED"
        : data.probationEndDate < today
          ? "OVERDUE"
          : data.probationEndDate === today
            ? "DUE"
            : "ONGOING",
    contractStatus: !data.contractStartDate
      ? "UNCONFIGURED"
      : data.contractStartDate > today
        ? "UPCOMING"
        : data.contractEndDate && data.contractEndDate < today
          ? "EXPIRED"
          : "ACTIVE",
  };
}
