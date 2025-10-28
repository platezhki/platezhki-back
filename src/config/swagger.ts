import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

// Load the YAML file
const yamlPath = path.join(__dirname, '../docs/swagger.yaml');
const yamlContent = fs.readFileSync(yamlPath, 'utf8');
const swaggerSpec = yaml.load(yamlContent) as any;

export const specs = swaggerSpec;
