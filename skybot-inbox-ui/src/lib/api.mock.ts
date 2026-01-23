export async function mockDelay(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type MockListResponse<T> = {
  items: T[];
  nextCursor?: string | null;
  total?: number;
};
