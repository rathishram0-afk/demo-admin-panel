import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

src_dir = r"C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src"
matches = []

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(('.js', '.jsx', '.ts', '.tsx')):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                lines = file.readlines()
                for idx, line in enumerate(lines):
                    if re.search(r'Credit Card|paymentMethod|payment_method|paymentBreakdown', line, re.IGNORECASE):
                        matches.append((f, idx + 1, line.strip()))

print(f"Total matching lines found: {len(matches)}\n")
files_map = {}
for file, line_num, content in matches:
    if file not in files_map:
        files_map[file] = []
    files_map[file].append((line_num, content))

for f, list_m in files_map.items():
    print(f"=== File: {f} ({len(list_m)} matches) ===")
    for line_num, content in list_m[:10]:
        print(f"  Line {line_num}: {content}")
    print()
