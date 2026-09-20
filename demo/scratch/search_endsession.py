with open(r"C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src\services\sessionService.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for idx, line in enumerate(lines):
        if "endSession(" in line or "endSession =" in line or "endSession :" in line:
            print(f"Line {idx+1}: {line.strip()}")
            for k in range(idx, min(idx+60, len(lines))):
                print(f"  L{k+1}: {lines[k].rstrip()}")
