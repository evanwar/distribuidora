const openApiUrl = process.argv[2] ?? "http://localhost:8080/openapi/v1.json";
const response = await fetch(openApiUrl);

if (!response.ok) {
  throw new Error(`Unable to read OpenAPI from ${openApiUrl}: HTTP ${response.status}`);
}

const document = await response.json();
const schemas = document.components?.schemas ?? {};
const methods = ["get", "post", "put", "patch", "delete"];
const anonymousPaths = new Set([
  "/api/v1/health",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh"
]);
const featureOrder = [
  "Health",
  "Auth",
  "Customers",
  "Suppliers",
  "Products",
  "ProductAliases",
  "Categories",
  "Brands",
  "Units",
  "Warehouses",
  "Inventory",
  "Purchases",
  "GoodsReceipts",
  "Sales",
  "AccountsReceivable",
  "CustomerPayments",
  "Reports",
  "Audit",
  "CancellationReasons",
  "OperationalNotes",
  "Logs",
  "Users",
  "Roles",
  "Permissions",
  "Settings",
  "FolioSequences",
  "PaymentMethods",
  "Policies"
];

function slug(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function anchor(value) {
  return slug(value);
}

function refName(schema) {
  return schema?.$ref?.split("/").at(-1);
}

function resolve(schema) {
  const name = refName(schema);
  return name ? schemas[name] ?? {} : schema ?? {};
}

function schemaType(schema, linkModels = true) {
  if (!schema) return "unknown";
  const name = refName(schema);
  if (name) return linkModels ? `[${name}](./MODELS.md#${anchor(name)})` : name;
  if (schema.enum?.length) return schema.enum.map(value => `\`${value}\``).join(" \\| ");
  if (schema.type === "array") return `Array<${schemaType(schema.items, linkModels)}>`;
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "string") {
    if (schema.format === "date-time" || schema.format === "date") return "string (ISO 8601)";
    if (schema.format === "uuid") return "string (UUID)";
    return "string";
  }
  if (schema.type === "object" || schema.properties) return "object";
  return "unknown";
}

function tsType(schema) {
  if (!schema) return "unknown";
  const name = refName(schema);
  if (name) return name;

  let type;
  if (schema.enum?.length) type = schema.enum.map(value => JSON.stringify(value)).join(" | ");
  else if (schema.type === "array") type = `Array<${tsType(schema.items)}>`;
  else if (schema.type === "integer" || schema.type === "number") type = "number";
  else if (schema.type === "boolean") type = "boolean";
  else if (schema.type === "string") type = "string";
  else if (schema.type === "object" && schema.additionalProperties) {
    type = `Record<string, ${tsType(schema.additionalProperties)}>`;
  } else type = "unknown";

  return schema.nullable ? `${type} | null` : type;
}

function exampleString(name, schemaName, schema) {
  const normalized = name.toLowerCase();
  if (schema.format === "uuid") return `{{${name}}}`;
  if (schema.format === "date-time") return "2026-01-01T12:00:00Z";
  if (schema.format === "date") return "2026-01-01";
  if (normalized === "username") return schemaName === "LoginRequest" ? "admin" : "usuario.demo";
  if (normalized === "password") return "********";
  if (normalized === "refreshtoken") return "{{refreshToken}}";
  if (normalized.includes("email")) return "demo@example.com";
  if (normalized.includes("phone")) return "5551234567";
  if (normalized === "taxid") return "XAXX010101000";
  if (normalized === "sku") return "SKU-001";
  if (normalized.includes("barcode")) return "7500000000001";
  if (normalized === "name") return "Ejemplo";
  if (normalized.includes("description")) return "Descripción de ejemplo";
  if (normalized.includes("address")) return "Av. Principal 123";
  if (normalized === "city") return "Ciudad de México";
  if (normalized.includes("reference")) return "REF-0001";
  if (normalized.includes("reason")) return "Motivo de ejemplo";
  if (normalized.includes("note")) return "Nota de ejemplo";
  if (normalized === "code") return "CASH";
  if (normalized === "method") return "CASH";
  if (normalized === "prefix") return "F";
  if (normalized === "documenttype") return "SALE";
  if (normalized === "abbreviation") return "PZA";
  return "string";
}

