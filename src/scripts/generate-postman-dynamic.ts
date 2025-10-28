import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
    method: string;
    path: string;
    handler: string;
    middlewares: string[];
    requiresAuth: boolean;
    requiredRoles?: number[];
    hasValidation?: boolean;
    validationSchema?: string;
}

interface RouteGroup {
    name: string;
    basePath: string;
    routes: RouteInfo[];
    isPublic: boolean;
}

interface PostmanRequest {
    name: string;
    request: {
        method: string;
        header: Array<{
            key: string;
            value: string;
            type: string;
        }>;
        body?: {
            mode: string;
            raw: string;
            options: {
                raw: {
                    language: string;
                };
            };
        };
        url: {
            raw: string;
            host: string[];
            path: string[];
        };
        description?: string;
    };
}

interface PostmanFolder {
    name: string;
    item: (PostmanRequest | PostmanFolder)[];
}

interface PostmanCollection {
    info: {
        name: string;
        description: string;
        schema: string;
    };
    auth: {
        type: string;
        bearer: Array<{
            key: string;
            value: string;
            type: string;
        }>;
    };
    variable: Array<{
        key: string;
        value: string;
        type: string;
    }>;
    item: (PostmanRequest | PostmanFolder)[];
}

class RouteParser {
    private routesDir: string;

    constructor() {
        this.routesDir = path.join(process.cwd(), 'src', 'routes');
    }

