\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE staging_brands (
    name text NOT NULL,
    description text NOT NULL,
    active boolean NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE staging_categories (
    name text NOT NULL,
    description text NOT NULL,
    active boolean NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE staging_products (
    sku text NOT NULL,
    base_sku text NOT NULL,
    original_code text NOT NULL,
    name text NOT NULL,
    description text,
    brand text NOT NULL,
    category text NOT NULL,
    base_price numeric(18,2) NOT NULL,
    active boolean NOT NULL,
    source_status text NOT NULL,
    source_sheet text NOT NULL,
    source_row text NOT NULL
) ON COMMIT DROP;

\copy staging_brands FROM '/tmp/catalog-import/brands.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')
\copy staging_categories FROM '/tmp/catalog-import/categories.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')
\copy staging_products FROM '/tmp/catalog-import/products.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

DO $$
BEGIN
    IF (SELECT count(*) FROM staging_brands) <> 12 THEN
        RAISE EXCEPTION 'Catalogo invalido: se esperaban 12 marcas.';
    END IF;
    IF (SELECT count(*) FROM staging_categories) <> 151 THEN
        RAISE EXCEPTION 'Catalogo invalido: se esperaban 151 categorias.';
    END IF;
    IF (SELECT count(*) FROM staging_products) <> 1726 THEN
        RAISE EXCEPTION 'Catalogo invalido: se esperaban 1726 productos.';
    END IF;
    IF EXISTS (SELECT 1 FROM staging_products GROUP BY lower(sku) HAVING count(*) > 1) THEN
        RAISE EXCEPTION 'Catalogo invalido: existen SKU duplicados.';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM catalogs.brands b
        JOIN staging_brands s ON lower(b."Name") = lower(s.name)
        GROUP BY lower(b."Name")
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'La BD contiene marcas duplicadas sin distinguir mayusculas.';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM catalogs.categories c
        JOIN staging_categories s ON lower(c."Name") = lower(s.name)
        GROUP BY lower(c."Name")
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'La BD contiene categorias duplicadas sin distinguir mayusculas.';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM catalogs.products p
        JOIN staging_products s ON lower(p."Sku") = lower(s.sku)
        GROUP BY lower(p."Sku")
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'La BD contiene SKU duplicados sin distinguir mayusculas.';
    END IF;
END $$;

UPDATE catalogs.brands AS target
SET "Description" = NULLIF(source.description, ''),
    "Active" = source.active,
    "IsDeleted" = false,
    "UpdatedAt" = now(),
    "RowVersion" = target."RowVersion" + 1
FROM staging_brands AS source
WHERE lower(target."Name") = lower(source.name);

INSERT INTO catalogs.brands
    ("Id", "Name", "Description", "Active", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "IsDeleted", "RowVersion")
SELECT gen_random_uuid(), source.name, NULLIF(source.description, ''), source.active,
       now(), NULL, NULL, NULL, false, 1
FROM staging_brands AS source
WHERE NOT EXISTS (
    SELECT 1 FROM catalogs.brands target WHERE lower(target."Name") = lower(source.name)
);

UPDATE catalogs.categories AS target
SET "Description" = NULLIF(source.description, ''),
    "Active" = source.active,
    "IsDeleted" = false,
    "UpdatedAt" = now(),
    "RowVersion" = target."RowVersion" + 1
FROM staging_categories AS source
WHERE lower(target."Name") = lower(source.name);

INSERT INTO catalogs.categories
    ("Id", "Name", "Description", "Active", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "IsDeleted", "RowVersion")
SELECT gen_random_uuid(), source.name, NULLIF(source.description, ''), source.active,
       now(), NULL, NULL, NULL, false, 1
FROM staging_categories AS source
WHERE NOT EXISTS (
    SELECT 1 FROM catalogs.categories target WHERE lower(target."Name") = lower(source.name)
);

INSERT INTO catalogs.units
    ("Id", "Name", "Description", "Active", "Abbreviation", "AllowsDecimals", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "IsDeleted", "RowVersion")
SELECT gen_random_uuid(), 'Pieza', 'Unidad predeterminada para el catalogo importado', true, 'PZ', false,
       now(), NULL, NULL, NULL, false, 1
WHERE NOT EXISTS (
    SELECT 1 FROM catalogs.units
    WHERE lower("Name") = 'pieza' OR lower("Abbreviation") = 'pz'
);

