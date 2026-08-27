import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const itemsToDelete = [
  'src/components/Tier1',
  'src/components/Tier2',
  'src/components/Tier3',
  'src/components/Common',
  'src/components/DistrictAccess',
  'src/components/Portal',
  'src/components/PresidentAccess',
  'src/components/PublicHome',
  'excel_parser_temp.html'
];

console.log('Cleaning unused legacy files and old non-standard component directories...');
itemsToDelete.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ Deleted legacy path: ${relPath}`);
  }
});
console.log('Clean complete! Clean architecture active in src/components (Layout, Modals, Pages, District).');
