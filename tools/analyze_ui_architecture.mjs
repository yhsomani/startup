import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../frontend/src');

// Store all files and their metadata
const fileData = new Map();
const components = new Map();
const pages = new Map();
const layouts = new Map();
const routes = [];

const walkDir = (dir, callback) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, callback);
        } else if (file.match(/\.(tsx|jsx|js|ts)$/)) {
            callback(filePath);
        }
    }
};

const normalizeImportPath = (baseFile, importPath) => {
    if (importPath.startsWith('.')) {
        let absolutePath = path.resolve(path.dirname(baseFile), importPath);
        // Add extensions if needed (brute force)
        if (fs.existsSync(absolutePath + '.tsx')) return absolutePath.replace(/\\/g, '/') + '.tsx';
        if (fs.existsSync(absolutePath + '.ts')) return absolutePath.replace(/\\/g, '/') + '.ts';
        if (fs.existsSync(absolutePath + '.jsx')) return absolutePath.replace(/\\/g, '/') + '.jsx';
        if (fs.existsSync(absolutePath + '.js')) return absolutePath.replace(/\\/g, '/') + '.js';
        if (fs.existsSync(path.join(absolutePath, 'index.tsx'))) return path.join(absolutePath, 'index.tsx').replace(/\\/g, '/');
        // Just return absolute without extension if not found (might be external)
        return absolutePath.replace(/\\/g, '/');
    }
    return importPath; // External like 'react', 'lucide-react'
};

