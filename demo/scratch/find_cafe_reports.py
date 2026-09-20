import os

src_dir = r"C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src"

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if 'cafereport' in f.lower() or 'cafe' in f.lower():
            print(os.path.join(root, f))
