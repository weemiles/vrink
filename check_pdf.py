import fitz
import collections

pdf_path = "/Users/minwoo/Downloads/NAVERWORKS/회사소개서.pdf"
doc = fitz.open(pdf_path)

print(f"Total Pages: {len(doc)}")
print("Has text:", doc[0].get_text() != "")

colors = collections.Counter()
page = doc[0]

for item in page.get_drawings():
    if "color" in item and item["color"]:
        colors[item["color"]] += 1
    if "fill" in item and item["fill"]:
        colors[item["fill"]] += 1

print("Top colors (raw RGB tuple):")
for col, c in colors.most_common(10):
    print(f"{col}: {c}")

images = page.get_images(full=True)
print(f"Images in page 1: {len(images)}")
