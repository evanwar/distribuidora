import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const matrixPath = resolve(
  projectRoot,
  '../frontend_agent_prompts_mostrador_angular_responsive_material/06_MATRIZ_ENDPOINTS_FRONTEND.md',
);
const outputPath = resolve(projectRoot, 'src/app/core/api/endpoint-catalog.generated.ts');
const lines = readFileSync(matrixPath, 'utf8').split(/\r?\n/);

let moduleKey = 'F0';
let moduleLabel = 'Bootstrap';
const operations = [];

for (const line of lines) {
  const heading = line.match(/^## (F\d+) - (.+?)(?: \(\d+\))?$/);
  if (heading) {
    moduleKey = heading[1];
    moduleLabel = heading[2];
    continue;
  }

  const row = line.match(
    /^\| ([A-Z]{3}-\d{2}) \| `([A-Z]+) ([^`]+)` \| (.+) \|$/,
  );
  if (!row) continue;
  operations.push({
    id: row[1],
    method: row[2],
    path: row[3],
    description: row[4],
    module: moduleKey,
    moduleLabel,
  });
}

if (operations.length !== 128) {
  throw new Error(`Se esperaban 128 operaciones y se encontraron ${operations.length}.`);
}

const source = `// Generado desde 06_MATRIZ_ENDPOINTS_FRONTEND.md. No editar manualmente.
export type ApiMethod = 'GET' | 'POST' | 'PUT';

export interface EndpointDefinition {
  readonly id: string;
  readonly method: ApiMethod;
  readonly path: string;
  readonly description: string;
  readonly module: string;
  readonly moduleLabel: string;
}

export const ENDPOINT_CATALOG: readonly EndpointDefinition[] = ${JSON.stringify(operations, null, 2)} as const;
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, source, 'utf8');
console.log(`Catálogo generado: ${operations.length} operaciones.`);
