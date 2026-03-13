import fs from 'fs';
import path from 'path';
import { Project, SyntaxKind, TypeFormatFlags } from 'ts-morph';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const TSCONFIG_PATH = path.join(FRONTEND_DIR, 'tsconfig.json');

console.log('Initializing ts-morph project...');
const project = new Project({
  tsConfigFilePath: TSCONFIG_PATH,
  skipAddingFilesFromTsConfig: true,
});

// Explicitly add all ts, tsx, js, jsx files in the src directory
project.addSourceFilesAtPaths(path.join(FRONTEND_DIR, 'src/**/*.{ts,tsx,js,jsx}'));

const sourceFiles = project.getSourceFiles();
console.log(`Analyzing ${sourceFiles.length} source files...`);

const components = new Map();
const routes = [];
const allDependencies = new Map();

// Helper to determine component type from path
const getComponentType = (filePath) => {
    const rel = filePath.replace(/\\/g, '/');
    if (rel.includes('pages/')) return 'Page';
    if (rel.includes('layouts/')) return 'Layout';
    if (rel.includes('components/atoms/')) return 'Primitive';
    if (rel.includes('components/molecules/') || rel.includes('components/organisms/') || rel.includes('components/composites/')) return 'Composite';
    if (rel.includes('features/')) return 'Feature';
    if (rel.includes('components/')) return 'Reusable';
    return 'Unknown';
};

// 1. First Pass: Identify all UI components and their props
sourceFiles.forEach(sourceFile => {
    const filePath = sourceFile.getFilePath();
    if (!filePath.match(/\.(tsx|jsx)$/) && !filePath.match(/App\.(ts|tsx)$/)) return;
    
    const relPath = path.relative(path.join(FRONTEND_DIR, 'src'), filePath).replace(/\\/g, '/');
    const compType = getComponentType(relPath);

    // Look for exported declarations (functions, variables)
    const exportAssigments = sourceFile.getExportedDeclarations();
    
    for (const [name, declarations] of exportAssigments) {
        if (!/^[A-Z]/.test(name)) continue; // Convention: components start with uppercase
        
        let isComponent = false;
        let props = [];

        for (const decl of declarations) {
            // Variable Declaration (const MyComp = ...)
            if (decl.getKind() === SyntaxKind.VariableDeclaration) {
                const init = decl.getInitializer();
                if (init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
                    isComponent = true;
                    const params = init.getParameters();
                    if (params.length > 0) {
                        try { props = params[0].getType().getProperties().map(p => p.getName()); } catch (e) {}
                    }
                }
            } 
            // Function Declaration (function MyComp() {})
            else if (decl.getKind() === SyntaxKind.FunctionDeclaration) {
                isComponent = true;
                const params = decl.getParameters();
                if (params.length > 0) {
                    try { props = params[0].getType().getProperties().map(p => p.getName()); } catch (e) {}
                }
            }
        }

        if (isComponent) {
            components.set(name, {
                name,
                file: relPath,
                type: compType,
                props: props,
                isUsed: false
            });
        }
    }
});

// 2. Second Pass: Determine parent-child dependencies
sourceFiles.forEach(sourceFile => {
    const filePath = sourceFile.getFilePath();
    if (!filePath.match(/\.(tsx|jsx)$/) && !filePath.match(/App\.(ts|tsx)$/)) return;

    // Find what components this file defines
    const definedHere = [];
    const exportAssigments = sourceFile.getExportedDeclarations();
    for (const [name, declarations] of exportAssigments) {
        if (components.has(name)) definedHere.push(name);
    }
    
    // Now extract all JSX elements used in this file
    const jsxElements = new Set();
    sourceFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.JsxOpeningElement || node.getKind() === SyntaxKind.JsxSelfClosingElement) {
            const tagName = node.getTagNameNode().getText();
            if (/^[A-Z]/.test(tagName) && components.has(tagName)) {
                jsxElements.add(tagName);
                components.get(tagName).isUsed = true;
            }
        }
    });

    definedHere.forEach(comp => {
        allDependencies.set(comp, Array.from(jsxElements).filter(d => d !== comp));
    });
});