    /**
     * Parse a route file and extract route information
     */
    private parseRouteFile(filePath: string): RouteInfo[] {
        const content = fs.readFileSync(filePath, 'utf-8');
        const routes: RouteInfo[] = [];

        // Extract router method calls (GET, POST, PUT, PATCH, DELETE)
        const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*([^)]+)\)/g;
        
        let match;
        while ((match = routeRegex.exec(content)) !== null) {
            const [, method, routePath, middlewareString] = match;
            
            // Parse middlewares from the middleware string
            const middlewares = this.parseMiddlewares(middlewareString);
            
            // Determine if auth is required
            const requiresAuth = middlewares.includes('authenticateToken');
            
            // Check for role requirements
            const requiredRoles = this.extractRequiredRoles(middlewareString);
            
            // Check for validation
            const hasValidation = middlewares.some(m => m.includes('validate'));
            const validationSchema = this.extractValidationSchema(middlewareString);

            // Get handler name
            const handler = this.extractHandler(middlewareString);

            routes.push({
                method: method.toUpperCase(),
                path: routePath,
                handler,
                middlewares,
                requiresAuth,
                requiredRoles,
                hasValidation,
                validationSchema
            });
        }

        return routes;
    }

    /**
     * Parse middleware string to extract individual middlewares
     */
    private parseMiddlewares(middlewareString: string): string[] {
        const middlewares: string[] = [];
        
        // Remove whitespace and split by comma
        const parts = middlewareString.split(',').map(part => part.trim());
        
        for (const part of parts) {
            // Extract function names (remove parentheses and parameters)
            const functionMatch = part.match(/(\w+)(?:\([^)]*\))?/);
            if (functionMatch) {
                middlewares.push(functionMatch[1]);
            }
        }
        
        return middlewares;
    }

    /**
     * Extract required roles from middleware string
     */
    private extractRequiredRoles(middlewareString: string): number[] | undefined {
        const roleMatches = [
            { pattern: /requireAdmin\(\)/, roles: [1] },
            { pattern: /requireAdminOrModerator\(\)/, roles: [1, 2] },
            { pattern: /requireAdminOrModeratorOrUser\(\)/, roles: [1, 2, 3] },
            { pattern: /authorizeRoles\(\[([^\]]+)\]/, roles: null } // Will extract from match
        ];

        for (const { pattern, roles } of roleMatches) {
            const match = middlewareString.match(pattern);
            if (match) {
                if (roles) {
                    return roles;
                } else {
                    // Extract roles from authorizeRoles([1, 2, 3])
                    const roleNumbers = match[1].split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
                    return roleNumbers.length > 0 ? roleNumbers : undefined;
                }
            }
        }

        return undefined;
    }

    /**
     * Extract validation schema name
     */
    private extractValidationSchema(middlewareString: string): string | undefined {
        const validateMatch = middlewareString.match(/validate\((\w+)\)/);
        return validateMatch ? validateMatch[1] : undefined;
    }

    /**
     * Extract handler function name
     */
    private extractHandler(middlewareString: string): string {
        const parts = middlewareString.split(',').map(part => part.trim());
        const lastPart = parts[parts.length - 1];
        
        // Handler is usually the last part without parentheses
        const handlerMatch = lastPart.match(/(\w+)(?!\()/);
        return handlerMatch ? handlerMatch[1] : 'unknown';
    }

    /**
     * Get route group information from route files
     */
    public parseAllRoutes(): RouteGroup[] {
        const routeGroups: RouteGroup[] = [];

        // Read main route files
        const publicRoutesPath = path.join(this.routesDir, 'public.routes.ts');
        const privateRoutesPath = path.join(this.routesDir, 'private.routes.ts');

        // Parse public routes structure
        if (fs.existsSync(publicRoutesPath)) {
            const publicContent = fs.readFileSync(publicRoutesPath, 'utf-8');
            const publicRouteFiles = this.extractRouteFiles(publicContent);
            
            for (const { file, basePath } of publicRouteFiles) {
                const filePath = path.join(this.routesDir, file);
                if (fs.existsSync(filePath)) {
                    const routes = this.parseRouteFile(filePath);
                    if (routes.length > 0) {
                        routeGroups.push({
                            name: this.getGroupName(file, basePath),
                            basePath,
                            routes,
                            isPublic: true
                        });
                    }
                }
            }
        }

        // Parse private routes structure
        if (fs.existsSync(privateRoutesPath)) {
            const privateContent = fs.readFileSync(privateRoutesPath, 'utf-8');
            const privateRouteFiles = this.extractRouteFiles(privateContent);
            
            for (const { file, basePath } of privateRouteFiles) {
                const filePath = path.join(this.routesDir, file);
                if (fs.existsSync(filePath)) {
                    const routes = this.parseRouteFile(filePath);
                    if (routes.length > 0) {
                        routeGroups.push({
                            name: this.getGroupName(file, basePath),
                            basePath,
                            routes,
                            isPublic: false
                        });
                    }
                }
            }
        }

        return routeGroups;
    }

    /**
     * Extract route file imports and their base paths
     */
    private extractRouteFiles(content: string): Array<{ file: string, basePath: string }> {
        const files: Array<{ file: string, basePath: string }> = [];
        
        // Match router.use("/path", routeFile) patterns
        const useRegex = /router\.use\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*(\w+)\s*\)/g;
        
        let match;
        while ((match = useRegex.exec(content)) !== null) {
            const [, basePath, routeVariable] = match;
            
            // Find the import for this route variable
            const importRegex = new RegExp(`import\\s+${routeVariable}\\s+from\\s+["'\`]\\.\\/([^"'\`]+)["'\`]`);
            const importMatch = content.match(importRegex);
            
            if (importMatch) {
                const fileName = importMatch[1] + (importMatch[1].endsWith('.ts') ? '' : '.ts');
                files.push({ file: fileName, basePath });
            }
        }
        
        return files;
    }

    /**
     * Generate a friendly group name from file name and base path
     */
    private getGroupName(fileName: string, basePath: string): string {
        const name = fileName.replace('.routes.ts', '').replace('-', ' ');
        const emoji = this.getEmojiForGroup(name);
        return `${emoji} ${name.charAt(0).toUpperCase() + name.slice(1)}`;
    }

    /**
     * Get emoji for different route groups
     */
    private getEmojiForGroup(name: string): string {
        const emojiMap: { [key: string]: string } = {
            'auth': '🔐',
            'user': '👥',
            'users': '👥',
            'payment-services': '💳',
            'payment services': '💳',
            'offers': '🎯',
            'offers-public': '🌐',
            'offers public': '🌐',
            'roles': '🔑',
            'settings': '⚙️',
            'dictionaries': '📚'
        };
        
        return emojiMap[name.toLowerCase()] || '📋';
    }
}

