import fs from 'fs';
import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../');

console.log('Initializing Deep Static Analysis Engine...');

const project = new Project({
  skipAddingFilesFromTsConfig: true,
});

// Target both frontend and backend codebases, but exclude compiled and cache dirs
project.addSourceFilesAtPaths([
   path.join(ROOT_DIR, 'frontend/src/**/*.{ts,tsx,js,jsx}'),
   path.join(ROOT_DIR, 'backends/**/*.{ts,tsx,js,jsx}'),
   path.join(ROOT_DIR, 'services/**/*.{ts,tsx,js,jsx}'),
   path.join(ROOT_DIR, 'api-gateway/**/*.{ts,tsx,js,jsx}'),
   '!' + path.join(ROOT_DIR, '**/node_modules/**'),
   '!' + path.join(ROOT_DIR, '**/dist/**'),
   '!' + path.join(ROOT_DIR, '**/.next/**'),
   '!' + path.join(ROOT_DIR, '**/build/**'),
   '!' + path.join(ROOT_DIR, '**/coverage/**')
]);

const sourceFiles = project.getSourceFiles();

// ----------- FRONTEND DATA STRUCTURES -----------
const components = new Map();
const routes = [];
const frontendApiCalls = [];

const getComponentType = (filePath) => {
    const rel = filePath.replace(/\\/g, '/');
    if (rel.includes('/pages/') || rel.includes('/views/') || rel.includes('/screens/')) return 'Page';
    if (rel.includes('/layouts/')) return 'Layout Component';
    if (rel.includes('/atoms/') || rel.includes('/ui/')) return 'Primitive UI Component';
    if (rel.includes('/features/') || rel.includes('/modules/')) return 'Feature Component';
    if (rel.includes('/components/')) return 'Reusable UI Component';
    if (rel.includes('/hooks/')) return 'Hook';
    if (rel.includes('/services/') || rel.includes('/api/')) return 'Service';
    if (rel.includes('/store/') || rel.includes('/context/')) return 'State/Context Module';
    if (rel.includes('/utils/') || rel.includes('/lib/')) return 'Utility';
    return 'Module';
};

// ----------- BACKEND DATA STRUCTURES -----------
const backendModules = new Map();
const backendEndpoints = [];


