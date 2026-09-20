import os

src_dir = r"C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src"
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if 'Modal' in f or 'Order' in f or 'Bill' in f:
            print(os.path.join(root, f))