class PostmanGenerator {
    private routeParser: RouteParser;
    private baseUrl = "{{base_url}}";

    constructor() {
        this.routeParser = new RouteParser();
    }

    /**
     * Generate sample request body based on validation schema
     */
    private generateSampleBody(validationSchema?: string, method?: string, handler?: string): any {
        // Default sample bodies based on common patterns
        const sampleBodies: { [key: string]: any } = {
            // Auth samples
            'loginSchema': {
                body: {
                    username: "admin",
                    password: "password123"
                }
            },
            'registerSchema': {
                body: {
                    username: "newuser",
                    email: "newuser@example.com",
                    password: "password123"
                }
            },
            
            // User samples
            'createUserSchema': {
                body: {
                    username: "newuser",
                    email: "newuser@example.com",
                    password: "password123",
                    roleId: 3
                }
            },
            'updateUserSchema': {
                username: "updatedusername",
                email: "updated@example.com",
                roleId: 3
            },
            
            // Role samples
            'createRoleSchema': {
                body: {
                    name: "New Role"
                }
            },
            
            // Settings samples
            'createSettingSchema': {
                body: {
                    name: "test_setting",
                    value: "test_value",
                    type: "string"
                }
            }
        };

        if (validationSchema && sampleBodies[validationSchema]) {
            return sampleBodies[validationSchema];
        }

        // Generate based on method and handler
        if (method === 'POST' || method === 'PUT') {
            if (handler?.includes('create') || handler?.includes('register')) {
                return { body: { name: "Sample Name", description: "Sample Description" } };
            }
        }

        if (method === 'PATCH' && handler?.includes('update')) {
            return { name: "Updated Name", description: "Updated Description" };
        }

        return undefined;
    }

    /**
     * Create headers for request
     */
    private createHeaders(requiresAuth: boolean, hasBody: boolean): Array<{ key: string; value: string; type: string }> {
        const headers = [];
        
        if (hasBody) {
            headers.push({
                key: "Content-Type",
                value: "application/json",
                type: "text"
            });
        }
        
        if (requiresAuth) {
            headers.push({
                key: "Authorization",
                value: "Bearer {{auth_token}}",
                type: "text"
            });
        }
        
        return headers;
    }

    /**
     * Generate description for request
     */
    private generateDescription(route: RouteInfo, basePath: string): string {
        let description = `${route.method} /api${basePath}${route.path}`;
        
        if (route.requiresAuth) {
            description += " (Authentication required)";
        }
        
        if (route.requiredRoles && route.requiredRoles.length > 0) {
            const roleNames = route.requiredRoles.map(r => {
                switch (r) {
                    case 1: return 'Super_admin';
                    case 2: return 'Admin';
                    case 3: return 'Manager';
                    case 3: return 'User';
                    default: return `Role ${r}`;
                }
            });
            description += ` (Requires: ${roleNames.join(' or ')})`;
        }
        
        if (route.hasValidation) {
            description += " (Input validation applied)";
        }
        
        return description;
    }

    /**
     * Generate friendly request name
     */
    private generateRequestName(route: RouteInfo, basePath: string): string {
        const pathParts = route.path.split('/').filter(p => p);
        const method = route.method;
        
        // Handle common patterns
        if (route.path === '/' || route.path === '') {
            if (method === 'GET') return `Get All ${this.singularToPlural(basePath)}`;
            if (method === 'POST') return `Create ${this.removeSlash(basePath)}`;
            if (method === 'PUT') return `Create ${this.removeSlash(basePath)}`;
        }
        
        if (route.path === '/me') {
            return `Get Current ${this.removeSlash(basePath)}`;
        }
        
        if (route.path.includes('/:id')) {
            if (method === 'GET') return `Get ${this.removeSlash(basePath)} by ID`;
            if (method === 'PATCH') return `Update ${this.removeSlash(basePath)}`;
            if (method === 'DELETE') return `Delete ${this.removeSlash(basePath)}`;
        }
        
        // Handle special endpoints
        if (route.path.includes('/activate')) return `Activate ${this.removeSlash(basePath)}`;
        if (route.path.includes('/deactivate')) return `Deactivate ${this.removeSlash(basePath)}`;
        
        // Default naming
        const action = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
        const resource = pathParts.length > 0 ? pathParts.join(' ') : this.removeSlash(basePath);
        
        return `${action} ${resource}`;
    }