// App, main, etc are roots
['App', 'DashboardRedirect', 'WebSocketNotificationListener', 'GlobalLayout'].forEach(root => {
    if (components.has(root)) components.get(root).isUsed = true;
});

// 3. Extract routes from App.tsx
const appFile = sourceFiles.find(sf => sf.getBaseName() === 'App.tsx');
if (appFile) {
    appFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.JsxSelfClosingElement || node.getKind() === SyntaxKind.JsxOpeningElement) {
            const tagName = node.getTagNameNode().getText();
            if (tagName === 'Route') {
                const attributes = node.getAttributes();
                let routePath = 'N/A';
                let elementComp = 'N/A';
                let isProtectedRoute = false;
                
                attributes.forEach(attr => {
                    if (attr.getKind() === SyntaxKind.JsxAttribute) {
                        const name = attr.getNameNode().getText();
                        if (name === 'path') {
                            const init = attr.getInitializer();
                            if (init && init.getKind() === SyntaxKind.StringLiteral) {
                                routePath = init.getLiteralText();
                            }
                        } else if (name === 'element') {
                            const init = attr.getInitializer();
                            if (init && init.getKind() === SyntaxKind.JsxExpression) {
                                // Extract the component name inside element={<Comp />}
                                const expr = init.getExpression();
                                if (expr) {
                                    // Check if wrapped in ProtectedRoute
                                    let content = expr.getText();
                                    if (content.includes('<ProtectedRoute')) {
                                        isProtectedRoute = true;
                                        // Extract inner component: <ProtectedRoute><Child/></ProtectedRoute>
                                        const match = content.match(/<([A-Z][A-Za-z0-9_]+)/g);
                                        if (match && match.length > 1) {
                                            elementComp = match[match.length - 1].replace('<', '');
                                        }
                                    } else {
                                        const match = content.match(/<([A-Z][A-Za-z0-9_]+)/);
                                        if (match) elementComp = match[1];
                                    }
                                }
                            }
                        }
                    }
                });
                if (elementComp !== 'N/A') {
                    routes.push({ path: routePath, element: elementComp, protected: isProtectedRoute });
                }
            }
        }
    });
}

// 4. Generate Markdown
let md = `# UI Architecture Inventory\n\n`;

// Section 1: Pages / Routes
md += `## 1. Pages / Routes\n`;
md += `| Page Component | File Path | Route Path | Protected | Components Used (Direct) |\n`;
md += `|---|---|---|---|---|\n`;
for (const [name, data] of components.entries()) {
    if (data.type === 'Page' || routes.some(r => r.element === name)) {
        const routeInfo = routes.find(r => r.element === name);
        const routePath = routeInfo ? routeInfo.path : 'N/A';
        const isProt = routeInfo ? (routeInfo.protected ? 'Yes' : 'No') : 'N/A';
        const deps = allDependencies.get(name) || [];
        md += `| \`${name}\` | \`${data.file}\` | \`${routePath}\` | ${isProt} | ${deps.length > 0 ? deps.map(d => '\`'+d+'\`').join(', ') : 'None'} |\n`;
    }
}
md += `\n`;

// Section 2: Layout Components
md += `## 2. Layout Components\n`;
md += `| Component | File Path | Purpose | Used By |\n`;
md += `|---|---|---|---|\n`;
for (const [name, data] of components.entries()) {
    if (data.type === 'Layout') {
        const users = [];
        for (const [pName, pDeps] of allDependencies.entries()) {
            if (pDeps.includes(name)) users.push(pName);
        }
        md += `| \`${name}\` | \`${data.file}\` | Layout Wrapper | ${users.length > 0 ? users.map(u => '\`'+u+'\`').join(', ') : 'Unused'} |\n`;
    }
}
md += `\n`;