const getRelativePath = (absolutePath) => {
    return absolutePath.replace(SRC_DIR.replace(/\\/g, '/'), '').replace(/^\//, '');
};

// 1. First Pass: Collect all files and extract imports/exports
walkDir(SRC_DIR, (filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = getRelativePath(normalizedPath);
    
    // Extract imports
    const imports = [];
    const importRegex = /import\s+(?:\{([^}]+)\}|([a-zA-Z0-9_*]+)(?:\s+as\s+[a-zA-Z0-9_]+)?)(?:\s*,\s*\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
        const namedImports = (importMatch[1] || importMatch[3] || '').split(',').map(s => s.trim()).filter(Boolean);
        const defaultImport = importMatch[2] ? importMatch[2].trim() : null;
        const source = importMatch[4];
        imports.push({
            source,
            absoluteSource: normalizeImportPath(normalizedPath, source),
            named: namedImports,
            default: defaultImport
        });
    }

    // Rough extraction of component names based on typical React patterns
    // e.g., export const ComponentName = ... OR export function ComponentName(...) OR function ComponentName(...)
    const compRegex1 = /(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)\s*[=:(<]/g;
    const compsInFile = [];
    let compMatch;
    while ((compMatch = compRegex1.exec(content)) !== null) {
        // Simple check if it returns JSX
        const compContent = content.substring(compMatch.index, compMatch.index + 1000); // Check within 1000 chars
        if (compContent.includes('return ') && (compContent.includes('<') || compContent.includes('React.createElement'))) {
            compsInFile.push(compMatch[1]);
        }
    }
    
    // Exclude basic non-components that match the uppercase name (fallback check)
    const validComps = [...new Set(compsInFile)];

    // Basic categorization
    let compType = 'Unknown';
    if (relativePath.includes('pages/')) compType = 'Page';
    else if (relativePath.includes('layouts/')) compType = 'Layout';
    else if (relativePath.includes('components/atoms/')) compType = 'Primitive';
    else if (relativePath.includes('components/molecules/') || relativePath.includes('components/organisms/') || relativePath.includes('components/composites/')) compType = 'Composite';
    else if (relativePath.includes('features/')) compType = 'Feature';
    else if (relativePath.includes('components/')) compType = 'Reusable';

    if (validComps.length > 0) {
        validComps.forEach(comp => {
            const data = {
                name: comp,
                file: relativePath,
                type: compType,
                imports,
                isUsed: false // Will be determined later
            };
            components.set(comp, data);
            
            if (compType === 'Page') pages.set(comp, data);
            else if (compType === 'Layout') layouts.set(comp, data);
        });
    }
    
    fileData.set(relativePath, { imports, components: validComps, content });
});

// 2. Second Pass: Determine dependencies and Usage
const allDependencies = new Map(); // componentName -> list of used component names

for (const [fileRel, data] of fileData) {
    const dependencies = [];
    // Check what local components are imported
    data.imports.forEach(imp => {
        if (!imp.source.startsWith('.')) return; // skip external
        
        // Find if this imported file contains known components
        for (const named of imp.named) {
            if (components.has(named)) {
                dependencies.push(named);
                components.get(named).isUsed = true;
            }
        }
        if (imp.default && components.has(imp.default)) {
            dependencies.push(imp.default);
            components.get(imp.default).isUsed = true;
        }
    });
    
    data.components.forEach(comp => {
        allDependencies.set(comp, dependencies);
    });
}

// Ensure App and main are marked as roots
if (components.has('App')) components.get('App').isUsed = true;
if (components.has('DashboardRedirect')) components.get('DashboardRedirect').isUsed = true;
if (components.has('WebSocketNotificationListener')) components.get('WebSocketNotificationListener').isUsed = true;

// 3. Extract Routes (Looking specifically at App.tsx or files with <Route>)
const appFilePath = 'App.tsx';
if (fileData.has(appFilePath)) {
    const appContent = fileData.get(appFilePath).content;
    const routeRegex = /<Route[^>]+path=["']([^"']+)["'][^>]*element=\{<([A-Za-z0-9_]+)[^>]*>\}/g;
    let rm;
    while ((rm = routeRegex.exec(appContent)) !== null) {
        routes.push({
            path: rm[1],
            element: rm[2]
        });
    }
    
    // Check nested routes or protected routes layout
    const layoutRegex = /<Route[^>]*element=\{<ProtectedRoute[^>]*><([A-Za-z0-9_]+)/g;
    let lm;
    while ((lm = layoutRegex.exec(appContent)) !== null) {
        // rough layout estimation
    }
}

// Generate Markdown
let md = `# UI Architecture Inventory\n\n`;

// Section 1: Pages / Routes
md += `## 1. Pages / Routes\n`;
md += `| Page Component | File Path | Route Path | Components Used (Direct) |\n`;
md += `|---|---|---|---|\n`;
for (const [name, data] of pages.entries()) {
    const routeInfo = routes.find(r => r.element === name);
    const routePath = routeInfo ? routeInfo.path : 'N/A';
    const deps = allDependencies.get(name) || [];
    md += `| \`${name}\` | \`${data.file}\` | \`${routePath}\` | ${deps.length > 0 ? deps.map(d => '\`'+d+'\`').join(', ') : 'None'} |\n`;
}
md += `\n`;

// Section 2: Layout Components
md += `## 2. Layout Components\n`;
md += `| Component | File Path | Used By |\n`;
md += `|---|---|---|\n`;
for (const [name, data] of layouts.entries()) {
    // Find who uses this layout
    const users = [];
    for (const [pName, pDeps] of allDependencies.entries()) {
        if (pDeps.includes(name)) users.push(pName);
    }
    md += `| \`${name}\` | \`${data.file}\` | ${users.length > 0 ? users.map(u => '\`'+u+'\`').join(', ') : 'Unused'} |\n`;
}
md += `\n`;

// Section 3: Feature Components
md += `## 3. Feature Components\n`;
md += `| Component | File Path | Dependencies |\n`;
md += `|---|---|---|\n`;
for (const [name, data] of components.entries()) {
    if (data.type === 'Feature') {
        const deps = allDependencies.get(name) || [];
        md += `| \`${name}\` | \`${data.file}\` | ${deps.length > 0 ? deps.map(d => '\`'+d+'\`').join(', ') : 'None'} |\n`;
    }
}
md += `\n`;

// Section 4: Reusable UI Components
md += `## 4. Reusable UI Components (Primitives & Composites)\n`;
md += `| Component | File Path | Type | Used By (Count) |\n`;
md += `|---|---|---|---|\n`;
for (const [name, data] of components.entries()) {
    if (['Primitive', 'Composite', 'Reusable'].includes(data.type)) {
        let usageCount = 0;
        for (const [pName, pDeps] of allDependencies.entries()) {
            if (pDeps.includes(name)) usageCount++;
        }
        md += `| \`${name}\` | \`${data.file}\` | ${data.type} | ${usageCount} time(s) |\n`;
    }
}
md += `\n`;

// Section 5: Component Dependency Tree (Simplified Text format)
md += `## 5. Component Dependency Tree (Sample Top-Level)\n`;
md += `\`\`\`mermaid\ngraph TD;\n`;
let edges = 0;
const MAX_EDGES = 100;
routes.forEach(route => {
    md += `  Router --> ${route.element};\n`;
});
for (const [name, deps] of allDependencies.entries()) {
    if (deps.length > 0 && edges < MAX_EDGES) {
        deps.forEach(dep => {
            if (edges < MAX_EDGES) {
                // Ensure no special characters break mermaid
                md += `  ${name} --> ${dep};\n`;
                edges++;
            }
        });
    }
}
if (edges >= MAX_EDGES) {
    md += `  %% Output truncated to 100 edges for readability\n`;
}
md += `\`\`\`\n\n`;

// Section 6: Missing / Duplicate / Unused Components
md += `## 6. Unused / Dead Components\n`;
md += `The following components are exported but never imported/used anywhere in the frontend codebase:\n`;
const unusedList = [];
for (const [name, data] of components.entries()) {
    if (!data.isUsed && data.type !== 'Page' && name !== 'App' && name !== 'main' && name !== 'DashboardRedirect' && name !== 'WebSocketNotificationListener' && !name.toLowerCase().includes('icon')) {
        unusedList.push(`- \`${name}\` (Type: ${data.type}, File: \`${data.file}\`)`);
    }
}
if (unusedList.length > 0) {
    md += unusedList.join('\n');
} else {
    md += `None detected! 🎉\n`;
}

// Also check for duplicate names
md += `\n\n### Potential Name Collisions\n`;
const nameCounts = {};
for (const [name, data] of components.entries()) {
    nameCounts[name] = (nameCounts[name] || 0) + 1;
}
let duplicates = [];
for (const [name, count] of Object.entries(nameCounts)) {
    if (count > 1) {
        const files = [...components.values()].filter(c => c.name === name).map(c => c.file);
        duplicates.push(`- \`${name}\` is defined ${count} times across: ${files.join(', ')}`);
    }
}
if (duplicates.length > 0) {
    md += duplicates.join('\n');
} else {
    md += `No component name collisions detected.\n`;
}

// Save output
const outputPath = path.resolve(__dirname, 'ui_architecture.md');
fs.writeFileSync(outputPath, md);
console.log(`Report generated successfully at: ${outputPath}`);
