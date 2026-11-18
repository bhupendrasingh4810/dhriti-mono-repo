import { BadRequestException, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../../../config/config.service";

/** Delegate all code, JWT signature/issuer/audience, nonce and PKCE validation to openid-client. */
@Injectable()
export class OidcProviderService {
  constructor(private readonly config: ApiConfigService) {}

  async discover(issuer: string, clientId: string, clientSecret: string) {
    const url = new URL(issuer);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !this.config.oidcAllowedIssuers.includes(issuer)
    ) {
      throw new BadRequestException("OIDC issuer is not approved by the platform operator");
    }
    const oidc = await import("openid-client");
    const allowedOrigins = new Set(this.config.oidcAllowedIssuers.map((entry) => new URL(entry).origin));
    const configuration = await oidc.discovery(url, clientId, clientSecret, undefined, {
      // Token-endpoint TLS validation alone is insufficient for our signed-ID-token contract.
      execute: [oidc.enableNonRepudiationChecks],
      timeout: 10,
      [oidc.customFetch]: async (input, options) => {
        const target = new URL(input);
        if (target.protocol !== "https:" || target.username || target.password || !allowedOrigins.has(target.origin)) {
          throw new BadRequestException("OIDC endpoint origin is not approved");
        }
        const body = options.body instanceof Uint8Array ? new Uint8Array(options.body).buffer : options.body;
        return fetch(input, { ...options, body, redirect: "error", signal: AbortSignal.timeout(10000) });
      },
    });
    return { oidc, configuration };
  }
}
