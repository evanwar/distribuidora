from pathlib import Path
import argparse
import math

from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser(description="Create contact sheets from PNG pages.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--per-sheet", type=int, default=4)
    args = parser.parse_args()

    pages = sorted(args.input.glob("page-*.png"))
    args.output.mkdir(parents=True, exist_ok=True)

    thumb_width = 510
    gap = 24
    label_height = 34

    for sheet_index in range(math.ceil(len(pages) / args.per_sheet)):
        batch = pages[
            sheet_index * args.per_sheet : (sheet_index + 1) * args.per_sheet
        ]
        thumbnails = []

        for page_path in batch:
            with Image.open(page_path) as source:
                thumb_height = round(source.height * thumb_width / source.width)
                thumb = source.convert("RGB").resize(
                    (thumb_width, thumb_height), Image.Resampling.LANCZOS
                )
                thumbnails.append((page_path.stem, thumb))

        row_height = max(image.height for _, image in thumbnails) + label_height
        canvas = Image.new(
            "RGB",
            (thumb_width * 2 + gap * 3, row_height * 2 + gap * 3),
            "white",
        )
        draw = ImageDraw.Draw(canvas)

        for item_index, (label, image) in enumerate(thumbnails):
            column = item_index % 2
            row = item_index // 2
            x = gap + column * (thumb_width + gap)
            y = gap + row * (row_height + gap)
            draw.text((x, y), label, fill="#17324D")
            canvas.paste(image, (x, y + label_height))

        output_path = args.output / f"sheet-{sheet_index + 1:02d}.png"
        canvas.save(output_path, quality=92)

    print(f"Created {math.ceil(len(pages) / args.per_sheet)} contact sheets.")


if __name__ == "__main__":
    main()