    private removeSlash(path: string): string {
        return path.replace(/^\//, '').replace(/\/$/, '');
    }

    private singularToPlural(word: string): string {
        const singular = this.removeSlash(word);
        if (singular.endsWith('s')) return singular;
        return singular + 's';
    }

    /**
     * Convert route info to Postman request
     */
    private routeToPostmanRequest(route: RouteInfo, basePath: string): PostmanRequest {
        const fullPath = '/api' + basePath + route.path;
        const pathParts = fullPath.split('/').filter(p => p);
        
        const sampleBody = this.generateSampleBody(route.validationSchema, route.method, route.handler);
        const hasBody = sampleBody !== undefined;
        
        const request: PostmanRequest = {
            name: this.generateRequestName(route, basePath),
            request: {
                method: route.method,
                header: this.createHeaders(route.requiresAuth, hasBody),
                url: {
                    raw: `${this.baseUrl}${fullPath}`,
                    host: ["{{base_url}}"],
                    path: pathParts
                },
                description: this.generateDescription(route, basePath)
            }
        };

        if (hasBody) {
            request.request.body = {
                mode: "raw",
                raw: JSON.stringify(sampleBody, null, 2),
                options: {
                    raw: {
                        language: "json"
                    }
                }
            };
        }

        return request;
    }

    /**
     * Generate complete Postman collection
     */
    public generateCollection(): PostmanCollection {
        const routeGroups = this.routeParser.parseAllRoutes();
        
        const collection: PostmanCollection = {
            info: {
                name: "Platezhki Backend API (Auto-Generated)",
                description: `Complete API collection for Platezhki Backend - Generated automatically from route files on ${new Date().toISOString()}`,
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            auth: {
                type: "bearer",
                bearer: [
                    {
                        key: "token",
                        value: "{{auth_token}}",
                        type: "string"
                    }
                ]
            },
            variable: [
                {
                    key: "base_url",
                    value: "http://localhost:3001",
                    type: "string"
                },
                {
                    key: "auth_token",
                    value: "",
                    type: "string"
                }
            ],
            item: []
        };

        // Convert route groups to Postman folders
        for (const group of routeGroups) {
            const folder: PostmanFolder = {
                name: group.name,
                item: []
            };

            for (const route of group.routes) {
                const postmanRequest = this.routeToPostmanRequest(route, group.basePath);
                folder.item.push(postmanRequest);
            }

            if (folder.item.length > 0) {
                collection.item.push(folder);
            }
        }

        return collection;
    }
}

// Main execution
const main = () => {
    try {
        console.log('🚀 Generating dynamic Postman collection from route files...');
        
        const generator = new PostmanGenerator();
        const collection = generator.generateCollection();
        
        const outputPath = path.join(process.cwd(), 'postman-collection.json');
        fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
        
        console.log('✅ Postman collection generated successfully!');
        console.log(`📁 File saved to: ${outputPath}`);
        console.log(`📊 Generated ${collection.item.length} folders with endpoints`);
        
        // Show summary
        let totalRequests = 0;
        for (const item of collection.item) {
            if ('item' in item) {
                totalRequests += item.item.length;
                console.log(`   ${item.name}: ${item.item.length} endpoints`);
            }
        }
        console.log(`📈 Total endpoints: ${totalRequests}`);
        
        console.log('');
        console.log('📋 How to use:');
        console.log('1. Open Postman');
        console.log('2. Click "Import" button');
        console.log('3. Select the generated postman-collection.json file');
        console.log('4. Set the base_url variable to your server URL (default: http://localhost:3001)');
        console.log('5. After login, set the auth_token variable with your JWT token');
        console.log('');
        console.log('🔄 To regenerate after route changes, just run: npm run postman:generate');
        
    } catch (error) {
        console.error('❌ Error generating Postman collection:', error);
        process.exit(1);
    }
};

// Run the script
main();