// =========================================================================
// PASS 1: AST Extraction
// =========================================================================
sourceFiles.forEach(sourceFile => {
    const filePath = sourceFile.getFilePath();
    if (filePath.endsWith('.d.ts')) return;
    
    let relPath = filePath.replace(/\\/g, '/');
    const isFrontend = relPath.includes('/frontend/src/');

    if (isFrontend) {
        relPath = relPath.split('/frontend/src/')[1];
        const compType = getComponentType(filePath);
        
        const externalLibs = new Set();
        const internalModules = new Set();
        sourceFile.getImportDeclarations().forEach(imp => {
            const modSpec = imp.getModuleSpecifierValue();
            if (modSpec.startsWith('.')) internalModules.add(modSpec);
            else externalLibs.add(modSpec);
        });

        let stylingMethod = 'CSS Modules / Vanilla CSS';
        if (sourceFile.getText().includes('styled-components')) stylingMethod = 'Styled Components';
        else if (sourceFile.getText().includes('@emotion')) stylingMethod = 'Emotion CSS-in-JS';
        else if (sourceFile.getText().includes('className="') && sourceFile.getText().includes('flex ')) stylingMethod = 'Tailwind CSS';
        const hasCssImport = Array.from(internalModules).some(m => m.endsWith('.css') || m.endsWith('.scss'));

        const exportAssignments = sourceFile.getExportedDeclarations();
        
        for (const [exportName, declarations] of exportAssignments) {
            let name = exportName;
            if (exportName === 'default') {
               const decl = declarations[0];
               name = decl.getName ? decl.getName() : sourceFile.getBaseNameWithoutExtension();
               if (!name) name = sourceFile.getBaseNameWithoutExtension() || 'DefaultExport';
            }
            
            for (const decl of declarations) {
                let isComponent = false;
                let exportType = exportName === 'default' ? "Default" : "Named";
                let nodeToAnalyze = null;
                const text = decl.getText();
                
                if (decl.getKind() === SyntaxKind.VariableDeclaration) {
                    const init = decl.getInitializer();
                    if (init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
                        isComponent = init.getText().includes('return <') || init.getText().includes('return (');
                        if (!isComponent && /^[A-Z]/.test(name)) isComponent = true;
                        nodeToAnalyze = init;
                    } else if (init && init.getKind() === SyntaxKind.CallExpression && init.getText().includes('forwardRef')) {
                        isComponent = true;
                        nodeToAnalyze = init;
                    }
                } else if (decl.getKind() === SyntaxKind.FunctionDeclaration) {
                    isComponent = text.includes('return <') || text.includes('return (');
                    if (!isComponent && /^[A-Z]/.test(name)) isComponent = true;
                    nodeToAnalyze = decl;
                } else if (decl.getKind() === SyntaxKind.ClassDeclaration) {
                    nodeToAnalyze = decl;
                }

                const isHook = name.startsWith('use');
                const shouldAnalyze = isComponent || isHook || ['Service', 'State/Context Module', 'Utility'].includes(compType);

                if (shouldAnalyze && nodeToAnalyze) {
                    const actualCompType = isComponent ? compType : (isHook ? 'Hook' : compType);

                    const profile = {
                        name,
                        file: relPath,
                        fileType: filePath.split('.').pop().toUpperCase(),
                        type: actualCompType,
                        description: decl.getJsDocs ? decl.getJsDocs().map(d => d.getCommentText()).join(' ') : 'No description provided.',
                        exportType,
                        framework: "React",
                        
                        parents: new Set(),
                        children: new Set(),
                        loc: nodeToAnalyze.getEndLineNumber() - nodeToAnalyze.getStartLineNumber() + 1,
                        renders: 'Client', 
                        lazy: sourceFile.getText().includes('lazy('),
                        
                        props: [],
                        propInterface: 'Unknown',
                        
                        eventsEmitted: new Set(),
                        contextUsed: new Set(),
                        
                        localState: new Set(),
                        reducers: new Set(),
                        derivedState: new Set(),
                        refs: new Set(),
                        memos: new Set(),
                        sideEffects: new Set(),
                        
                        storeUsed: externalLibs.has('zustand') ? 'Zustand' : externalLibs.has('react-redux') ? 'Redux' : 'Context/Props',
                        globalStateDeps: new Set(),
                        actionsDispatched: new Set(),
                        
                        apiCalls: new Set(),
                        endpoints: new Set(),
                        methods: new Set(),
                        
                        uiElements: new Set(), 
                        hasLoadState: text.includes('isLoading') || text.includes('loading') || text.includes('isPending'),
                        hasErrorState: text.includes('error') || text.includes('isError'),
                        userInputs: new Set(), 
                        dataDisplayed: new Set(), 
                        dataSourceTypes: new Set(), 
                        
                        externalLibs: Array.from(externalLibs),
                        internalLibs: Array.from(internalModules),
                        stylingMethod,
                        hasCssImport,
                        isUsed: false
                    };

                    // Prop Extraction
                    if (nodeToAnalyze.getParameters) {
                        const params = nodeToAnalyze.getParameters();
                        if (params.length > 0) {
                            try {
                                const pTypeObj = params[0].getType();
                                profile.propInterface = pTypeObj.getText(nodeToAnalyze).replace(/\s+/g, ' ') || 'Unknown';
                                profile.dataSourceTypes.add('Props');
                                if (pTypeObj.getProperties) {
                                    pTypeObj.getProperties().forEach(p => {
                                        const pName = p.getName();
                                        const pValDecl = p.getValueDeclaration();
                                        const pType = pValDecl && pValDecl.getType ? pValDecl.getType().getText().replace(/\s+/g, ' ') : 'any';
                                        const isOptional = p.hasQuestionToken ? p.hasQuestionToken() : false;
                                        profile.props.push({ name: pName, type: pType, optional: isOptional });
                                        if (pName.startsWith('on') && pName.length > 2 && pName[2] === pName[2].toUpperCase()) {
                                            profile.eventsEmitted.add(pName);
                                        }
                                    });
                                }
                            } catch(e) {}
                        }
                    }

                    // Sub-node analysis
                    nodeToAnalyze.forEachDescendant(node => {
                        if (node.getKind() === SyntaxKind.CallExpression) {
                            const callText = node.getExpression().getText();
                            if (callText === 'useState' || callText === 'React.useState') {
                                const parentDef = node.getParentIfKind(SyntaxKind.VariableDeclaration);
                                if (parentDef) profile.localState.add(parentDef.getNameNode().getText());
                            }
                            else if (callText === 'useReducer' || callText === 'React.useReducer') profile.reducers.add('Yes');
                            else if (callText === 'useMemo' || callText === 'React.useMemo') profile.memos.add('Yes');
                            else if (callText === 'useRef' || callText === 'React.useRef') {
                                const parentDef = node.getParentIfKind(SyntaxKind.VariableDeclaration);
                                if (parentDef) profile.refs.add(parentDef.getNameNode().getText());
                            }
                            else if (callText === 'useEffect' || callText === 'useLayoutEffect') profile.sideEffects.add(callText);
                            else if (callText === 'useContext') profile.contextUsed.add(node.getArguments()[0]?.getText() || 'Unknown');
                            
                            else if (callText.includes('useAppSelector') || callText === 'useSelector') {
                                profile.globalStateDeps.add(node.getArguments()[0]?.getText() || 'selector');
                                profile.dataSourceTypes.add('Global Store');
                            }
                            else if (callText.includes('useQuery') || callText.includes('useMutation') || callText.includes('useAuth')) {
                                profile.globalStateDeps.add(callText);
                                profile.dataSourceTypes.add('Global Store');
                            }
                            else if (callText.includes('dispatch')) profile.actionsDispatched.add(node.getArguments()[0]?.getText() || 'action');

                            // Detect API Calls
                            else if (callText === 'fetch' || callText.includes('axios.get') || callText.includes('api.get') || callText.includes('.post') || callText.includes('.put') || callText.includes('.delete') || callText.includes('.patch')) {
                                const argNode = node.getArguments()[0];
                                const argText = argNode ? argNode.getText() : 'Unknown';
                                
                                // Extract Request Payload for Alignment Report
                                let payloadText = 'None';
                                if (node.getArguments().length > 1) {
                                    payloadText = node.getArguments()[1].getText().substring(0, 50).replace(/\n/g, ' ');
                                }

                                if(argText && argText !== 'Unknown') {
                                    profile.apiCalls.add(callText);
                                    profile.dataSourceTypes.add('Backend API');
                                    profile.endpoints.add(argText);
                                    let methodStr = 'GET';
                                    if (callText.includes('post')) methodStr = 'POST';
                                    if (callText.includes('put')) methodStr = 'PUT';
                                    if (callText.includes('delete')) methodStr = 'DELETE';
                                    if (callText.includes('patch')) methodStr = 'PATCH';
                                    profile.methods.add(methodStr);

                                    // Store for Frontend-Backend mapping
                                    frontendApiCalls.push({
                                        component: name,
                                        file: relPath,
                                        method: methodStr,
                                        endpoint: argText.replace(/['"`]/g, '').replace(/\$\{.*?\}/g, ':id'),
                                        payload: payloadText,
                                        expectedRes: 'JSON Object'
                                    });
                                }
                            }
                        }
                        else if (node.getKind() === SyntaxKind.Identifier) {
                            const t = node.getText();
                            if (t === 'localStorage') profile.dataSourceTypes.add('Local Storage');
                            if (t === 'sessionStorage') profile.dataSourceTypes.add('Session Storage');
                            if (t === 'useParams' || t === 'useSearchParams') profile.dataSourceTypes.add('URL Params');
                        }
                        else if (node.getKind() === SyntaxKind.PropertyAccessExpression) {
                            if (node.getText().includes('process.env') || node.getText().includes('import.meta.env')) {
                                profile.dataSourceTypes.add('Environment Variables');
                            }
                        }
                        else if (node.getKind() === SyntaxKind.JsxOpeningElement || node.getKind() === SyntaxKind.JsxSelfClosingElement) {
                            const tagName = node.getTagNameNode().getText();
                            profile.uiElements.add(tagName);
                            if (['input', 'textarea', 'select', 'Form', 'Button'].includes(tagName.toLowerCase()) || tagName.includes('Input') || tagName.includes('Button')) {
                                profile.userInputs.add(tagName);
                            }
                            if (['table', 'ul', 'li', 'Card', 'Typography', 'Text', 'h1', 'p', 'span'].includes(tagName.toLowerCase()) || tagName.includes('Card') || tagName.includes('Table') || tagName.includes('List')) {
                                profile.dataDisplayed.add(tagName);
                            }
                        }
                    });

                    components.set(name, profile);
                }
            }
        }
    } else {
        // ==========================================
        // BACKEND EXTRACTION
        // ==========================================
        const extPath = relPath.split('Startup/TalentSphere/')[1] || relPath;
        
        let type = 'Module';
        if (extPath.includes('controller')) type = 'Controller';
        else if (extPath.includes('service')) type = 'Service';
        else if (extPath.includes('route')) type = 'Route';
        else if (extPath.includes('model') || extPath.includes('schema')) type = 'Model';
        
        const modProfile = {
            name: sourceFile.getBaseNameWithoutExtension(),
            file: extPath,
            type: type,
            endpoints: new Set(),
            methods: new Set(),
            middlewares: new Set(),
            dbUsed: new Set(),
            crudOps: new Set(),
            reqSchemas: new Set(),
            resSchemas: new Set()
        };

        sourceFile.forEachDescendant(node => {
            if (node.getKind() === SyntaxKind.CallExpression) {
                const callExp = node.getExpression();
                if (callExp.getKind() === SyntaxKind.PropertyAccessExpression) {
                    const method = callExp.getName();
                    if (['get', 'post', 'put', 'delete', 'patch', 'use'].includes(method)) {
                        const caller = callExp.getExpression().getText();
                        if (['app', 'router', 'api'].includes(caller) || caller.toLowerCase().includes('router')) {
                            // Endpoint Definition found! Example: router.post('/login', authMiddle, handler)
                            const args = node.getArguments();
                            if (args.length >= 2 && args[0].getKind() === SyntaxKind.StringLiteral) {
                                const routePath = args[0].getLiteralText();
                                const httpMethod = method.toUpperCase();
                                
                                const middlewares = [];
                                for (let i = 1; i < args.length - 1; i++) middlewares.push(args[i].getText());
                                
                                const handler = args[args.length - 1];
                                
                                const reqSchema = new Set();
                                const resSchema = new Set();
                                const dbOps = new Set();
                                
                                // Drill into the handler to map req/res/db ops
                                handler.forEachDescendant(cNode => {
                                    // req.body properties
                                    if (cNode.getKind() === SyntaxKind.PropertyAccessExpression) {
                                        const t = cNode.getText();
                                        if (t.startsWith('req.body.')) reqSchema.add(t.replace('req.body.', ''));
                                        if (t.startsWith('req.query.')) reqSchema.add(t.replace('req.query.', ''));
                                        if (t.startsWith('req.params.')) reqSchema.add(t.replace('req.params.', ''));
                                    }
                                    
                                    // req.body destructuring (const { email, pass } = req.body)
                                    if (cNode.getKind() === SyntaxKind.VariableDeclaration) {
                                        const init = cNode.getInitializer();
                                        if (init && ['req.body', 'req.query', 'req.params'].includes(init.getText())) {
                                            const nameNode = cNode.getNameNode();
                                            if (nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
                                                nameNode.getElements().forEach(el => reqSchema.add(el.getNameNode().getText()));
                                            }
                                        }
                                    }

                                    // Response and DB
                                    if (cNode.getKind() === SyntaxKind.CallExpression) {
                                        const subCallStr = cNode.getExpression().getText();
                                        if (subCallStr.includes('res.json') || subCallStr.includes('res.send')) {
                                            resSchema.add('JSON Payload');
                                            modProfile.resSchemas.add('JSON Payload');
                                        }
                                        // Simple heuristic to detect DB ORM queries
                                        if (subCallStr.includes('.find') || subCallStr.includes('.create') || subCallStr.includes('.update') || subCallStr.includes('.query') || subCallStr.includes('db.') || subCallStr.includes('prisma.') || subCallStr.includes('.save')) {
                                            dbOps.add(subCallStr);
                                            modProfile.crudOps.add(subCallStr);
                                            modProfile.dbUsed.add('Database');
                                        }
                                    }
                                });

                                backendEndpoints.push({
                                    path: routePath,
                                    method: httpMethod,
                                    controller: modProfile.name,
                                    handler: handler.getKind() === SyntaxKind.Identifier ? handler.getText() : 'Inline Async Closure',
                                    middleware: middlewares,
                                    reqSchema: Array.from(reqSchema),
                                    resSchema: Array.from(resSchema),
                                    dbOps: Array.from(dbOps),
                                    authRequired: middlewares.some(m => m.toLowerCase().includes('auth') || m.toLowerCase().includes('verify'))
                                });

                                modProfile.endpoints.add(routePath);
                                modProfile.methods.add(httpMethod);
                                middlewares.forEach(m => modProfile.middlewares.add(m));
                                Array.from(reqSchema).forEach(r => modProfile.reqSchemas.add(r));
                            }
                        }
                    }
                }
            }
        });
        
        backendModules.set(modProfile.name, modProfile);
    }
});

// ==========================================
// POLYGLOT BACKEND EXTRACTION (Java, C#, Python)
// ==========================================
const walkDir = (dir, extFilters, outFiles) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file === 'build' || file === '.git' || file === 'target' || file === 'bin' || file === 'obj' || file === '__pycache__') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath, extFilters, outFiles);
        } else {
            if (extFilters.some(ext => fullPath.endsWith(ext))) {
                outFiles.push(fullPath);
            }
        }
    }
};