// Section 3: Feature Components
md += `## 3. Feature Components\n`;
md += `| Component | File Path | Used By | Dependencies |\n`;
md += `|---|---|---|---|\n`;
for (const [name, data] of components.entries()) {
    if (data.type === 'Feature') {
        const deps = allDependencies.get(name) || [];
        const users = [];
        for (const [pName, pDeps] of allDependencies.entries()) {
            if (pDeps.includes(name)) users.push(pName);
        }
        md += `| \`${name}\` | \`${data.file}\` | ${users.length > 0 ? users.map(u => '\`'+u+'\`').join(', ') : 'Unused'} | ${deps.length > 0 ? deps.map(d => '\`'+d+'\`').join(', ') : 'None'} |\n`;
    }
}
md += `\n`;

// Section 4: Reusable UI Components
md += `## 4. Reusable UI Components (Primitives & Composites)\n`;
md += `| Component | File Path | Type | Props | Used By (Count) |\n`;
md += `|---|---|---|---|---|\n`;
for (const [name, data] of components.entries()) {
    if (['Primitive', 'Composite', 'Reusable'].includes(data.type)) {
        let usageCount = 0;
        for (const [pName, pDeps] of allDependencies.entries()) {
            if (pDeps.includes(name)) usageCount++;
        }
        const propsStr = data.props.length > 0 ? data.props.join(', ') : 'None';
        md += `| \`${name}\` | \`${data.file}\` | ${data.type} | \`${propsStr}\` | ${usageCount} time(s) |\n`;
    }
}
md += `\n`;

// Section 5: Component Dependency Tree
md += `## 5. Component Dependency Tree\n`;
md += `\`\`\`mermaid\ngraph TD;\n`;
let edges = 0;
const MAX_EDGES = 150;
routes.forEach(route => {
    md += `  Router --> ${route.element};\n`;
});
for (const [name, deps] of allDependencies.entries()) {
    if (deps.length > 0 && edges < MAX_EDGES) {
        deps.forEach(dep => {
            if (edges < MAX_EDGES) {
                md += `  ${name} --> ${dep};\n`;
                edges++;
            }
        });
    }
}
if (edges >= MAX_EDGES) {
    md += `  %% Output truncated to 150 edges for readability\n`;
}
md += `\`\`\`\n\n`;

// Section 6: Missing / Duplicate / Unused Components
md += `## 6. Unused / Dead Components\n`;
md += `The following components are exported but never imported/used anywhere in the frontend codebase:\n`;
const unusedList = [];
for (const [name, data] of components.entries()) {
    if (!data.isUsed && data.type !== 'Page' && !routes.find(r => r.element === name) && name !== 'App' && name !== 'DashboardRedirect' && name !== 'WebSocketNotificationListener' && !name.toLowerCase().includes('icon')) {
        unusedList.push(`- \`${name}\` (Type: ${data.type}, File: \`${data.file}\`)`);
    }
}
if (unusedList.length > 0) {
    md += unusedList.join('\n');
} else {
    md += `None detected! 🎉\n`;
}

md += `\n\n### Potential Name Collisions\n`;
const nameCounts = {};
for (const [name, data] of components.entries()) {
    nameCounts[name] = (nameCounts[name] || 0) + 1;
}
let duplicates = [];
for (const [name, count] of Object.entries(nameCounts)) {
    if (count > 1) {
        // Find which files they belong to (simplified logic)
        duplicates.push(`- \`${name}\` is defined ${count} times`);
    }
}
if (duplicates.length > 0) {
    md += duplicates.join('\n');
} else {
    md += `No component name collisions detected.\n`;
}

const outputPath = path.resolve(__dirname, 'ui_architecture.md');
fs.writeFileSync(outputPath, md);
console.log(`Report generated successfully at: ${outputPath}`);
