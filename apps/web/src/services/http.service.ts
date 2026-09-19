export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function getErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (!body || typeof body !== 'object') {
    return fallback;
  }

  const value = body as {
    message?: string | string[];
    error?: string | {
      message?: string | string[];
      details?: {
        fields?: string[];
      };
    };
  };

  if (Array.isArray(value.message)) {
    return value.message.join(', ');
  }

  if (typeof value.message === 'string') {
    return value.message;
  }

  if (typeof value.error === 'string') {
    return value.error;
  }

  if (value.error?.details?.fields?.length) {
    return value.error.details.fields.join(', ');
  }

  if (Array.isArray(value.error?.message)) {
    return value.error.message.join(', ');
  }

  return value.error?.message || fallback;
}

let unauthorizedRedirectInProgress = false;

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  fallbackError = 'Request failed.',
): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  const body = response.status === 204
    ? undefined
    : await response.json().catch(() => undefined);

  if (response.status === 401 && !url.startsWith('/api/auth/')) {
    if (
      typeof window !== 'undefined' &&
      !unauthorizedRedirectInProgress
    ) {
      unauthorizedRedirectInProgress = true;

      const currentPath =
        `${window.location.pathname}${window.location.search}`;

      const loginUrl = new URL(
        '/login',
        window.location.origin,
      );

      loginUrl.searchParams.set(
        'callbackUrl',
        currentPath,
      );

      window.location.assign(
        loginUrl.pathname + loginUrl.search,
      );
    }

    throw new ApiRequestError(
      'Your session has expired.',
      401,
      body,
    );
  }

  if (!response.ok) {
    throw new ApiRequestError(
      getErrorMessage(body, fallbackError),
      response.status,
      body,
    );
  }

  return body as T;
}