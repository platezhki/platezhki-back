import express from "express";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import routes from "./routes";

const app = express();

// Configure body parser with increased limits for file uploads
app.use(express.json({ 
  limit: '30mb' // Increased from default ~100kb to handle base64 image uploads
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '30mb' // Also increase URL-encoded limit for form data
}));

// Custom query parser to handle array parameters like countries[0]=1
app.use((req, res, next) => {
  if (req.query) {
    const parsedQuery: any = {};
    
    for (const [key, value] of Object.entries(req.query)) {
      // Handle array parameters like countries[0]=1
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        if (!parsedQuery[arrayName]) {
          parsedQuery[arrayName] = [];
        }
        // Handle different data types
        const stringValue = value as string;
        
        // Check if this is a boolean field
        const booleanFields = ['legalPerson', 'support247', 'automatics'];
        const isBooleanField = booleanFields.includes(arrayName);
        
        if (stringValue === 'true' || stringValue === 'false') {
          parsedQuery[arrayName][parseInt(index)] = stringValue === 'true';
        } else if (isBooleanField && (stringValue === '1' || stringValue === '0' || stringValue === '2')) {
          // Handle boolean fields with numeric values (1 = true, 0/2 = false)
          parsedQuery[arrayName][parseInt(index)] = stringValue === '1';
        } else if (!isNaN(parseFloat(stringValue))) {
          parsedQuery[arrayName][parseInt(index)] = parseFloat(stringValue);
        } else {
          parsedQuery[arrayName][parseInt(index)] = stringValue;
        }
      } else {
        parsedQuery[key] = value;
      }
    }
    
    // Store parsed query in a custom property
    (req as any).parsedQuery = parsedQuery;
  }
  next();
});

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Platezhki API Documentation"
}));

app.use("/api", routes);

export default app;