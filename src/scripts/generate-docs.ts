import fs from 'fs';
import path from 'path';
import { specs } from '../config/swagger';

// Generate Swagger JSON file
const outputPath = path.join(__dirname, '../../docs/swagger.json');
const docsDir = path.dirname(outputPath);
const PORT = process.env.PORT || 3000;

// Create docs directory if it doesn't exist
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write the Swagger spec to JSON file
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));

console.log('✅ Swagger documentation generated successfully!');
console.log(`📄 Documentation saved to: ${outputPath}`);
console.log(`🌐 View documentation at: http://localhost:${PORT}/api-docs`);
console.log(`📋 JSON spec available at: http://localhost:${PORT}/api-docs/swagger.json`);
