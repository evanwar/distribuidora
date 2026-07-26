import { ENDPOINT_CATALOG } from './endpoint-catalog.generated';

describe('endpoint catalog', () => {
  it('contains the 109 unique backend operations', () => {
    expect(ENDPOINT_CATALOG).toHaveLength(109);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => operation.id)).size).toBe(109);
    expect(new Set(ENDPOINT_CATALOG.map((operation) => `${operation.method} ${operation.path}`)).size).toBe(
      109,
    );
  });
});