const polyglotFiles = [];
walkDir(ROOT_DIR, ['.java', '.cs', '.py'], polyglotFiles);

polyglotFiles.forEach(fullPath => {
    const extPath = fullPath.replace(/\\/g, '/').split('Startup/TalentSphere/')[1] || fullPath;
    const ext = path.extname(fullPath);
    let content = '';
    try { content = fs.readFileSync(fullPath, 'utf8'); } catch(e) { return; }
    
    let isController = false;
    let framework = 'Unknown';
    let type = 'Module';
    
    // Framework Detection
    if (ext === '.java' && (content.includes('@RestController') || content.includes('@Controller'))) {
        isController = true;
        framework = 'Spring Boot';
        type = 'Controller';
    } else if (ext === '.cs' && (content.includes('[ApiController]') || content.includes('ControllerBase'))) {
        isController = true;
        framework = 'ASP.NET Core';
        type = 'Controller';
    } else if (ext === '.py' && (content.includes('@app.route') || content.includes('@bp.route') || content.includes('Flask'))) {
        isController = true;
        framework = 'Flask';
        type = 'Controller';
    } else if (ext === '.java' && content.includes('@Service')) {
        framework = 'Spring Boot'; type = 'Service';
    } else if (ext === '.java' && (content.includes('@Entity') || content.includes('@Table'))) {
        framework = 'Spring Boot'; type = 'Model';
    } else if (ext === '.java' && content.includes('@Repository')) {
        framework = 'Spring Boot'; type = 'Repository';
    } else if (ext === '.cs' && content.includes(': DbContext')) {
        framework = 'ASP.NET Core'; type = 'Repository';
    }
    
    if (framework === 'Unknown' && !isController) return;
    
    const modProfile = {
        name: path.basename(fullPath, ext),
        file: extPath,
        type: type,
        endpoints: new Set(),
        methods: new Set(),
        middlewares: new Set(),
        dbUsed: new Set(),
        crudOps: new Set(),
        reqSchemas: new Set(),
        resSchemas: new Set(),
        framework: framework
    };

    if (isController) {
        let baseRoute = '';
        
        // Java Spring Boot Parsing
        if (framework === 'Spring Boot') {
            const reqMapMatch = content.match(/@RequestMapping\(\s*["']([^"']+)["']/);
            if (reqMapMatch) baseRoute = reqMapMatch[1];
            
            const methodRegex = /@(Get|Post|Put|Delete|Patch)Mapping\(\s*["']?([^"'\)]*)["']?\s*\)\s*(?:@\w+\([^)]+\)\s*)*\s*(?:public|private|protected)\s+[\w<>]+\s+(\w+)\s*\(([^)]*)\)/g;
            let m;
            while ((m = methodRegex.exec(content)) !== null) {
                const httpMethod = m[1].toUpperCase();
                let routePath = baseRoute + (m[2] ? (m[2].startsWith('/') ? m[2] : '/' + m[2]) : '');
                if (routePath.includes('{')) routePath = routePath.replace(/\{[^}]+\}/g, ':id');
                const handlerName = m[3];
                const params = m[4];
                
                const reqSchema = new Set();
                if (params.includes('@RequestBody')) {
                    const reqBodyMatch = params.match(/@RequestBody\s+(\w+)/);
                    if (reqBodyMatch) reqSchema.add(reqBodyMatch[1]);
                }
                
                backendEndpoints.push({
                    path: routePath || '/',
                    method: httpMethod,
                    controller: modProfile.name,
                    handler: handlerName,
                    middleware: [],
                    reqSchema: Array.from(reqSchema),
                    resSchema: ['DTO/JSON'],
                    dbOps: [],
                    authRequired: content.includes('@PreAuthorize') || content.includes('@Secured')
                });
                modProfile.endpoints.add(routePath || '/');
                modProfile.methods.add(httpMethod);
                Array.from(reqSchema).forEach(r => modProfile.reqSchemas.add(r));
            }
        }
        
        // C# ASP.NET Core Parsing
        else if (framework === 'ASP.NET Core') {
            const routeMatch = content.match(/\[Route\(\s*["']([^"']+)["']\s*\)\]/);
            if (routeMatch) baseRoute = routeMatch[1].replace('[controller]', modProfile.name.replace('Controller', '').toLowerCase());
            
            const methodRegex = /\[Http(Get|Post|Put|Delete|Patch)(?:\(\s*["']([^"']+)["']\s*\))?\]\s*(?:\[[^\]]+\]\s*)*(?:public|private|protected)\s+(?:async\s+)?(?:Task<)?[\w<>\[\]]+(?:>)?\s+(\w+)\s*\(([^)]*)\)/g;
            let m;
            while ((m = methodRegex.exec(content)) !== null) {
                const httpMethod = m[1].toUpperCase();
                let extRoute = m[2] ? (m[2].startsWith('/') ? m[2] : '/' + m[2]) : '';
                let routePath = (baseRoute.startsWith('/') ? baseRoute : '/' + baseRoute) + extRoute;
                if (routePath.includes('{')) routePath = routePath.replace(/\{[^}]+\}/g, ':id');
                routePath = routePath.replace('//', '/');
                
                const handlerName = m[3];
                const params = m[4];
                
                const reqSchema = new Set();
                if (params.includes('[FromBody]')) {
                    const reqBodyMatch = params.match(/\[FromBody\]\s+(\w+)/);
                    if (reqBodyMatch) reqSchema.add(reqBodyMatch[1]);
                }
                
                backendEndpoints.push({
                    path: routePath || '/',
                    method: httpMethod,
                    controller: modProfile.name,
                    handler: handlerName,
                    middleware: [],
                    reqSchema: Array.from(reqSchema),
                    resSchema: ['DTO/JSON'],
                    dbOps: [],
                    authRequired: content.includes('[Authorize]')
                });
                modProfile.endpoints.add(routePath || '/');
                modProfile.methods.add(httpMethod);
                Array.from(reqSchema).forEach(r => modProfile.reqSchemas.add(r));
            }
        }
        
        // Python Flask Parsing
        else if (framework === 'Flask') {
            const methodRegex = /@(?:app|bp)\.route\(\s*['"]([^'"]+)['"](?:,\s*methods=\[([^\]]+)\])?\)\s*def\s+(\w+)\s*\(/g;
            let m;
            while ((m = methodRegex.exec(content)) !== null) {
                let routePath = m[1];
                if (routePath.includes('<')) routePath = routePath.replace(/<[^>]+>/g, ':id');
                const methodsStr = m[2] || '"GET"';
                const handlerName = m[3];
                
                let httpMethod = 'GET';
                if (methodsStr.includes('POST')) httpMethod = 'POST';
                else if (methodsStr.includes('PUT')) httpMethod = 'PUT';
                else if (methodsStr.includes('DELETE')) httpMethod = 'DELETE';
                else if (methodsStr.includes('PATCH')) httpMethod = 'PATCH';
                
                backendEndpoints.push({
                    path: routePath,
                    method: httpMethod,
                    controller: modProfile.name,
                    handler: handlerName,
                    middleware: [],
                    reqSchema: ['JSON Derived'],
                    resSchema: ['JSON Payload'],
                    dbOps: [],
                    authRequired: content.includes('@login_required') || content.includes('@jwt_required')
                });
                modProfile.endpoints.add(routePath);
                modProfile.methods.add(httpMethod);
            }
        }
    }
    
    backendModules.set(modProfile.name, modProfile);
});

