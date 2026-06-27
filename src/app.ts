import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import routes from "./routes";

// Global BigInt serialization fix — Prisma returns BigInt for columns like trafficVolumeMin/Max
// JSON.stringify does not support BigInt by default, so we patch it globally.
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();

// Enable CORS for all origins with credentials support
app.use(cors({
  origin: true, // Reflects the request origin, allowing all origins with credentials
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Configure body parser with increased limits for file uploads
app.use(express.json({
  limit: '30mb' // Increased from default ~100kb to handle base64 image uploads
}));
app.use(express.urlencoded({
  extended: true,
  limit: '30mb' // Also increase URL-encoded limit for form data
}));

// Parse cookies (for httpOnly device cookie used in active users endpoint)
app.use(cookieParser());

app.use("/uploads", express.static("public/uploads"));

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
