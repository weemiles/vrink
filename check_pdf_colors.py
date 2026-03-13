import fitz
import collections

pdf_path = "/Users/minwoo/Downloads/NAVERWORKS/회사소개서.pdf"
doc = fitz.open(pdf_path)

colors = collections.Counter()
def rgb_to_hex(r, g, b):
    try:
        r = int(r * 255)
        g = int(g * 255)
        b = int(b * 255)
        return f"#{r:02x}{g:02x}{b:02x}".upper()
    except Exception:
        return "#000000"

for page_idx in range(len(doc)):
    page = doc[page_idx]
    for item in page.get_drawings():
        if "color" in item and item["color"]:
            if len(item["color"]) == 3:
                r, g, b = item["color"]
                colors[rgb_to_hex(r, g, b)] += 1
        if "fill" in item and item["fill"]:
            if len(item["fill"]) == 3:
                r, g, b = item["fill"]
                colors[rgb_to_hex(r, g, b)] += 1

print("--- Top Hex Colors from Vectors ---")
for col, c in colors.most_common(20):
    print(f"{col}: {c}")

