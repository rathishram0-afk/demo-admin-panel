import fs from 'fs';
import path from 'path';

function searchInDir(dir, searchTerms) {
  const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  files.forEach(file => {
    if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      const fullPath = path.join(file.parentPath || file.path || dir, file.name);
      const content = fs.readFileSync(fullPath, 'utf8');
      searchTerms.forEach(term => {
        if (content.includes(term)) {
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(term)) {
              console.log(`[${term}] ${fullPath}:${idx + 1}: ${line.trim()}`);
            }
          });
        }
      });
    }
  });
}

searchInDir('src', ['getDashboardMetrics', 'getTodaySummary', 'todayRevenue', 'getHistoricalReports']);
