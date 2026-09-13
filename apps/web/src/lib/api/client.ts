interface FetchOptions extends RequestInit {
    _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: Response) => void;
    reject: (reason?: any) => void;
    url: string;
    options: FetchOptions;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            // Retry with new token
            const newOptions = {
                ...prom.options,
                headers: {
                    ...prom.options.headers,
                    Authorization: `Bearer ${token}`,
                },
            };
            fetch(prom.url, newOptions)
                .then(prom.resolve)
                .catch(prom.reject);
        }
    });

    failedQueue = [];
};

export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
    try {
        const response = await fetch(url, options);

        // If 401 and not already retrying
        if (response.status === 401 && !options._retry) {
            if (isRefreshing) {
                // Wait for ongoing refresh
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject, url, options });
                });
            }

            options._retry = true;
            isRefreshing = true;

            try {
                // Trigger silent refresh
                const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                });

                if (!refreshResponse.ok) {
                    throw new Error('Refresh failed');
                }

                const { accessToken } = await refreshResponse.json();

                // Process queued requests
                processQueue(null, accessToken);

                // Retry original request with new token
                const newOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${accessToken}`,
                    },
                };

                return fetch(url, newOptions);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);

                // Dispatch event for auth provider to handle
                window.dispatchEvent(new CustomEvent('api-error', { detail: { status: 401 } }));

                throw refreshError;
            } finally {
                isRefreshing = false;
            }
        }

        return response;
    } catch (error) {
        throw error;
    }
}

// Convenience wrapper
export async function apiRequest<T>(
    url: string,
    options: FetchOptions = {}
): Promise<{ data: T; response: Response }> {
    const response = await apiFetch(url, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, response };
}