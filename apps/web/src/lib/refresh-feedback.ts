export async function withRefreshFeedback<T>(request: Promise<T>): Promise<T> {
  const minimumDuration = new Promise<void>((resolve) => setTimeout(resolve, 500));
  try {
    return await request;
  } finally {
    await minimumDuration;
  }
}