function exampleForSchema(schema, propertyName = "value", schemaName = "", depth = 0) {
  if (!schema || depth > 5) return null;
  const name = refName(schema);
  if (name) return exampleForSchema(resolve(schema), propertyName, name, depth + 1);
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === "array") return [exampleForSchema(schema.items, propertyName, schemaName, depth + 1)];
  if (schema.type === "object" || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [
        key,
        exampleForSchema(value, key, schemaName, depth + 1)
      ])
    );
  }
  if (schema.type === "boolean") return true;
  if (schema.type === "integer" || schema.type === "number") return 1;
  return exampleString(propertyName, schemaName, schema);
}

function parameterExample(parameter) {
  const schema = resolve(parameter.schema);
  const normalized = parameter.name.toLowerCase();
  if (schema.format === "uuid") return `{{${parameter.name}}}`;
  if (schema.format === "date-time") return "2026-01-01T12:00:00Z";
  if (schema.format === "date") return "2026-01-01";
  if (schema.type === "integer") return normalized === "pagesize" ? "20" : "1";
  if (schema.type === "boolean") return "true";
  return exampleString(parameter.name, "", schema);
}

function successfulResponse(operation) {
  for (const [status, responseDefinition] of Object.entries(operation.responses ?? {})) {
    if (!/^2\d\d$/.test(status)) continue;
    const schema = responseDefinition.content?.["application/json"]?.schema;
    return {
      status,
      description: responseDefinition.description ?? "",
      schema
    };
  }
  return null;
}

function operationTitle(method, path, operation) {
  return operation.summary ?? `${method.toUpperCase()} ${path}`;
}

const features = new Map();
for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
  for (const method of methods) {
    const operation = pathItem[method];
    if (!operation) continue;
    const tag = operation.tags?.[0] ?? "Other";
    if (!features.has(tag)) features.set(tag, []);
    features.get(tag).push({
      path,
      method,
      operation,
      parameters: [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]
    });
  }
}

const orderedFeatures = [
  ...featureOrder.filter(name => features.has(name)),
  ...[...features.keys()].filter(name => !featureOrder.includes(name)).sort()
];

function renderEndpoint(endpoint) {
  const { path, method, operation, parameters } = endpoint;
  const lines = [];
  const title = operationTitle(method, path, operation);
  const bodySchema = operation.requestBody?.content?.["application/json"]?.schema;
  const success = successfulResponse(operation);

  lines.push(`## ${title}`, "");
  lines.push(`\`${method.toUpperCase()} ${path}\``, "");
  lines.push(anonymousPaths.has(path)
    ? "> Autenticación: no requerida."
    : "> Autenticación: `Authorization: Bearer <accessToken>`.", "");

  if (operation.description) lines.push(operation.description, "");

  if (parameters.length) {
    lines.push("### Parámetros", "");
    lines.push("| Nombre | Ubicación | Tipo | Requerido | Ejemplo |", "|---|---|---|---:|---|");
    for (const parameter of parameters) {
      lines.push(
        `| \`${parameter.name}\` | ${parameter.in} | ${schemaType(parameter.schema)} | ${parameter.required ? "Sí" : "No"} | \`${parameterExample(parameter)}\` |`
      );
    }
    lines.push("");
  }

  if (bodySchema) {
    const bodyType = schemaType(bodySchema);
    lines.push("### Body", "", `Tipo: ${bodyType}`, "", "```json");
    lines.push(JSON.stringify(exampleForSchema(bodySchema), null, 2), "```", "");
  }

  if (success) {
    lines.push("### Respuesta exitosa", "");
    lines.push(`- Estado: \`${success.status}\` ${success.description}`.trim());
    if (success.schema) lines.push(`- Tipo: ${schemaType(success.schema)}`);
    lines.push("");
  }

  lines.push("### Estados documentados", "");
  lines.push("| Estado | Significado |", "|---:|---|");
  for (const [status, definition] of Object.entries(operation.responses ?? {})) {
    lines.push(`| ${status} | ${definition.description ?? ""} |`);
  }
  lines.push("", "---", "");
  return lines.join("\n");
}

function renderFeature(name, endpoints) {
  const lines = [
    `# ${name}`,
    "",
    `[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)`,
    "",
    `Total: **${endpoints.length} endpoints**.`,
    "",
    "## Resumen",
    "",
    "| Método | Ruta | Auth |",
    "|---|---|---:|"
  ];

  for (const endpoint of endpoints) {
    lines.push(
      `| \`${endpoint.method.toUpperCase()}\` | \`${endpoint.path}\` | ${anonymousPaths.has(endpoint.path) ? "No" : "Bearer"} |`
    );
  }
  lines.push("", "---", "");
  for (const endpoint of endpoints) lines.push(renderEndpoint(endpoint));
  return `${lines.join("\n").trim()}\n`;
}

