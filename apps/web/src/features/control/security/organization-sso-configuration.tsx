"use client";

import { useState } from "react";
import { DhritiButton, DhritiCheckboxField, DhritiPasswordField, DhritiTextField } from "@dhriti/ui";
import { controlPlatformService } from "@/services/control.service";

export function OrganizationSsoConfiguration({
  busy,
  run,
}: {
  busy: boolean;
  run: (action: () => Promise<void>, success: string) => Promise<void>;
}) {
  const [sso, setSso] = useState({ organizationId: "", issuer: "", clientId: "", clientSecret: "", enabled: false });
  const [errors, setErrors] = useState<
    Partial<Record<"organizationId" | "issuer" | "clientId" | "clientSecret", string>>
  >({});
  const [redirectUri, setRedirectUri] = useState("");
  const [secretVisible, setSecretVisible] = useState(false);
  return (
    <details className="mt-4 rounded-xl border border-border bg-surface p-5">
      <summary className="cursor-pointer text-sm font-semibold text-text-primary">
        Organization SSO configuration (OIDC)
      </summary>
      <p className="my-3 text-sm text-text-secondary">
        Only existing active members can sign in. The platform operator must approve the issuer first. MFA-protected
        accounts require the identity provider to return an MFA authentication claim. Re-enter the client secret when
        saving; stored secrets are never displayed.
      </p>
      <form
        noValidate
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const nextErrors: typeof errors = {};
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sso.organizationId.trim()))
            nextErrors.organizationId = "Enter a valid organization ID.";
          try {
            if (new URL(sso.issuer).protocol !== "https:") nextErrors.issuer = "Use an HTTPS issuer URL.";
          } catch {
            nextErrors.issuer = "Enter a valid HTTPS issuer URL.";
          }
          if (!sso.clientId.trim()) nextErrors.clientId = "Client ID is required.";
          if (!sso.clientSecret) nextErrors.clientSecret = "Client secret is required.";
          setErrors(nextErrors);
          if (Object.keys(nextErrors).length) return;
          void run(async () => {
            await controlPlatformService.configureOrganizationOidc(sso.organizationId.trim(), {
              issuer: sso.issuer.trim(),
              clientId: sso.clientId.trim(),
              clientSecret: sso.clientSecret,
              enabled: sso.enabled,
            });
            setSso((current) => ({ ...current, clientSecret: "" }));
          }, "Organization SSO configuration saved");
        }}
      >
        <DhritiTextField
          label="Organization ID"
          required
          disabled={busy}
          value={sso.organizationId}
          error={errors.organizationId}
          onChange={(value) => {
            setSso((current) => ({ ...current, organizationId: value, clientSecret: "" }));
            setRedirectUri("");
          }}
        />
        <div className="flex items-end">
          <DhritiButton
            variant="secondary"
            disabled={busy || !sso.organizationId.trim()}
            onClick={() =>
              void run(async () => {
                const result = await controlPlatformService.organizationOidc(sso.organizationId.trim());
                setRedirectUri(result.redirectUri);
                setSso((current) => ({
                  ...current,
                  issuer: result.configuration?.issuer ?? "",
                  clientId: result.configuration?.clientId ?? "",
                  enabled: result.configuration?.enabled ?? false,
                  clientSecret: "",
                }));
              }, "SSO configuration loaded")
            }
          >
            Load configuration
          </DhritiButton>
        </div>
        <DhritiTextField
          label="Issuer URL"
          required
          disabled={busy}
          value={sso.issuer}
          error={errors.issuer}
          onChange={(value) => setSso((current) => ({ ...current, issuer: value }))}
        />
        <DhritiTextField
          label="Client ID"
          required
          disabled={busy}
          value={sso.clientId}
          error={errors.clientId}
          onChange={(value) => setSso((current) => ({ ...current, clientId: value }))}
        />
        <DhritiPasswordField
          label="Client secret"
          visible={secretVisible}
          onVisibleChange={setSecretVisible}
          required
          disabled={busy}
          value={sso.clientSecret}
          error={errors.clientSecret}
          autoComplete="new-password"
          onChange={(value) => setSso((current) => ({ ...current, clientSecret: value }))}
        />
        <DhritiCheckboxField
          label="Enable organization SSO"
          disabled={busy}
          checked={sso.enabled}
          onChange={(enabled) => setSso((current) => ({ ...current, enabled }))}
        />
        {redirectUri && (
          <p className="break-all text-sm text-text-secondary md:col-span-2">
            Register this callback URL with your provider: {redirectUri}
          </p>
        )}
        <DhritiButton type="submit" disabled={busy}>
          Save SSO configuration
        </DhritiButton>
      </form>
    </details>
  );
}
