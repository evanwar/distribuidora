from __future__ import annotations

import argparse
import csv
import json
import math
import unicodedata
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import pandas as pd


def clean(value: object) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return unicodedata.normalize("NFKC", str(value)).strip()


def boolean_text(value: bool) -> str:
    return "true" if value else "false"


def unique_value(base: str, used: set[str], maximum_length: int = 50) -> str:
    candidate = base[:maximum_length]
    sequence = 1
    while candidate.casefold() in used:
        sequence += 1
        suffix = f"~{sequence}"
        candidate = f"{base[: maximum_length - len(suffix)]}{suffix}"
    used.add(candidate.casefold())
    return candidate


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera archivos de importacion desde el catalogo Excel.")
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent / "data")
    args = parser.parse_args()

    workbook = args.workbook.resolve()
    output = args.output.resolve()
    if not workbook.is_file():
        raise FileNotFoundError(f"No existe el Excel: {workbook}")
    output.mkdir(parents=True, exist_ok=True)

    excel = pd.ExcelFile(workbook)
    if len(excel.sheet_names) < 5:
        raise ValueError("El Excel no contiene las hojas de catalogo esperadas.")

    brand_frame = pd.read_excel(workbook, sheet_name=excel.sheet_names[1], header=3).dropna(how="all")
    category_frame = pd.read_excel(workbook, sheet_name=excel.sheet_names[2], header=3).dropna(how="all")
    product_frames: list[pd.DataFrame] = []
    for sheet_name in excel.sheet_names[4:]:
        frame = pd.read_excel(workbook, sheet_name=sheet_name, header=3).dropna(how="all")
        frame["__Hoja"] = sheet_name
        product_frames.append(frame)
    products = pd.concat(product_frames, ignore_index=True)

    brands: list[dict[str, str]] = []
    seen_brands: set[str] = set()
    for _, row in brand_frame.iterrows():
        name = clean(row.iloc[1])
        if not name or name.casefold() in seen_brands:
            continue
        seen_brands.add(name.casefold())
        brands.append(
            {
                "name": name,
                "description": clean(row.iloc[4]),
                "active": "true",
            }
        )

    category_brands: dict[str, dict[str, object]] = {}
    for _, row in category_frame.iterrows():
        brand = clean(row.iloc[1])
        name = clean(row.iloc[2])
        if not name:
            continue
        entry = category_brands.setdefault(name.casefold(), {"name": name, "brands": []})
        if brand and brand not in entry["brands"]:
            entry["brands"].append(brand)
    categories = [
        {
            "name": str(entry["name"]),
            "description": "Marcas de origen: " + ", ".join(entry["brands"]),
            "active": "true",
        }
        for entry in category_brands.values()
    ]

    used_skus: set[str] = set()
    product_rows: list[dict[str, str]] = []
    duplicate_adjustments: list[dict[str, object]] = []
    missing_prices = 0
    for _, row in products.iterrows():
        base_sku = clean(row.iloc[0])
        brand = clean(row.iloc[1])
        category = clean(row.iloc[2])
        original_code = clean(row.iloc[3])
        name = clean(row.iloc[4])
        if not all((base_sku, brand, category, original_code, name)):
            raise ValueError(f"Producto incompleto en hoja {clean(row['__Hoja'])}: {row.to_dict()}")

        sku = unique_value(base_sku, used_skus)
        if sku != base_sku:
            duplicate_adjustments.append(
                {
                    "source_sheet": clean(row["__Hoja"]),
                    "source_row": clean(row.iloc[13]),
                    "base_sku": base_sku,
                    "final_sku": sku,
                    "original_code": original_code,
                }
            )

        details: list[str] = []
        for label, value in (
            ("Atributo C", row.iloc[5]),
            ("Atributo D", row.iloc[6]),
            ("Atributo E", row.iloc[7]),
        ):
            text = clean(value)
            if text:
                details.append(f"{label}: {text}")
        note = clean(row.iloc[12])
        if note:
            details.append(f"Nota de migracion: {note}")

        raw_price = row.iloc[8]
        has_price = not pd.isna(raw_price)
        if has_price:
            price = Decimal(str(raw_price)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if price < 0:
                raise ValueError(f"Precio negativo para {base_sku}: {price}")
        else:
            price = Decimal("0.00")
            missing_prices += 1

        currency = clean(row.iloc[9]).upper()
        if currency != "MXN":
            raise ValueError(f"Moneda no soportada para {base_sku}: {currency}")
        source_status = clean(row.iloc[11])
        active = source_status.casefold() == "activo" and has_price
        product_rows.append(
            {
                "sku": sku,
                "base_sku": base_sku,
                "original_code": original_code,
                "name": name,
                "description": "; ".join(details),
                "brand": brand,
                "category": category,
                "base_price": format(price, ".2f"),
                "active": boolean_text(active),
                "source_status": source_status,
                "source_sheet": clean(row["__Hoja"]),
                "source_row": clean(row.iloc[13]),
            }
        )

    if len(product_rows) != 1726:
        raise ValueError(f"Se esperaban 1726 productos y se encontraron {len(product_rows)}.")
    product_brands = {row["brand"].casefold() for row in product_rows}
    product_categories = {row["category"].casefold() for row in product_rows}
    if not product_brands.issubset(seen_brands):
        raise ValueError("Hay productos con marcas ausentes del catalogo de marcas.")
    if not product_categories.issubset(category_brands):
        raise ValueError("Hay productos con categorias ausentes del catalogo de categorias.")

    write_csv(output / "brands.csv", ["name", "description", "active"], brands)
    write_csv(output / "categories.csv", ["name", "description", "active"], categories)
    write_csv(
        output / "products.csv",
        [
            "sku",
            "base_sku",
            "original_code",
            "name",
            "description",
            "brand",
            "category",
            "base_price",
            "active",
            "source_status",
            "source_sheet",
            "source_row",
        ],
        product_rows,
    )

    report = {
        "source_workbook": workbook.name,
        "brands": len(brands),
        "categories": len(categories),
        "products": len(product_rows),
        "active_products": sum(row["active"] == "true" for row in product_rows),
        "inactive_products": sum(row["active"] == "false" for row in product_rows),
        "missing_prices_mapped_to_zero": missing_prices,
        "duplicate_product_ids_adjusted": len(duplicate_adjustments),
        "duplicate_adjustments": duplicate_adjustments,
        "mapping": {
            "product_sku": "ID_Producto; duplicate IDs receive a deterministic ~N suffix",
            "product_alias": "Codigo",
            "product_name": "Descripcion",
            "product_description": "Atributos C/D/E and Notas_Migracion when present",
            "product_base_price": "Precio_Mayoreo rounded to numeric(18,2)",
            "product_cost": "Not supplied; preserved on update and initialized to 0 on insert",
            "product_minimum_stock": "Not supplied; preserved on update and initialized to 0 on insert",
            "unit": "Pieza (PZ)",
            "currency": "All source prices are MXN; the current product model has no currency column",
        },
    }
    (output / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({key: value for key, value in report.items() if key != "duplicate_adjustments"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
