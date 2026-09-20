import os, re

src_dir = r"C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src"

def search_files():
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'cafe' in content.lower() and ('reset' in content.lower() or 'clear' in content.lower() or 'archive' in content.lower()):
                        matches = [line for line in content.split('\n') if 'cafe' in line.lower() and ('reset' in line.lower() or 'clear' in line.lower() or 'archive' in line.lower() or 'setstored' in line.lower())]
                        if matches:
                            print(f"=== {file} ===")
                            for m in matches[:10]:
                                print("  ", m.strip())

search_files()
