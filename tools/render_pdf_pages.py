from pathlib import Path
import argparse

import pypdfium2 as pdfium


def main() -> None:
    parser = argparse.ArgumentParser(description="Render every PDF page as a PNG.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--scale", type=float, default=1.7)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    document = pdfium.PdfDocument(str(args.pdf.resolve()))

    for index in range(len(document)):
        page = document[index]
        bitmap = page.render(scale=args.scale)
        image = bitmap.to_pil()
        image.save(args.output / f"page-{index + 1:02d}.png")
        page.close()

    document.close()
    print(f"Rendered {index + 1} pages to {args.output.resolve()}")


if __name__ == "__main__":
    main()
