import { ENDPOINT_CATALOG } from './endpoint-catalog.generated';

describe('endpoint catalog', () => {
  it('contains the 116 unique frontend operations', () => {
    expect(ENDPOINT_CATALOG).toHaveLength(116);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => operation.id)).size).toBe(116);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => `${operation.method} ${operation.path}`)).size).toBe(
      116,
    );
  });
});