// 2. Resolve Frontend Hierarchy and Routes
sourceFiles.forEach(sourceFile => {
    if (!sourceFile.getFilePath().replace(/\\/g, '/').includes('/frontend/src/')) return;
    
    const jsxElements = new Set();
    sourceFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.JsxOpeningElement || node.getKind() === SyntaxKind.JsxSelfClosingElement) {
            jsxElements.add(node.getTagNameNode().getText());
        }
    });

    const exportAssignments = sourceFile.getExportedDeclarations();
    for (const [name, declarations] of exportAssignments) {
        let rootName = name === 'default' && declarations[0].getName ? declarations[0].getName() : name;
        if (name === 'default' && !rootName) rootName = sourceFile.getBaseNameWithoutExtension();
        
        if (components.has(rootName)) {
            const comp = components.get(rootName);
            for (const el of jsxElements) {
                if (components.has(el) && el !== rootName) {
                    comp.children.add(el);
                    components.get(el).parents.add(rootName);
                    components.get(el).isUsed = true;
                }
            }
        }
    }
});

const appFile = sourceFiles.find(sf => sf.getBaseName().includes('App.t'));
if (appFile) {
    if (components.has('App')) components.get('App').isUsed = true;
    if (components.has('GlobalLayout')) components.get('GlobalLayout').isUsed = true;
    appFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.JsxSelfClosingElement || node.getKind() === SyntaxKind.JsxOpeningElement) {
            const tagName = node.getTagNameNode().getText();
            if (tagName === 'Route') {
                const attributes = node.getAttributes();
                let routePath = '/';
                let elementComp = 'N/A';
                attributes.forEach(attr => {
                    if (attr.getKind() === SyntaxKind.JsxAttribute) {
                        if (attr.getNameNode().getText() === 'path') {
                            const init = attr.getInitializer();
                            if (init && init.getKind() === SyntaxKind.StringLiteral) routePath = init.getLiteralText();
                        } else if (attr.getNameNode().getText() === 'element') {
                            const init = attr.getInitializer();
                            if (init) {
                                const match = init.getText().match(/<([A-Z][A-Za-z0-9_]+)/g);
                                if (match) elementComp = match[match.length - 1].replace('<', '');
                            }
                        }
                    }
                });
                routes.push({ path: routePath, page: elementComp, layout: 'GlobalLayout' });
            }
        }
    });
}


