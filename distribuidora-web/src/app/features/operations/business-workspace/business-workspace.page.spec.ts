import { ENDPOINT_CATALOG } from '../../../core/api/endpoint-catalog.generated';
import { BUSINESS_FIELDS } from './business-workspace.config';
import { toResultRows } from './business-workspace.page';

describe('business workspace result rows', () => {
  it('renders records from paged API responses instead of pagination metadata', () => {
    const rows = toResultRows(
      {
        items: [
          { id: 'log-1', action: 'Created', status: 'Succeeded' },
          { id: 'log-2', action: 'Updated', status: 'Succeeded' },
        ],
        page: 1,
        pageSize: 50,
        total: 2,
      },
      false,
      'es-MX',
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe('log-1');
    expect(rows[0]?.values).toEqual([
      { label: 'Referencia', value: 'log-1' },
      { label: 'Acción', value: 'Created' },
      { label: 'Estado', value: 'Succeeded' },
    ]);
  });

  it('keeps rendering single-object detail responses', () => {
    const rows = toResultRows({ id: 'record-1', name: 'Registro' }, true, 'en-US');

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('record-1');
  });

  it('configures inputs for every workspace operation that cannot run without them', () => {
    const workspaceModules = new Set(['F01', 'F03', 'F04', 'F06', 'F07', 'F08', 'F09']);
    const operationsThatNeedInputs = ENDPOINT_CATALOG.filter(
      (operation) =>
        workspaceModules.has(operation.module) &&
        !operation.id.startsWith('AUT-') &&
        !operation.id.startsWith('PTR-') &&
        (operation.method !== 'GET' || operation.path.includes('{')),
    );

    const missingConfiguration = operationsThatNeedInputs
      .filter((operation) => !BUSINESS_FIELDS[operation.id]?.length)
      .map((operation) => operation.id);

    expect(missingConfiguration).toEqual([]);
  });
});