UPDATE catalogs.products AS target
SET "Name" = source.name,
    "Description" = COALESCE(NULLIF(source.description, ''), target."Description"),
    "CategoryId" = (
        SELECT c."Id" FROM catalogs.categories c
        WHERE lower(c."Name") = lower(source.category)
        ORDER BY c."IsDeleted", c."CreatedAt", c."Id" LIMIT 1
    ),
    "BrandId" = (
        SELECT b."Id" FROM catalogs.brands b
        WHERE lower(b."Name") = lower(source.brand)
        ORDER BY b."IsDeleted", b."CreatedAt", b."Id" LIMIT 1
    ),
    "UnitId" = (
        SELECT u."Id" FROM catalogs.units u
        WHERE lower(u."Name") = 'pieza' OR lower(u."Abbreviation") = 'pz'
        ORDER BY u."IsDeleted", u."CreatedAt", u."Id" LIMIT 1
    ),
    "BasePrice" = source.base_price,
    "Active" = source.active,
    "IsDeleted" = false,
    "UpdatedAt" = now(),
    "RowVersion" = target."RowVersion" + 1
FROM staging_products AS source
WHERE lower(target."Sku") = lower(source.sku);

INSERT INTO catalogs.products
    ("Id", "Sku", "Name", "Description", "CategoryId", "BrandId", "UnitId", "Barcode",
     "Cost", "BasePrice", "MinimumStock", "Active", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "IsDeleted", "RowVersion")
SELECT gen_random_uuid(), source.sku, source.name, NULLIF(source.description, ''),
       (SELECT c."Id" FROM catalogs.categories c
        WHERE lower(c."Name") = lower(source.category)
        ORDER BY c."IsDeleted", c."CreatedAt", c."Id" LIMIT 1),
       (SELECT b."Id" FROM catalogs.brands b
        WHERE lower(b."Name") = lower(source.brand)
        ORDER BY b."IsDeleted", b."CreatedAt", b."Id" LIMIT 1),
       (SELECT u."Id" FROM catalogs.units u
        WHERE lower(u."Name") = 'pieza' OR lower(u."Abbreviation") = 'pz'
        ORDER BY u."IsDeleted", u."CreatedAt", u."Id" LIMIT 1),
       NULL, 0, source.base_price, 0, source.active,
       now(), NULL, NULL, NULL, false, 1
FROM staging_products AS source
WHERE NOT EXISTS (
    SELECT 1 FROM catalogs.products target WHERE lower(target."Sku") = lower(source.sku)
);

INSERT INTO catalogs.product_aliases
    ("Id", "ProductId", "Alias", "Active", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "IsDeleted", "RowVersion")
SELECT gen_random_uuid(), aliases.product_id, aliases.alias, true,
       now(), NULL, NULL, NULL, false, 1
FROM (
    SELECT p."Id" AS product_id, source.original_code AS alias
    FROM staging_products source
    JOIN catalogs.products p ON lower(p."Sku") = lower(source.sku)
    UNION
    SELECT p."Id" AS product_id, source.base_sku AS alias
    FROM staging_products source
    JOIN catalogs.products p ON lower(p."Sku") = lower(source.sku)
    WHERE source.base_sku <> source.sku
) AS aliases
WHERE aliases.alias <> ''
  AND NOT EXISTS (
      SELECT 1 FROM catalogs.product_aliases existing
      WHERE existing."ProductId" = aliases.product_id
        AND lower(existing."Alias") = lower(aliases.alias)
  );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM staging_products source
        WHERE NOT EXISTS (
            SELECT 1 FROM catalogs.products target
            WHERE lower(target."Sku") = lower(source.sku)
              AND target."IsDeleted" = false
        )
    ) THEN
        RAISE EXCEPTION 'La verificacion detecto productos no importados.';
    END IF;
END $$;

SELECT 'Marcas del Excel presentes' AS concepto, count(*) AS total
FROM staging_brands source
WHERE EXISTS (SELECT 1 FROM catalogs.brands target WHERE lower(target."Name") = lower(source.name) AND NOT target."IsDeleted")
UNION ALL
SELECT 'Categorias del Excel presentes', count(*)
FROM staging_categories source
WHERE EXISTS (SELECT 1 FROM catalogs.categories target WHERE lower(target."Name") = lower(source.name) AND NOT target."IsDeleted")
UNION ALL
SELECT 'Productos del Excel presentes', count(*)
FROM staging_products source
WHERE EXISTS (SELECT 1 FROM catalogs.products target WHERE lower(target."Sku") = lower(source.sku) AND NOT target."IsDeleted")
UNION ALL
SELECT 'Productos activos del Excel', count(*)
FROM staging_products source
JOIN catalogs.products target ON lower(target."Sku") = lower(source.sku)
WHERE target."Active" AND NOT target."IsDeleted";

COMMIT;
