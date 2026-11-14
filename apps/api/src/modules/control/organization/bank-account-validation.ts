import type { CreateOrganizationBankDto } from "./dto/organization-bank.dto";

export class BankFormatError extends Error {
  constructor(
    readonly fields: (keyof CreateOrganizationBankDto)[],
    message: string,
  ) {
    super(message);
  }
}

/** Format/checksum checks do not establish bank existence, ownership, or payment eligibility. */
export function validateBankAccount(dto: CreateOrganizationBankDto) {
  if (
    !/^[A-Z]{2}$/.test(dto.countryCode) ||
    !new Intl.DisplayNames(["en"], { type: "region", fallback: "none" }).of(dto.countryCode) ||
    ["ZZ", "EU", "UN", "QO", "XA", "XB"].includes(dto.countryCode)
  ) {
    throw new BankFormatError(["countryCode"], "Select a recognized country or territory");
  }
  if (!Intl.supportedValuesOf("currency").includes(dto.currency)) {
    throw new BankFormatError(["currency"], "Select a supported ISO currency");
  }
  const accountNumber = dto.accountNumber.replace(/\s/g, "").toUpperCase();
  const routingCode = dto.routingCode.replace(/[\s-]/g, "").toUpperCase();
  const swiftCode = dto.swiftCode.trim().toUpperCase();
  if (swiftCode && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftCode)) {
    throw new BankFormatError(["swiftCode"], "SWIFT/BIC must have 8 or 11 valid characters");
  }
  if (swiftCode && swiftCode.slice(4, 6) !== dto.countryCode) {
    throw new BankFormatError(["swiftCode"], "SWIFT/BIC country must match the bank country");
  }
  let formatCheck: string;
  if (dto.accountType === "IBAN") {
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(accountNumber) || accountNumber.slice(0, 2) !== dto.countryCode) {
      throw new BankFormatError(["accountNumber"], "IBAN must match the bank country and contain 15 to 34 characters");
    }
    let remainder = 0;
    for (const character of accountNumber.slice(4) + accountNumber.slice(0, 4)) {
      const digits = /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character;
      for (const digit of digits) {
        remainder = (remainder * 10 + Number(digit)) % 97;
      }
    }
    if (remainder !== 1) {
      throw new BankFormatError(["accountNumber"], "IBAN checksum is invalid");
    }
    formatCheck = "IBAN_CHECKSUM";
  } else {
    if (!/^[A-Z0-9]{4,34}$/.test(accountNumber)) {
      throw new BankFormatError(["accountNumber"], "Local account must contain 4 to 34 letters/digits");
    }
    if (dto.countryCode === "IN") {
      if (!/^\d{9,18}$/.test(accountNumber) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(routingCode)) {
        throw new BankFormatError(
          ["accountNumber", "routingCode"],
          "India accounts require 9 to 18 digits and a valid IFSC format",
        );
      }
      formatCheck = "IN_ACCOUNT_IFSC_FORMAT";
    } else if (dto.countryCode === "US") {
      if (!/^\d{4,17}$/.test(accountNumber) || !/^\d{9}$/.test(routingCode)) {
        throw new BankFormatError(
          ["accountNumber", "routingCode"],
          "US accounts require 4 to 17 digits and a 9-digit ABA routing number",
        );
      }
      const digits = [...routingCode].map(Number);
      const checksum =
        3 * (digits[0] + digits[3] + digits[6]) +
        7 * (digits[1] + digits[4] + digits[7]) +
        digits[2] +
        digits[5] +
        digits[8];
      const prefix = Number(routingCode.slice(0, 2));
      if (
        checksum % 10 ||
        /^0+$/.test(routingCode) ||
        !(prefix <= 12 || (prefix >= 21 && prefix <= 32) || (prefix >= 61 && prefix <= 72) || prefix === 80)
      ) {
        throw new BankFormatError(["routingCode"], "ABA routing checksum or prefix is invalid");
      }
      formatCheck = "US_ABA_CHECKSUM";
    } else if (dto.countryCode === "GB") {
      if (!/^\d{8}$/.test(accountNumber) || !/^\d{6}$/.test(routingCode)) {
        throw new BankFormatError(
          ["accountNumber", "routingCode"],
          "UK local accounts require 8 account digits and a 6-digit sort code",
        );
      }
      formatCheck = "GB_ACCOUNT_SORT_CODE_FORMAT";
    } else {
      if (!/^[A-Z0-9]{2,34}$/.test(routingCode)) {
        throw new BankFormatError(["routingCode"], "Enter a local routing/branch code (2 to 34 letters/digits)");
      }
      formatCheck = "BASIC_FORMAT_ONLY";
    }
  }
  return { accountNumber, routingCode, swiftCode, formatCheck };
}
