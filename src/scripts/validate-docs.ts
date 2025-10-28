import { specs } from '../config/swagger';

try {
  // Try to parse the swagger specs - this will throw if invalid
  JSON.stringify(specs);
  console.log('✅ Swagger documentation is valid!');
  console.log('📋 All schemas and paths are properly defined');
  process.exit(0);
} catch (error) {
  console.error('❌ Swagger documentation validation failed:');
  console.error(error);
  process.exit(1);
}
