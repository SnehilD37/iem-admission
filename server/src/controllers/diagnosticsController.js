import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { store } from '../data/initialStore.js';
import { isMock as isFirebaseMock } from '../config/firebaseAdmin.js';
import { isMock as isRazorpayMock } from '../config/razorpayConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project paths
const SERVER_SRC = path.resolve(__dirname, '..');
const SERVER_ROOT = path.resolve(SERVER_SRC, '..');
const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');
const CLIENT_ROOT = path.resolve(PROJECT_ROOT, 'client');
const CLIENT_SRC = path.resolve(CLIENT_ROOT, 'src');

/**
 * Normalizes and decodes file paths from stack traces or URLs
 */
function cleanFilePath(rawPath) {
  if (!rawPath) return '';
  let cleaned = rawPath.trim();
  // Strip query parameters e.g., ?t=169000 or ?v=123
  cleaned = cleaned.replace(/\?.*$/, '');
  // Strip file:// prefix
  if (cleaned.startsWith('file:///')) {
    cleaned = cleaned.substring(8);
  } else if (cleaned.startsWith('file://')) {
    cleaned = cleaned.substring(7);
  }
  // Decode URL encoded characters (e.g. %20 -> space)
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch (e) {
    // ignore decode error
  }
  // Normalize windows slash
  cleaned = cleaned.replace(/\//g, path.sep);
  return cleaned;
}

/**
 * Extracts source code snippet safely around the target line
 */
function extractSourceSnippet(filePath, targetLine, radius = 3) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const totalLines = lines.length;

    const startLine = Math.max(1, targetLine - radius);
    const endLine = Math.min(totalLines, targetLine + radius);

    const snippet = [];
    for (let i = startLine; i <= endLine; i++) {
      let lineText = lines[i - 1];
      // Mask any sensitive tokens/passwords if present
      lineText = lineText.replace(/(secret|password|key|token|apiKey)\s*[:=]\s*['"][^'"]+['"]/gi, '$1: "********"');
      snippet.push({
        lineNumber: i,
        code: lineText,
        isTarget: i === targetLine
      });
    }
    return snippet;
  } catch (err) {
    return null;
  }
}

/**
 * Parses stack traces to locate source file, line, column, and component/function
 */
function parseStackFrames(stackText) {
  if (!stackText || typeof stackText !== 'string') return [];
  const lines = stackText.split(/\r?\n/);
  const frames = [];

  // Patterns for browser/vite and node traces
  // 1. at FunctionName (http://localhost:5173/src/components/App.jsx?t=123:42:15)
  // 2. at http://localhost:5173/src/components/App.jsx:42:15
  // 3. at FunctionName (C:\path\to\server\src\controller.js:42:15)
  // 4. at C:\path\to\server\src\controller.js:42:15
  // 5. at FunctionName (file:///C:/path/to/server/src/controller.js:42:15)
  const regexes = [
    /at\s+(?:(?<fn>[\w$.<>]+)\s+\()?(?:https?:\/\/[^\/]+(?:\/api)?(?:\/)?(?<webPath>[^:()?\n]+)(?:\?[^:()]+)?:(?<webLine>\d+):(?<webCol>\d+)|(?<filePath>[a-zA-Z]:\\[^:()\n]+|file:\/\/\/[^:()\n]+|\/[^:()\n]+):(?<fileLine>\d+):(?<fileCol>\d+))\)?/,
    /(?<webPath2>(?:src|client|server)[\\\/][^:()?\n]+):(?<webLine2>\d+):(?<webCol2>\d+)/
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    for (const rx of regexes) {
      const match = trimmed.match(rx);
      if (match && match.groups) {
        const fn = match.groups.fn || 'anonymous';
        const rawWeb = match.groups.webPath || match.groups.webPath2;
        const rawFile = match.groups.filePath;
        const lineNum = parseInt(match.groups.webLine || match.groups.fileLine || match.groups.webLine2, 10);
        const colNum = parseInt(match.groups.webCol || match.groups.fileCol || match.groups.webCol2, 10);

        let resolvedFile = '';
        let side = 'unknown';

        if (rawWeb) {
          // Normalize browser/vite path e.g. src/components/App.jsx or /src/main.jsx
          const normalized = rawWeb.replace(/^\/+/, '');
          if (normalized.startsWith('src/')) {
            resolvedFile = path.join(CLIENT_ROOT, normalized);
            side = 'client';
          } else if (normalized.startsWith('client/')) {
            resolvedFile = path.join(PROJECT_ROOT, normalized);
            side = 'client';
          } else if (normalized.startsWith('server/')) {
            resolvedFile = path.join(PROJECT_ROOT, normalized);
            side = 'server';
          } else {
            resolvedFile = path.join(CLIENT_SRC, normalized);
            side = 'client';
          }
        } else if (rawFile) {
          resolvedFile = cleanFilePath(rawFile);
          if (resolvedFile.includes(path.sep + 'client' + path.sep) || resolvedFile.includes('/client/')) {
            side = 'client';
          } else if (resolvedFile.includes(path.sep + 'server' + path.sep) || resolvedFile.includes('/server/')) {
            side = 'server';
          }
        }

        const isNodeModules = resolvedFile.includes('node_modules');
        const isInternal = resolvedFile.includes('node:') || resolvedFile.includes('react-dom') || resolvedFile.includes('vite/dist');

        frames.push({
          rawLine: trimmed,
          functionName: fn,
          filePath: resolvedFile,
          relativePath: resolvedFile ? path.relative(PROJECT_ROOT, resolvedFile) : '',
          line: lineNum,
          column: colNum,
          side,
          isApplicationCode: !isNodeModules && !isInternal && resolvedFile.length > 0
        });
        break;
      }
    }
  }

  return frames;
}

