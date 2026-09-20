import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

src_dir = r"C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src"
target_files = [
    'BookingModule.jsx',
    'WalkInSessionModule.jsx',
    'CafeOrdersModule.jsx',
    'ReportsModule.jsx',
    'CafeReportsSection.jsx',
    'BookingDetailsModal.jsx',
    'ConvertBookingModal.jsx'
]

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f in target_files:
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                lines = file.readlines()
                print(f"=== File: {f} ===")
                for idx, line in enumerate(lines):
                    if any(term in line.lower() for term in ['payment', 'method', 'upi', 'cash', 'credit card', 'debit card']):
                        print(f"  L{idx+1}: {line.strip()}")
                print()
