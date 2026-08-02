import { ENDPOINT_CATALOG } from './endpoint-catalog.generated';

describe('endpoint catalog', () => {
  it('contains the 111 unique frontend operations', () => {
    expect(ENDPOINT_CATALOG).toHaveLength(111);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => operation.id)).size).toBe(111);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => `${operation.method} ${operation.path}`)).size).toBe(
      111,
    );
  });
});
