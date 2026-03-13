import fitz  # PyMuPDF
import collections
import json
import os

pdf_path = "/Users/minwoo/Downloads/NAVERWORKS/회사소개서.pdf"

if not os.path.exists(pdf_path):
    print("PDF not found!")
    exit(1)

doc = fitz.open(pdf_path)

fonts = collections.Counter()
font_sizes = collections.Counter()
colors = collections.Counter()
bboxes = []

def rgb_to_hex(r, g, b):
    try:
        r = int(r * 255)
        g = int(g * 255)
        b = int(b * 255)
        return f"#{r:02x}{g:02x}{b:02x}".upper()
    except Exception:
        return "#000000"

# Sample up to 10 pages to avoid long processing
sampled_pages = min(10, len(doc))

for i in range(sampled_pages):
    page = doc[i]
    blocks = page.get_text("dict").get("blocks", [])
    for block in blocks:
        if block.get("type") == 0:  # Text block
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    # Record fonts and sizes
                    font_name = span.get("font", "Unknown")
                    size = round(span.get("size", 0), 1)
                    color = span.get("color", 0)
                    text = span.get("text", "").strip()
                    
                    if text:
                        fonts[font_name] += 1
                        font_sizes[size] += len(text)
                        
                        r = (color >> 16) & 255
                        g = (color >> 8) & 255
                        b = color & 255
                        hex_col = rgb_to_hex(r/255, g/255, b/255)
                        colors[hex_col] += len(text)
                        
                        # Layout
                        bboxes.append({
                            "x0": span["bbox"][0],
                            "y0": span["bbox"][1],
                            "x1": span["bbox"][2],
                            "y1": span["bbox"][3]
                        })

print("Pages Layout Size:", page.rect.width, "x", page.rect.height)
print("--- Top Fonts ---")
for f, c in fonts.most_common(5):
    print(f"{f}: {c}")

print("--- Top Font Sizes ---")
size_data = font_sizes.most_common(10)
size_data.sort(key=lambda x: x[0], reverse=True)
for s, c in size_data:
    print(f"{s}pt: count {c}")

print("--- Top Colors ---")
for col, c in colors.most_common(10):
    print(f"{col}: {c} chars")

# Layout heuristics
if bboxes:
    min_x = min(b["x0"] for b in bboxes)
    max_x = max(b["x1"] for b in bboxes)
    min_y = min(b["y0"] for b in bboxes)
    max_y = max(b["y1"] for b in bboxes)
    width = page.rect.width
    height = page.rect.height
    print("--- Layout / Margins ---")
    print(f"Left Margin: ~{round(min_x, 1)} pts")
    print(f"Right Margin: ~{round(width - max_x, 1)} pts")
    print(f"Top Margin: ~{round(min_y, 1)} pts")
    print(f"Bottom Margin: ~{round(height - max_y, 1)} pts")