// =========================================================================
// PASS 2: ALIGNMENT & CONTRACT MATCHING LOGIC
// =========================================================================

// Normalization logic: /api/users/:id <=> /api/users/${id} OR /api/users/123
const normalizePath = (p) => {
    let clean = p.replace(/['"`]/g, '').trim();
    // Replace ${xyz} with :param
    clean = clean.replace(/\$\{[^}]+\}/g, ':id');
    // Just grab the core API path
    if (clean.includes('?')) clean = clean.split('?')[0];
    if (!clean.startsWith('/api')) {
        // e.g. 'users/profile' from an axios instance
        if (clean.startsWith('/')) clean = '/api/v1' + clean;
        else clean = '/api/v1/' + clean;
    }
    return clean;
};

const contractMatches = [];
let mismatchCount = 0;

frontendApiCalls.forEach(fCall => {
    const normFront = normalizePath(fCall.endpoint);
    
    // Attempt to find corresponding backend endpoint handler
    const match = backendEndpoints.find(b => {
        const normBack = normalizePath(b.path);
        // Fuzzy comparison (very basic inference of alignment by shared path signature)
        const backCore = normBack.replace(/:[a-zA-Z0-9_]+/g, '').replace('//','/').replace(/\/$/,'');
        const frontCore = normFront.replace(/:[a-zA-Z0-9_]+/g, '<id>').replace('//','/').replace(/\/$/,'');
        
        return (frontCore.includes(backCore) || backCore.includes(frontCore)) && fCall.method === b.method;
    });

    if (match) {
        contractMatches.push({
            endpoint: fCall.endpoint,
            method: fCall.method,
            fComp: fCall.component,
            bHandler: match.controller,
            bExists: 'Yes',
            fUses: 'Yes',
            matchStatus: 'Match'
        });
    } else {
        contractMatches.push({
            endpoint: fCall.endpoint,
            method: fCall.method,
            fComp: fCall.component,
            bHandler: 'Missing',
            bExists: 'No',
            fUses: 'Yes',
            matchStatus: 'Missing Backend Endpoint'
        });
        mismatchCount++;
    }
});

// Identify unused backend endpoints
backendEndpoints.forEach(b => {
    const normBack = normalizePath(b.path);
    const isUsed = frontendApiCalls.some(fCall => {
        const normFront = normalizePath(fCall.endpoint);
        const backCore = normBack.replace(/:[a-zA-Z0-9_]+/g, '').replace('//','/').replace(/\/$/,'');
        const frontCore = normFront.replace(/:[a-zA-Z0-9_]+/g, '<id>').replace('//','/').replace(/\/$/,'');
        return (frontCore.includes(backCore) || backCore.includes(frontCore)) && fCall.method === b.method;
    });
    
    if (!isUsed) {
        contractMatches.push({
            endpoint: b.path,
            method: b.method,
            fComp: 'None',
            bHandler: b.controller,
            bExists: 'Yes',
            fUses: 'No',
            matchStatus: 'Unused by Frontend'
        });
        mismatchCount++;
    }
});


// =========================================================================
// OUTPUT 1: GENERATE ALIGNMENT INTELLIGENCE REPORT
// =========================================================================
console.log('Building Alignment Intelligence Markdown output...');

let alignMd = `# Backend–Frontend Alignment Intelligence Report\n\n`;

// Metrics
alignMd += `## Detected Backend Frameworks\n\n`;
const frameworkCounts = {};
backendModules.forEach(p => {
    if (p.framework && p.framework !== 'Unknown') {
        frameworkCounts[p.framework] = (frameworkCounts[p.framework] || 0) + 1;
    }
});
if (Object.keys(frameworkCounts).length > 0) {
    alignMd += `| Framework | Modules / Controllers Detected |\n`;
    alignMd += `|---|---|\n`;
    for (const [fw, count] of Object.entries(frameworkCounts)) {
        alignMd += `| **${fw}** | ${count} |\n`;
    }
} else {
    alignMd += `| Node.js (via AST) | \`backendModules.size\` |\n`;
}
alignMd += `\n`;

alignMd += `## Alignment Metrics\n\n`;
alignMd += `| Metric | Description |\n`;
alignMd += `|---|---|\n`;
alignMd += `| Total Backend Endpoints | ${backendEndpoints.length} |\n`;
alignMd += `| Total Frontend API Calls | ${frontendApiCalls.length} |\n`;
alignMd += `| Matched Contracts | ${contractMatches.filter(c => c.matchStatus === 'Match').length} |\n`;
alignMd += `| Contract Mismatches / Unused | ${mismatchCount} |\n\n`;

alignMd += `## Endpoint Contract Matching\n\n`;
alignMd += `| Endpoint | Method | Frontend Component | Backend Controller | Backend Exists | Frontend Uses | Status |\n`;
alignMd += `|---|---|---|---|---|---|---|\n`;
contractMatches.forEach(m => {
    alignMd += `| \`${m.endpoint}\` | ${m.method} | \`${m.fComp}\` | \`${m.bHandler}\` | ${m.bExists} | ${m.fUses} | **${m.matchStatus}** |\n`;
});

alignMd += `\n## Frontend API Usage (Data Shape Requirements)\n\n`;
alignMd += `| Component | Endpoint Used | HTTP Method | Request Payload | Expected Response |\n`;
alignMd += `|---|---|---|---|---|\n`;
frontendApiCalls.forEach(f => {
    alignMd += `| \`${f.component}\` | \`${f.endpoint}\` | ${f.method} | \`${f.payload || 'None'}\` | ${f.expectedRes} |\n`;
});

alignMd += `\n## Backend Endpoints (Full Route Map)\n\n`;
alignMd += `| Endpoint Path | Method | Controller | Framework | Auth Required | Request Schema | Response |\n`;
alignMd += `|---|---|---|---|---|---|---|\n`;
backendEndpoints.forEach(b => {
    const fw = backendModules.has(b.controller) ? (backendModules.get(b.controller).framework || 'Node.js') : 'Node.js';
    const authReq = b.authRequired ? 'Yes' : 'No';
    const reqS = b.reqSchema.length > 0 ? b.reqSchema.join(', ').substring(0, 50) : 'None';
    const resS = b.resSchema.length > 0 ? b.resSchema.join(', ') : 'Unknown';
    alignMd += `| \`${b.path}\` | ${b.method} | \`${b.controller}\` | ${fw} | ${authReq} | ${reqS} | ${resS} |\n`;
});

alignMd += `\n## Backend Module Profiles\n\n`;
for (const [name, p] of backendModules.entries()) {
    alignMd += `### ${name}\n\n`;
    alignMd += `**Basic Information:**\n`;
    alignMd += `- **File**: \`${p.file}\`\n`;
    alignMd += `- **Framework**: ${p.framework || 'Node.js / Express'}\n`;
    alignMd += `- **Module Type**: ${p.type}\n`;
    
    alignMd += `**Endpoint Coverage:**\n`;
    alignMd += `- **Endpoints**: ${p.endpoints.size > 0 ? Array.from(p.endpoints).map(x=>'\`'+x+'\`').join(', ') : 'None defined'}\n`;
    alignMd += `- **Methods**: ${p.methods.size > 0 ? Array.from(p.methods).join(', ') : 'None'}\n`;
    alignMd += `- **Middleware**: ${p.middlewares.size > 0 ? Array.from(p.middlewares).map(x=>'\`'+x+'\`').join(', ') : 'None'}\n`;
    
    alignMd += `**Data & Security Coverage:**\n`;
    alignMd += `- **Request Signatures (Params)**: ${p.reqSchemas.size > 0 ? Array.from(p.reqSchemas).join(', ') : 'None destructured'}\n`;
    alignMd += `- **CRUD / DB Operations**: ${p.crudOps.size > 0 ? Array.from(p.crudOps).join(', ') : 'None detected'}\n\n`;
}

alignMd += `## Data Flow Map\n\n`;
alignMd += `\`\`\`mermaid\nflowchart TD;\n`;
alignMd += `  User((User)) --> FE_Comp[Frontend Component];\n`;
alignMd += `  FE_Comp -- Axios / Fetch --> API_Gw[API Gateway / Router];\n`;
alignMd += `  API_Gw -- Routes to --> Controller[Backend Controller];\n`;
alignMd += `  Controller --> Service[Backend Service Logic];\n`;
alignMd += `  Service --> DB[(Database ORM)];\n`;
alignMd += `  DB -- Data Array / Obj --> Service;\n`;
alignMd += `  Service -- JSON --> FE_Comp;\n`;
alignMd += `  FE_Comp -- Re-Renders --> User;\n`;

let mmCount = 0;
frontendApiCalls.forEach(f => {
    if (mmCount < 100) {
        alignMd += `  FE_${f.component}["${f.component}"] -- HTTP ${f.method} --> BE_${f.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}["${f.endpoint}"];\n`;
        mmCount++;
    }
});
backendEndpoints.forEach(b => {
    if (mmCount < 200) {
        alignMd += `  BE_${b.path.replace(/[^a-zA-Z0-9]/g, '_')}["${b.path}"] --> CTRL_${b.controller}["${b.controller}"];\n`;
        if (b.dbOps.length > 0) {
            alignMd += `  CTRL_${b.controller}["${b.controller}"] --> DB_${b.controller}[(Database)];\n`;
        }
        mmCount++;
    }
});
alignMd += `\`\`\`\n\n`;

const ALIGN_OUT_PATH = path.resolve(__dirname, 'backend_frontend_alignment_report.md');
fs.writeFileSync(ALIGN_OUT_PATH, alignMd);
console.log(`Backend-Frontend Alignment Report generated at ${ALIGN_OUT_PATH}`);


// =========================================================================
// OUTPUT 2: GENERATE EXISTING COMPONENT INTELLIGENCE REPORT
// =========================================================================
console.log('Building Component Intelligence Markdown output...');

let md = `# UI Architecture & Data Flow Report\n\n`;

const generateTableSection = (filterTypes, title) => {
    md += `## ${title}\n`;
    const filtered = Array.from(components.values()).filter(c => filterTypes.some(t => c.type.includes(t)));
    if (filtered.length === 0) {
        md += `*No items found in this category.*\n\n`;
        return;
    }
    
    md += `| Component Name | File Path | Props Received | State Used | API Calls | Child Components |\n`;
    md += `|---|---|---|---|---|---|\n`;
    filtered.forEach(c => {
        const props = c.props.length > 0 ? c.props.map(p => p.name).join(', ') : 'None';
        const state = c.localState.size > 0 ? Array.from(c.localState).join(', ') : 'None';
        const apis = c.apiCalls.size > 0 ? Array.from(c.apiCalls).join(', ') : 'None';
        const children = c.children.size > 0 ? Array.from(c.children).join(', ') : 'None';
        md += `| \`${c.name}\` | \`${c.file}\` | ${props} | ${state} | ${apis} | ${children} |\n`;
    });
    md += `\n`;
};

generateTableSection(['Page'], 'Pages');
generateTableSection(['Layout Component'], 'Layout Components');
generateTableSection(['Feature Component'], 'Feature Components');
generateTableSection(['Reusable UI', 'Composite UI', 'Primitive UI'], 'Reusable Components');

md += `## Component Communication Map\n`;
md += `| Parent Component | Child Component | Events/Callbacks |\n`;
md += `|---|---|---|\n`;
let hasComm = false;
for (const [parent, prof] of components.entries()) {
    if (prof.children.size > 0) {
        prof.children.forEach(child => {
            const childProf = components.get(child);
            const callbacks = childProf && childProf.eventsEmitted.size > 0 ? Array.from(childProf.eventsEmitted).join(', ') : 'None';
            md += `| \`${parent}\` | \`${child}\` | ${callbacks} |\n`;
            hasComm = true;
        });
    }
}
if (!hasComm) md += `| N/A | N/A | N/A |\n`;
md += `\n`;

const sanitizeMermaid = (str) => str.replace(/[^a-zA-Z0-9]/g, '_');

md += `## Component Hierarchy Tree\n`;
md += `\`\`\`mermaid\nflowchart TD;\n`;
let edgeCount = 0;
for (const [child, prof] of components.entries()) {
    const safeChild = sanitizeMermaid(child);
    if (prof.parents.size === 0 && prof.type === 'Page' && child !== 'App') {
        md += `  ROUTER_ROOT((Router)) --> ${safeChild}["${child}"];\n`;
        edgeCount++;
    }
    for (const parent of prof.parents) {
        if (edgeCount < 300) {
            const safeParent = sanitizeMermaid(parent);
            md += `  ${safeParent}["${parent}"] --> ${safeChild}["${child}"];\n`;
            edgeCount++;
        }
    }
}
if (edgeCount >= 300) md += `  %% Tree truncated to save diagram rendering memory\n`;
md += `\`\`\`\n\n`;

md += `## Backend Interaction Map\n`;
md += `| Component | API Call Method | Endpoints |\n`;
md += `|---|---|---|\n`;
let hasNetwork = false;
for (const [name, prof] of components.entries()) {
    if (prof.apiCalls.size > 0) {
        hasNetwork = true;
        const methods = Array.from(prof.methods).join(', ') || 'GET';
        const endpoints = Array.from(prof.endpoints).map(x=>'\`'+x+'\`').join(', ');
        md += `| \`${name}\` | ${methods} | ${endpoints} |\n`;
    }
}
if (!hasNetwork) md += `| N/A | N/A | N/A |\n`;
md += `\n`;

md += `---\n\n`;
md += `# Component Profiles\n\n`;
md += `*(Contains full technical profiles for all ${components.size} UI elements)*\n\n`;

for (const [name, p] of components.entries()) {
    md += `### ${name}\n\n`;
    md += `**Basic Information:**\n`;
    md += `| Field | Value |\n|---|---|\n`;
    md += `| File Path | \`${p.file}\` |\n`;
    md += `| Component Type | ${p.type} |\n`;
    md += `| Export Type | ${p.exportType} |\n`;
    
    md += `\n**Structural Information:**\n`;
    md += `| Field | Value |\n|---|---|\n`;
    md += `| Parent Components | ${p.parents.size > 0 ? Array.from(p.parents).map(x=>'\`'+x+'\`').join(', ') : 'None'} |\n`;
    md += `| Child Components | ${p.children.size > 0 ? Array.from(p.children).map(x=>'\`'+x+'\`').join(', ') : 'None'} |\n`;

    md += `\n**State & Side Effects:**\n`;
    md += `| Field | Value |\n|---|---|\n`;
    md += `| Local State Variables | ${p.localState.size > 0 ? Array.from(p.localState).map(x=>'\`'+x+'\`').join(', ') : 'None'} |\n`;
    md += `| Side Effects (useEffect) | ${p.sideEffects.size} hook(s) |\n`;

    md += `\n**Backend Interactions & Data Sources:**\n`;
    md += `| Field | Value |\n|---|---|\n`;
    md += `| Endpoints Traced | ${p.endpoints.size > 0 ? Array.from(p.endpoints).map(x=>'\`'+x+'\`').join(', ') : 'None'} |\n`;

    md += `\n**User Interaction & Rendering:**\n`;
    md += `| Field | Value |\n|---|---|\n`;
    md += `| Events Emitted (Callbacks) | ${p.eventsEmitted.size > 0 ? Array.from(p.eventsEmitted).map(x=>'\`'+x+'\`').join(', ') : 'None'} |\n`;
    
    md += `\n---\n\n`;
}

const UI_OUT_PATH = path.resolve(__dirname, 'component_intelligence_report.md');
fs.writeFileSync(UI_OUT_PATH, md);
console.log(`UI Architecture Report generated at ${UI_OUT_PATH}`);

console.log('All static analysis and contract matching streams completed successfully!');
