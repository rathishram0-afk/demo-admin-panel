import os, re

src_dir = r"C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src"

def audit_archive_queries():
    print("=== AUDITING SUPABASE ARCHIVE QUERIES ACROSS CODEBASE ===")
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'cafe_daily_archives' in content or 'gforce_cafe_daily_archives_prod' in content or 'archiveDailyCafeReport' in content:
                        print(f"\n--- FILE: {file} ---")
                        for i, line in enumerate(content.split('\n'), 1):
                            if any(k in line for k in ['cafe_daily_archives', 'insert', 'update', 'delete', 'upsert', 'archiveDailyCafeReport', 'setStoredCafeArchives']):
                                print(f"  Line {i}: {line.strip()}")

audit_archive_queries()
