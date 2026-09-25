import { ForbiddenException } from "@nestjs/common";

import { OrganizationContextGuard } from "./organization-context.guard";

const organizationId = "11111111-1111-4111-8111-111111111111";

function context(params: Record<string, string> = {}, body: Record<string, unknown> = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ organization: { organizationId, memberId: "member-a", role: "EMPLOYEE" }, params, body }),
    }),
  };
}

describe("OrganizationContextGuard", () => {
  it("accepts matching route and body organization IDs", () => {
    expect(new OrganizationContextGuard().canActivate(context({ organizationId }, { organizationId }) as never)).toBe(
      true,
    );
  });

  it("rejects route or body organization IDs that conflict with the active context", () => {
    const guard = new OrganizationContextGuard();
    expect(() =>
      guard.canActivate(context({ organizationId: "22222222-2222-4222-8222-222222222222" }) as never),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(context({}, { organizationId: "22222222-2222-4222-8222-222222222222" }) as never),
    ).toThrow(ForbiddenException);
  });
});
