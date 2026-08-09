import { ENDPOINT_CATALOG } from './endpoint-catalog.generated';

describe('endpoint catalog', () => {
  it('contains the 128 unique frontend operations', () => {
    expect(ENDPOINT_CATALOG).toHaveLength(128);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => operation.id)).size).toBe(128);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => `${operation.method} ${operation.path}`)).size).toBe(
      128,
    );
  });
});
