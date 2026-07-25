const openApiUrl = process.argv[2] ?? "http://localhost:8080/swagger/v1/swagger.json";
const response = await fetch(openApiUrl);

if (!response.ok) {
  throw new Error(`Unable to read OpenAPI from ${openApiUrl}: HTTP ${response.status}`);
}

const document = await response.json();
const schemas = document.components?.schemas ?? {};
const variables = new Map([
  ["baseUrl", "http://localhost:8080"],
  ["adminUsername", "admin"],
  ["adminPassword", "change-me"],
  ["accessToken", ""],
  ["refreshToken", ""]
]);

const folderOrder = [
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

const folders = new Map();

function variableName(value) {
  const normalized = String(value ?? "value")
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => character.toUpperCase())
    .replace(/^[^a-zA-Z]+/, "");
  return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

function registerVariable(name, value = "00000000-0000-0000-0000-000000000000") {
  const key = variableName(name);
  if (!variables.has(key)) variables.set(key, value);
  return `{{${key}}}`;
}

function resolveSchema(schema) {
  if (!schema?.$ref) return schema ?? {};
  const name = schema.$ref.split("/").at(-1);
  return schemas[name] ?? {};
}

function sampleString(propertyName, schemaName, schema) {
  const name = propertyName.toLowerCase();

  if (schema.format === "uuid") return registerVariable(propertyName);
  if (schema.format === "date-time") return "2026-01-01T12:00:00Z";
  if (schema.format === "date") return "2026-01-01";
  if (name === "username") return schemaName === "LoginRequest" ? "{{adminUsername}}" : "usuario.demo";
  if (name === "password") return schemaName === "LoginRequest" ? "{{adminPassword}}" : "ChangeMe123!";
  if (name === "refreshtoken") return "{{refreshToken}}";
  if (name.includes("email")) return "demo@example.com";
  if (name.includes("phone")) return "5551234567";
  if (name === "taxid") return "XAXX010101000";
  if (name === "sku") return "SKU-001";
  if (name.includes("barcode")) return "7500000000001";
  if (name === "name") return "Ejemplo";
  if (name.includes("description")) return "Descripción de ejemplo";
  if (name.includes("address")) return "Av. Principal 123";
  if (name === "city") return "Ciudad de México";
  if (name.includes("folio")) return "FOL-0001";
  if (name.includes("reference")) return "REF-0001";
  if (name.includes("reason")) return "Motivo de ejemplo";
  if (name.includes("note")) return "Nota de ejemplo";
  if (name === "code") return "CASH";
  if (name === "key") return "setting.key";
  if (name === "value") return "example";
  if (name === "datatype") return "string";
  if (name === "module") return "General";
  if (name === "action") return "Create";
  if (name === "entityname") return "Entity";
  if (name === "method") return "CASH";
  if (name === "prefix") return "F";
  if (name === "documenttype") return "SALE";
  if (name === "abbreviation") return "PZA";
  return "string";
}

function sampleForSchema(inputSchema, propertyName = "value", schemaName = "", depth = 0) {
  if (!inputSchema || depth > 5) return null;

  if (inputSchema.$ref) {
    const referencedName = inputSchema.$ref.split("/").at(-1);
    return sampleForSchema(resolveSchema(inputSchema), propertyName, referencedName, depth + 1);
  }

  if (inputSchema.example !== undefined) return inputSchema.example;
  if (inputSchema.default !== undefined) return inputSchema.default;
  if (inputSchema.enum?.length) return inputSchema.enum[0];

  if (inputSchema.type === "array") {
    return [sampleForSchema(inputSchema.items, propertyName, schemaName, depth + 1)];
  }

  if (inputSchema.type === "object" || inputSchema.properties) {
    return Object.fromEntries(
      Object.entries(inputSchema.properties ?? {}).map(([name, propertySchema]) => [
        name,
        sampleForSchema(propertySchema, name, schemaName, depth + 1)
      ])
    );
  }

  if (inputSchema.type === "boolean") return true;
  if (inputSchema.type === "integer") return propertyName.toLowerCase().includes("page") ? 1 : 1;
  if (inputSchema.type === "number") return 1;
  return sampleString(propertyName, schemaName, inputSchema);
}

function sampleParameter(parameter, tag) {
  const schema = resolveSchema(parameter.schema);
  const lowerName = parameter.name.toLowerCase();

  if (schema.format === "uuid") {
    const name = lowerName === "id" ? `${tag}Id` : parameter.name;
    return registerVariable(name);
  }

  if (schema.format === "date-time") return "2026-01-01T12:00:00Z";
  if (schema.format === "date") return "2026-01-01";
  if (schema.type === "integer") return lowerName === "pagesize" ? "20" : "1";
  if (schema.type === "boolean") return "true";
  return sampleString(parameter.name, "", schema);
}

function buildPath(path, parameters, tag) {
  let result = path;
  for (const parameter of parameters.filter(item => item.in === "path")) {
    result = result.replace(`{${parameter.name}}`, sampleParameter(parameter, tag));
  }
  return result;
}

function tokenEvents(path, method, tag) {
  const normalized = path.toLowerCase();

  if (normalized.endsWith("/auth/login") || normalized.endsWith("/auth/refresh")) {
    return [{
      listen: "test",
      script: {
        type: "text/javascript",
        exec: [
          "pm.test('Authentication succeeded', function () {",
          "  pm.expect(pm.response.code).to.be.oneOf([200, 201]);",
          "});",
          "const payload = pm.response.json();",
          "if (payload?.data?.accessToken) pm.collectionVariables.set('accessToken', payload.data.accessToken);",
          "if (payload?.data?.refreshToken) pm.collectionVariables.set('refreshToken', payload.data.refreshToken);"
        ]
      }
    }];
  }

  if (normalized.endsWith("/auth/logout")) {
    return [{
      listen: "test",
      script: {
        type: "text/javascript",
        exec: [
          "if (pm.response.code >= 200 && pm.response.code < 300) {",
          "  pm.collectionVariables.unset('accessToken');",
          "  pm.collectionVariables.unset('refreshToken');",
          "}"
        ]
      }
    }];
  }

  if (method === "post") {
    const idVariable = variableName(`${tag}Id`);
    registerVariable(idVariable);
    return [{
      listen: "test",
      script: {
        type: "text/javascript",
        exec: [
          "if (pm.response.code >= 200 && pm.response.code < 300) {",
          "  const payload = pm.response.json();",
          `  if (payload?.data?.id) pm.collectionVariables.set('${idVariable}', payload.data.id);`,
          "}"
        ]
      }
    }];
  }

  return [];
}

function operationName(method, path, operation) {
  if (operation.summary) return operation.summary;
  const suffix = path
    .replace(/^\/api\/v1\//, "")
    .replaceAll(/\{([^}]+)\}/g, ":$1");
  return `${method.toUpperCase()} ${suffix}`;
}

for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const operation = pathItem[method];
    if (!operation) continue;

    const tag = operation.tags?.[0] ?? "Other";
    const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])];
    const resolvedPath = buildPath(path, parameters, tag);
    const query = parameters
      .filter(parameter => parameter.in === "query")
      .map(parameter => ({
        key: parameter.name,
        value: String(sampleParameter(parameter, tag)),
        disabled: !parameter.required,
        description: parameter.description ?? ""
      }));

    const request = {
      method: method.toUpperCase(),
      header: [],
      url: {
        raw: `{{baseUrl}}${resolvedPath}`,
        host: ["{{baseUrl}}"],
        path: resolvedPath.split("/").filter(Boolean),
        ...(query.length ? { query } : {})
      },
      description: operation.description ?? `${method.toUpperCase()} ${path}`
    };

    const isAnonymous = path === "/api/v1/health"
      || path === "/api/v1/auth/login"
      || path === "/api/v1/auth/refresh";

    if (isAnonymous) request.auth = { type: "noauth" };

    const jsonContent = operation.requestBody?.content?.["application/json"];
    if (jsonContent?.schema) {
      request.header.push({ key: "Content-Type", value: "application/json", type: "text" });
      request.body = {
        mode: "raw",
        raw: JSON.stringify(sampleForSchema(jsonContent.schema), null, 2),
        options: { raw: { language: "json" } }
      };
    }

    const item = {
      name: operationName(method, path, operation),
      request,
      response: [],
      event: tokenEvents(path, method, tag)
    };

    if (!folders.has(tag)) folders.set(tag, []);
    folders.get(tag).push(item);
  }
}

const orderedTags = [
  ...folderOrder.filter(tag => folders.has(tag)),
  ...[...folders.keys()].filter(tag => !folderOrder.includes(tag)).sort()
];

const collection = {
  info: {
    _postman_id: "2ed3ec78-4e35-48a5-b55e-5b13c25b15bb",
    name: "Distribuidora API",
    description: "Colección generada desde el contrato OpenAPI del API Distribuidora. Ejecuta Auth > POST auth/login para guardar automáticamente accessToken y refreshToken.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }]
  },
  variable: [...variables.entries()].map(([key, value]) => ({ key, value, type: "string" })),
  item: orderedTags.map(tag => ({
    name: tag,
    description: `Endpoints de ${tag}.`,
    item: folders.get(tag)
  }))
};

process.stdout.write(`${JSON.stringify(collection, null, 2)}\n`);