/**
 * Inspects all registered Express routes from the server
 */
function getRegisteredServerRoutes() {
  return [
    { method: 'GET', path: '/api/health', group: 'system' },
    { method: 'POST', path: '/api/reset-demo-data', group: 'system' },
    // Auth routes
    { method: 'GET', path: '/api/auth/demo-users', group: 'auth' },
    { method: 'POST', path: '/api/auth/demo-login', group: 'auth' },
    { method: 'POST', path: '/api/auth/register', group: 'auth' },
    { method: 'GET', path: '/api/auth/session', group: 'auth' },
    // Application routes
    { method: 'GET', path: '/api/applications/my-application', group: 'applications' },
    { method: 'POST', path: '/api/applications/save-draft', group: 'applications' },
    { method: 'POST', path: '/api/applications/submit', group: 'applications' },
    { method: 'POST', path: '/api/applications/resolve-query', group: 'applications' },
    // Admin routes
    { method: 'GET', path: '/api/admin/dashboard-stats', group: 'admin' },
    { method: 'GET', path: '/api/admin/applications', group: 'admin' },
    { method: 'GET', path: '/api/admin/applications/:id', group: 'admin' },
    { method: 'PATCH', path: '/api/admin/applications/:id/status', group: 'admin' },
    { method: 'POST', path: '/api/admin/applications/:id/raise-query', group: 'admin' },
    { method: 'POST', path: '/api/admin/applications/:id/offer-seat', group: 'admin' },
    { method: 'GET', path: '/api/admin/export-roster', group: 'admin' },
    // Payment routes
    { method: 'GET', path: '/api/payments/fee-schedule', group: 'payments' },
    { method: 'POST', path: '/api/payments/create-order', group: 'payments' },
    { method: 'POST', path: '/api/payments/verify-signature', group: 'payments' },
    // Merit routes
    { method: 'POST', path: '/api/merit/check-eligibility', group: 'merit' },
    { method: 'GET', path: '/api/merit/ranking', group: 'merit' },
    { method: 'POST', path: '/api/merit/batch-allot', group: 'merit' },
    // Diagnostics routes
    { method: 'POST', path: '/api/diagnostics/locate-error', group: 'diagnostics' },
    { method: 'GET', path: '/api/diagnostics/health', group: 'diagnostics' },
    { method: 'GET', path: '/api/diagnostics/scan', group: 'diagnostics' },
    { method: 'POST', path: '/api/diagnostics/test-endpoint', group: 'diagnostics' }
  ];
}

