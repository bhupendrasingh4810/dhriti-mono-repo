import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { validateBankAccount } from "./bank-account-validation";
import { CreateOrganizationBankDto, ReviewOrganizationBankDto } from "./dto/organization-bank.dto";

const input: CreateOrganizationBankDto = {
  label: "Test funding",
  accountHolder: "Example Organization",
  bankName: "Example Bank",
  countryCode: "GB",
  currency: "GBP",
  accountType: "IBAN",
  accountNumber: "GB82 WEST 1234 5698 7654 32",
  routingCode: "",
  swiftCode: "DEUTGB2L",
};

describe("organization bank format checks", () => {
  it("normalizes IBAN and checks mod-97 without claiming ownership or national validation", () => {
    expect(validateBankAccount(input)).toMatchObject({
      accountNumber: "GB82WEST12345698765432",
      formatCheck: "IBAN_CHECKSUM",
    });
    expect(() => validateBankAccount({ ...input, accountNumber: "GB83WEST12345698765432" })).toThrow("checksum");
    expect(() => validateBankAccount({ ...input, countryCode: "DE", swiftCode: "" })).toThrow("match the bank country");
  });
  it.each([
    ["IN", "123456789012", "ABCD0123456", "IN_ACCOUNT_IFSC_FORMAT"],
    ["US", "123456789", "021000021", "US_ABA_CHECKSUM"],
    ["GB", "12345678", "12-34-56", "GB_ACCOUNT_SORT_CODE_FORMAT"],
    ["AU", "123456789", "123-456", "BASIC_FORMAT_ONLY"],
  ])("labels local checks honestly for %s", (countryCode, accountNumber, routingCode, formatCheck) => {
    expect(
      validateBankAccount({ ...input, accountType: "LOCAL", countryCode, accountNumber, routingCode, swiftCode: "" })
        .formatCheck,
    ).toBe(formatCheck);
  });
  it.each([
    ["US", "123456789", "021000022"],
    ["US", "123456789", "000000000"],
    ["IN", "12345678", "ABCD0123456"],
    ["IN", "123456789012", "ABCD1123456"],
    ["GB", "12345678", "12345"],
    ["AU", "123456", ""],
  ])("rejects malformed local details for %s", (countryCode, accountNumber, routingCode) => {
    expect(() =>
      validateBankAccount({ ...input, accountType: "LOCAL", countryCode, accountNumber, routingCode, swiftCode: "" }),
    ).toThrow();
  });
  it("rejects invalid countries, currencies and SWIFT country mismatches", () => {
    expect(() => validateBankAccount({ ...input, countryCode: "EU" })).toThrow("country");
    expect(() => validateBankAccount({ ...input, currency: "ZZZ" })).toThrow("currency");
    expect(() => validateBankAccount({ ...input, swiftCode: "bad" })).toThrow("SWIFT");
    expect(() => validateBankAccount({ ...input, swiftCode: "DEUTDEFF" })).toThrow("country");
  });
  it("validates request fields and bounds without echoing financial values in constraint messages", async () => {
    expect(await validate(plainToInstance(CreateOrganizationBankDto, input))).toHaveLength(0);
    for (const patch of [
      { accountNumber: "" },
      { accountType: "SCRIPT" },
      { accountHolder: " " },
      { routingCode: "a".repeat(65) },
    ]) {
      expect(await validate(plainToInstance(CreateOrganizationBankDto, { ...input, ...patch }))).not.toHaveLength(0);
    }
    expect(
      await validate(
        plainToInstance(ReviewOrganizationBankDto, {
          decision: "ACCEPT",
          evidenceReference: "secure-doc-ref",
          note: "Independently reviewed statement",
        }),
      ),
    ).toHaveLength(0);
    for (const patch of [{ decision: "VERIFIED" }, { evidenceReference: " " }, { note: " " }]) {
      expect(
        await validate(
          plainToInstance(ReviewOrganizationBankDto, {
            decision: "ACCEPT",
            evidenceReference: "ref",
            note: "Reviewed",
            ...patch,
          }),
        ),
      ).not.toHaveLength(0);
    }
  });
});
