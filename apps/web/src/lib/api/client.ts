interface FetchOptions extends RequestInit {}

export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
    return fetch(url, options);
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