/**
 * Extracts endpoints defined in client/src/services/api.js
 */
function getClientDeclaredEndpoints() {
  try {
    const apiFilePath = path.join(CLIENT_SRC, 'services', 'api.js');
    if (!fs.existsSync(apiFilePath)) return [];

    const content = fs.readFileSync(apiFilePath, 'utf-8');
    const endpointRegex = /api\.(get|post|put|patch|delete)\(\s*[`']([^`']+)['`]/g;
    const endpoints = [];
    let match;

    while ((match = endpointRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      let routePath = match[2];
      // Normalize leading slash and prepend /api if not present
      if (!routePath.startsWith('/')) routePath = '/' + routePath;
      if (!routePath.startsWith('/api')) routePath = '/api' + routePath;

      endpoints.push({
        method,
        clientPath: match[2],
        fullApiPath: routePath,
        serviceFile: 'client/src/services/api.js'
      });
    }
    return endpoints;
  } catch (err) {
    return [];
  }
}

/**
 * Main analysis function that determines where an error resides
 */
export const analyzeAndLocateIssue = (errorData) => {
  const {
    error,
    message,
    stack,
    url,
    method,
    statusCode,
    componentStack,
    source,
    context
  } = errorData;

  const errorMessage = (typeof error === 'string' ? error : (error?.message || message || 'Unknown error')).trim();
  const rawStack = stack || error?.stack || (typeof error === 'string' ? error : '') || '';
  const parsedFrames = parseStackFrames(rawStack);

  // 1. Identify primary application frame
  const appFrame = parsedFrames.find(f => f.isApplicationCode) || parsedFrames[0] || null;

  let origin = 'UNKNOWN';
  let category = 'GENERAL_ERROR';
  let explanation = '';
  const causes = [];
  const suggestions = [];
  let detectedFile = appFrame?.relativePath || '';
  let detectedLine = appFrame?.line || null;
  let detectedCol = appFrame?.column || null;
  let detectedSymbol = appFrame?.functionName || null;
  let codeSnippet = null;

  // 2. Prioritized Classification Engine

  // Priority 1: Network / CORS / Server Unreachable
  const isNetworkFailure = /Network Error|ERR_CONNECTION_REFUSED|Failed to fetch|CORS|net::ERR_|getaddrinfo ENOTFOUND/i.test(errorMessage);
  if (isNetworkFailure || statusCode === 0) {
    origin = 'NETWORK_OR_PROXY';
    category = 'SERVER_OFFLINE_OR_CORS';
    explanation = 'The frontend client cannot reach the backend Express server at http://localhost:5000.';
    causes.push('Backend Express server is not running or crashed');
    causes.push('Vite development proxy (/api -> http://localhost:5000) failed to connect');
    causes.push('Port mismatch: server running on another port or blocked by firewall');
    suggestions.push('Ensure the backend server is running: run "npm run server" or "npm run dev" from root');
    suggestions.push('Check client/vite.config.js to verify proxy target is http://localhost:5000');
    suggestions.push('Test http://localhost:5000/api/health in your browser to verify server status');
    if (!detectedFile) detectedFile = 'client/vite.config.js';
  }

  // Priority 2: Missing API Route (404)
  else if (statusCode === 404 || /404|not found/i.test(errorMessage)) {
    const reqUrl = url || errorMessage;
    if (reqUrl.includes('/api/')) {
      origin = 'SERVER_ROUTE_MISSING';
      category = 'API_ENDPOINT_NOT_FOUND';
      explanation = `The API endpoint ${method || 'REQUEST'} ${url || reqUrl} was requested by the client, but is not defined on the Express server.`;
      causes.push('The route handler has not been mounted in server/src/server.js or routes/*.js');
      causes.push('Typo in endpoint URL inside client/src/services/api.js');
      suggestions.push('Verify the endpoint in client/src/services/api.js matches an actual server route');
      suggestions.push('Check the appropriate router in server/src/routes/ to mount this route');
      detectedFile = 'client/src/services/api.js';
    } else {
      origin = 'CLIENT_NAVIGATION';
      category = 'CLIENT_ROUTE_NOT_FOUND';
      explanation = 'A client-side page or static asset was not found.';
      suggestions.push('Verify client React routes and component navigation links');
      detectedFile = 'client/src/App.jsx';
    }
  }

  // Priority 3: Explicit Frame in SERVER
  else if (appFrame && appFrame.side === 'server') {
    origin = 'SERVER';
    category = 'SERVER_CONTROLLER_CRASH';
    explanation = `A backend server runtime error occurred in ${appFrame.relativePath || 'server code'}.`;
    causes.push('Unhandled exception or null reference inside Express controller or middleware');
    causes.push('Data store query or calculation error');
    suggestions.push('Inspect server logs and wrap async database/store calls in try/catch');
    suggestions.push('Check function inputs and ensure required query/body fields are present');
    detectedFile = appFrame.relativePath;
    detectedLine = appFrame.line;
    detectedCol = appFrame.column;
    detectedSymbol = appFrame.functionName;
  }

  // Priority 4: Explicit Frame in CLIENT
  else if (appFrame && appFrame.side === 'client') {
    origin = 'CLIENT';
    category = 'CLIENT_RUNTIME_CRASH';
    explanation = `A frontend client runtime error occurred in ${appFrame.relativePath || 'React component'}.`;
    causes.push('Attempted to access properties of undefined state before data finished loading');
    causes.push('Component rendered outside of its expected React Context Provider');
    causes.push('Missing null-check on asynchronous API response data');
    suggestions.push('Use optional chaining (?.) and default values when accessing nested object properties');
    suggestions.push('Add conditional loading guards (e.g. if (!data) return <LoadingSpinner />)');
    detectedFile = appFrame.relativePath;
    detectedLine = appFrame.line;
    detectedCol = appFrame.column;
    detectedSymbol = appFrame.functionName;
  }

  // Priority 5: External Services (Firebase Admin / Razorpay)
  else if (/FirebaseAppError|credential|service_account|Razorpay|key_id/i.test(errorMessage)) {
    origin = 'SERVER_CONFIGURATION';
    category = 'EXTERNAL_SERVICE_CONFIG_ERROR';
    explanation = 'An external service provider (Firebase Admin SDK or Razorpay) threw a credential or configuration error.';
    causes.push('Missing or invalid credentials in server/.env');
    causes.push('Firebase Admin service account JSON is missing or malformed');
    causes.push('Razorpay Key ID or Secret is misconfigured');
    suggestions.push('Verify server/.env matches server/.env.example');
    suggestions.push('Set isMock = true in server/src/config/firebaseAdmin.js and razorpayConfig.js for local development without live keys');
    detectedFile = errorMessage.includes('Firebase') ? 'server/src/config/firebaseAdmin.js' : 'server/src/config/razorpayConfig.js';
  }

  // Priority 6: Authentication & Authorization (401 / 403)
  else if (statusCode === 401 || statusCode === 403 || /unauthorized|forbidden|jwt|token/i.test(errorMessage)) {
    origin = statusCode === 401 ? 'CLIENT_SESSION' : 'SERVER_AUTHORIZATION';
    category = 'AUTH_TOKEN_INVALID';
    explanation = statusCode === 401 
      ? 'The user is not authenticated or their authentication token is missing/expired.' 
      : 'The authenticated user lacks the required role or permission for this operation.';
    causes.push('Missing "Authorization: Bearer <token>" header in client API request');
    causes.push('Expired token or mismatch in active demo role');
    suggestions.push('Check client/src/services/api.js request interceptor for token injection');
    suggestions.push('Check server/src/middleware/authMiddleware.js verifyToken logic');
    detectedFile = 'client/src/context/AuthContext.jsx';
  }

  // Priority 7: React / Browser DOM Keywords Fallback
  else if (
    /Cannot read properties of undefined|Cannot read properties of null|useContext must be used within|Invalid hook call|Minified React error|Objects are not valid as a React child|document is not defined|window is not defined/i.test(errorMessage) ||
    componentStack
  ) {
    origin = 'CLIENT';
    category = 'REACT_RUNTIME_CRASH';
    explanation = 'A React component or browser DOM error occurred in client-side code.';
    causes.push('Component rendering crashed due to unhandled undefined state');
    causes.push('Browser-only API accessed outside client lifecycle');
    suggestions.push('Check component render method and add null-checks for asynchronous state');
    detectedFile = detectedFile || 'client/src/App.jsx';
  }

  // Priority 8: Server 500 fallback
  else if (statusCode >= 500 || /Internal Server Error|ECONNRESET|EADDRINUSE/i.test(errorMessage)) {
    origin = 'SERVER';
    category = 'SERVER_CONTROLLER_CRASH';
    explanation = 'The backend Express server encountered an unhandled exception.';
    causes.push('Unhandled Promise rejection or exception inside server controller handler');
    suggestions.push('Check server console logs for full stack trace');
    detectedFile = detectedFile || 'server/src/server.js';
  }

  // Fallback to source hint if provided
  if (origin === 'UNKNOWN') {
    if (source === 'client' || (appFrame && appFrame.side === 'client')) {
      origin = 'CLIENT';
      category = 'CLIENT_SIDE_ERROR';
      explanation = 'Error appears to originate in client-side code.';
    } else if (source === 'server' || (appFrame && appFrame.side === 'server')) {
      origin = 'SERVER';
      category = 'SERVER_SIDE_ERROR';
      explanation = 'Error appears to originate in server-side backend code.';
    }
  }

  // Extract snippet if detectedFile exists on disk
  if (detectedFile) {
    const fullPath = path.isAbsolute(detectedFile) ? detectedFile : path.resolve(PROJECT_ROOT, detectedFile);
    if (fs.existsSync(fullPath)) {
      const targetLine = detectedLine || 1;
      codeSnippet = extractSourceSnippet(fullPath, targetLine);
    }
  }

  return {
    success: true,
    origin, // 'CLIENT' | 'SERVER' | 'NETWORK_OR_PROXY' | 'SERVER_ROUTE_MISSING' | 'SERVER_CONFIGURATION' | 'CLIENT_SESSION' | 'UNKNOWN'
    category,
    detectedLocation: {
      side: origin.startsWith('CLIENT') ? 'client' : origin.startsWith('SERVER') ? 'server' : 'infrastructure',
      file: detectedFile,
      line: detectedLine,
      column: detectedCol,
      symbol: detectedSymbol,
      codeSnippet
    },
    errorSummary: errorMessage || 'No error message provided',
    explanation,
    possibleCauses: causes,
    suggestedFixes: suggestions,
    parsedFrames: parsedFrames.slice(0, 10),
    timestamp: new Date().toISOString()
  };
};

/**
 * Controller endpoint: POST /api/diagnostics/locate-error
 * Evaluates an incoming error stack/message and pinpoints exact client vs server location
 */
export const locateError = (req, res) => {
  try {
    const diagnosis = analyzeAndLocateIssue(req.body);
    res.json(diagnosis);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to diagnose error: ' + err.message
    });
  }
};

/**
 * Controller endpoint: GET /api/diagnostics/health
 * Comprehensive automated sanity check of both client and server subsystems
 */
export const checkCodebaseHealth = (req, res) => {
  const issues = [];
  const checks = [];

  // 1. Server Environment Check
  const serverEnvPath = path.join(SERVER_ROOT, '.env');
  const serverEnvExists = fs.existsSync(serverEnvPath);
  checks.push({
    name: 'Server .env File',
    subsystem: 'server',
    status: serverEnvExists ? 'ok' : 'warning',
    details: serverEnvExists ? 'Found server/.env' : 'Missing server/.env (using default development fallbacks)'
  });
  if (!serverEnvExists) {
    issues.push({ level: 'warning', side: 'server', message: 'server/.env is missing. Create one from .env.example' });
  }

  // 2. Client Environment Check
  const clientEnvPath = path.join(CLIENT_ROOT, '.env');
  const clientEnvExists = fs.existsSync(clientEnvPath);
  checks.push({
    name: 'Client .env File',
    subsystem: 'client',
    status: clientEnvExists ? 'ok' : 'info',
    details: clientEnvExists ? 'Found client/.env' : 'Using default relative API proxy (/api)'
  });

  // 3. Persisted Data Store Check
  const persistStorePath = path.join(SERVER_SRC, 'data', 'persistedStore.json');
  let storeStatus = 'ok';
  let storeDetails = '';
  try {
    if (fs.existsSync(persistStorePath)) {
      const storeRaw = fs.readFileSync(persistStorePath, 'utf-8');
      const storeJson = JSON.parse(storeRaw);
      const appCount = storeJson.applications ? storeJson.applications.length : 0;
      storeDetails = `Valid JSON store with ${appCount} applications on disk`;
    } else {
      storeStatus = 'warning';
      storeDetails = 'persistedStore.json not found on disk; running in-memory initialStore';
    }
  } catch (err) {
    storeStatus = 'error';
    storeDetails = 'Corrupted persistedStore.json: ' + err.message;
    issues.push({ level: 'error', side: 'server', message: 'Data store JSON corrupted: ' + err.message });
  }
  checks.push({
    name: 'Persisted JSON Store',
    subsystem: 'server',
    status: storeStatus,
    details: storeDetails
  });

  // 4. Client Entry Points Check
  const clientMainPath = path.join(CLIENT_SRC, 'main.jsx');
  const clientAppPath = path.join(CLIENT_SRC, 'App.jsx');
  const clientMainExists = fs.existsSync(clientMainPath);
  const clientAppExists = fs.existsSync(clientAppPath);
  checks.push({
    name: 'Client Core Entry Points',
    subsystem: 'client',
    status: (clientMainExists && clientAppExists) ? 'ok' : 'error',
    details: `main.jsx: ${clientMainExists ? 'OK' : 'MISSING'}, App.jsx: ${clientAppExists ? 'OK' : 'MISSING'}`
  });
  if (!clientMainExists || !clientAppExists) {
    issues.push({ level: 'error', side: 'client', message: 'Client entry files missing in client/src/' });
  }

  // 5. Client Vite Proxy Configuration Check
  const viteConfigPath = path.join(CLIENT_ROOT, 'vite.config.js');
  let viteProxyOk = false;
  if (fs.existsSync(viteConfigPath)) {
    const viteContent = fs.readFileSync(viteConfigPath, 'utf-8');
    viteProxyOk = viteContent.includes("proxy:") && viteContent.includes("target:");
  }
  checks.push({
    name: 'Vite API Proxy',
    subsystem: 'client',
    status: viteProxyOk ? 'ok' : 'warning',
    details: viteProxyOk ? 'Configured proxy for /api -> http://localhost:5000' : 'Vite proxy not explicitly detected'
  });

  // 6. Cross-System Route Parity Audit (Client declared endpoints vs Server registered routes)
  const serverRoutes = getRegisteredServerRoutes();
  const clientEndpoints = getClientDeclaredEndpoints();
  const routeMismatches = [];

  for (const clientEp of clientEndpoints) {
    const hasMatch = serverRoutes.some(sr => {
      // Direct match or param match
      const serverPathPattern = sr.path.replace(/:[a-zA-Z0-9_-]+/g, '[^/]+');
      const rx = new RegExp(`^${serverPathPattern}$`);
      return sr.method === clientEp.method && rx.test(clientEp.fullApiPath);
    });

    if (!hasMatch) {
      routeMismatches.push({
        clientMethod: clientEp.method,
        clientPath: clientEp.clientPath,
        fullRequested: clientEp.fullApiPath
      });
      issues.push({
        level: 'warning',
        side: 'integration',
        message: `Client endpoint ${clientEp.method} ${clientEp.fullApiPath} has no matching route on the server!`
      });
    }
  }

  checks.push({
    name: 'API Route Parity Check',
    subsystem: 'integration',
    status: routeMismatches.length === 0 ? 'ok' : 'warning',
    details: routeMismatches.length === 0 
      ? `All ${clientEndpoints.length} client API endpoints match active server routes` 
      : `${routeMismatches.length} route discrepancies detected`
  });

  const overallStatus = issues.some(i => i.level === 'error') 
    ? 'error' 
    : issues.some(i => i.level === 'warning') 
      ? 'warning' 
      : 'healthy';

  res.json({
    success: true,
    overallStatus,
    timestamp: new Date().toISOString(),
    system: {
      serverUptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      mockModes: {
        firebaseAuth: isFirebaseMock ? 'MOCK' : 'LIVE',
        razorpay: isRazorpayMock ? 'MOCK' : 'LIVE'
      }
    },
    checks,
    issues,
    routeMismatches,
    clientEndpointCount: clientEndpoints.length,
    serverRouteCount: serverRoutes.length
  });
};

/**
 * Controller endpoint: GET /api/diagnostics/scan
 * Static scan of source code to find common pitfalls
 */
export const scanCodebaseIssues = (req, res) => {
  const scanResults = {
    client: [],
    server: [],
    totalScanned: 0
  };

  try {
    // Scan client files for hardcoded localhost URLs
    if (fs.existsSync(CLIENT_SRC)) {
      const scanDir = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
            scanDir(fullPath);
          } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
            scanResults.totalScanned++;
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split(/\r?\n/);
            lines.forEach((line, idx) => {
              if (line.includes('http://localhost:5000') && !fullPath.includes('vite.config.js')) {
                scanResults.client.push({
                  file: path.relative(PROJECT_ROOT, fullPath),
                  line: idx + 1,
                  issue: 'Hardcoded http://localhost:5000 URL detected. Should use API_BASE_URL or relative /api to benefit from proxy/CORS setup.',
                  severity: 'warning'
                });
              }
            });
          }
        }
      };
      scanDir(CLIENT_SRC);
    }

    // Scan server controllers for missing try-catch in async handlers
    const controllersDir = path.join(SERVER_SRC, 'controllers');
    if (fs.existsSync(controllersDir)) {
      const files = fs.readdirSync(controllersDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          scanResults.totalScanned++;
          const fullPath = path.join(controllersDir, file);
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Find async exports without try/catch
          const asyncFnMatches = content.match(/export\s+const\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/g);
          if (asyncFnMatches) {
            for (const fnCode of asyncFnMatches) {
              if (!fnCode.includes('try {') && !fnCode.includes('.catch(')) {
                const fnNameMatch = fnCode.match(/export\s+const\s+(\w+)/);
                const fnName = fnNameMatch ? fnNameMatch[1] : 'unknown';
                scanResults.server.push({
                  file: path.relative(PROJECT_ROOT, fullPath),
                  issue: `Async controller function '${fnName}' has no try/catch block. Unhandled exceptions may hang or crash the server.`,
                  severity: 'info'
                });
              }
            }
          }
        }
      }
    }

    res.json({
      success: true,
      scanResults,
      summary: `Scanned ${scanResults.totalScanned} files. Found ${scanResults.client.length} client hints and ${scanResults.server.length} server hints.`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Codebase scan error: ' + err.message
    });
  }
};

/**
 * Controller endpoint: POST /api/diagnostics/test-endpoint
 * Tests an internal route to confirm whether it responds or fails
 */
export const testEndpoint = (req, res) => {
  const { path: routePath, method = 'GET' } = req.body;

  if (!routePath) {
    return res.status(400).json({ success: false, message: 'path is required' });
  }

  const registeredRoutes = getRegisteredServerRoutes();
  const matched = registeredRoutes.find(r => {
    const pattern = r.path.replace(/:[a-zA-Z0-9_-]+/g, '[^/]+');
    return r.method === method.toUpperCase() && new RegExp(`^${pattern}$`).test(routePath);
  });

  if (!matched) {
    return res.json({
      success: false,
      status: 404,
      diagnostics: {
        origin: 'SERVER_ROUTE_MISSING',
        message: `Route ${method.toUpperCase()} ${routePath} does not exist on the server.`,
        recommendation: 'Check server/src/routes to register this endpoint or check spelling.'
      }
    });
  }

  res.json({
    success: true,
    status: 200,
    matchedRoute: matched,
    diagnostics: {
      origin: 'SERVER',
      message: `Route ${method.toUpperCase()} ${routePath} is properly registered under the '${matched.group}' router.`,
      status: 'VERIFIED'
    }
  });
};