function renderModels() {
  const lines = [
    "# Modelos TypeScript",
    "",
    "[← Índice](./README.md)",
    "",
    "Tipos generados desde `components.schemas` del contrato OpenAPI. Los campos marcados con `?` no aparecen como obligatorios en el contrato.",
    ""
  ];

  for (const [name, schema] of Object.entries(schemas).sort(([left], [right]) => left.localeCompare(right))) {
    lines.push(`## ${name}`, "", "```ts");
    if (schema.enum?.length) {
      lines.push(`export type ${name} = ${schema.enum.map(value => JSON.stringify(value)).join(" | ")};`);
    } else if (schema.type === "object" || schema.properties) {
      const required = new Set(schema.required ?? []);
      lines.push(`export interface ${name} {`);
      for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
        const optional = required.has(propertyName) ? "" : "?";
        lines.push(`  ${propertyName}${optional}: ${tsType(propertySchema)};`);
      }
      if (schema.additionalProperties) {
        lines.push(`  [key: string]: ${tsType(schema.additionalProperties)};`);
      }
      lines.push("}");
    } else {
      lines.push(`export type ${name} = ${tsType(schema)};`);
    }
    lines.push("```", "");
  }
  return `${lines.join("\n").trim()}\n`;
}

const indexedFeatures = orderedFeatures.map((name, index) => ({
  name,
  endpoints: features.get(name),
  fileName: `${String(index + 1).padStart(2, "0")}-${slug(name)}.md`
}));

const totalEndpoints = indexedFeatures.reduce((total, feature) => total + feature.endpoints.length, 0);
const readme = `# Contrato del API para frontend

Documentación generada desde OpenAPI para implementar la integración del frontend con Distribuidora API.

- Base URL local: \`http://localhost:8080\`
- Scalar: \`http://localhost:8080/scalar/v1\`
- Endpoints: **${totalEndpoints}**
- Funcionalidades: **${indexedFeatures.length}**
- Modelos: [MODELS.md](./MODELS.md)

## Convenciones

Todas las respuestas JSON siguen conceptualmente este envelope:

\`\`\`ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  message?: string | null;
  errors?: string[] | null;
  correlationId?: string | null;
}
\`\`\`

Las fechas se transportan como strings ISO 8601. Los identificadores son UUID. Los importes y cantidades se transportan como \`number\`.

## Autenticación

1. Enviar credenciales a \`POST /api/v1/auth/login\`.
2. Guardar \`data.accessToken\` y \`data.refreshToken\`.
3. Enviar \`Authorization: Bearer <accessToken>\` en los endpoints protegidos.
4. Renovar la sesión con \`POST /api/v1/auth/refresh\`.
5. Enviar el refresh token a \`POST /api/v1/auth/logout\` al cerrar sesión.

No requieren token: health, login y refresh.

## Manejo de errores

| Estado | Acción sugerida en frontend |
|---:|---|
| 400 | Mostrar errores de validación recibidos en \`errors\`. |
| 401 | Intentar refresh una sola vez; si falla, cerrar sesión. |
| 403 | Mostrar acceso denegado; no reintentar. |
| 404 | Mostrar recurso no encontrado. |
| 409 | Mostrar conflicto de negocio. |
| 422 | Mostrar regla de negocio incumplida. |
| 500 | Mostrar error general y registrar \`correlationId\`. |

## Índice por funcionalidad

| Funcionalidad | Endpoints | Documento |
|---|---:|---|
${indexedFeatures.map(feature => `| ${feature.name} | ${feature.endpoints.length} | [Abrir](./${feature.fileName}) |`).join("\n")}

## Checklist de implementación

- Centralizar \`baseURL\` en una variable de ambiente del frontend.
- Implementar un cliente HTTP único con inyección del Bearer token.
- Evitar ciclos infinitos de refresh usando un único reintento por solicitud.
- Tratar \`204 No Content\` sin intentar deserializar JSON.
- Conservar \`correlationId\` al registrar errores.
- No enviar query parameters opcionales vacíos.
`;

const files = {
  "docs/frontend-api/README.md": readme,
  "docs/frontend-api/MODELS.md": renderModels()
};

for (const feature of indexedFeatures) {
  files[`docs/frontend-api/${feature.fileName}`] = renderFeature(feature.name, feature.endpoints);
}

process.stdout.write(JSON.stringify({
  metadata: {
    totalEndpoints,
    totalFeatures: indexedFeatures.length,
    totalSchemas: Object.keys(schemas).length
  },
  files
}));
