import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const require = createRequire(import.meta.url);
const CommonJSModule = require('node:module');

async function loadTypeScriptRoute(relativePath) {
  const routePath = path.join(root, relativePath);
  const source = await read(relativePath);
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const routeModule = new CommonJSModule(routePath);
  routeModule.filename = routePath;
  routeModule.paths = CommonJSModule._nodeModulePaths(path.dirname(routePath));
  routeModule._compile(outputText, routePath);
  return routeModule.exports;
}

async function routeExists(route) {
  const segments = route.split('/').filter(Boolean);
  let cursor = path.join(root, 'app');
  for (const segment of segments) {
    const direct = path.join(cursor, segment);
    try {
      await access(direct);
      cursor = direct;
    } catch {
      const dynamic = (await import('node:fs/promises')).readdir(cursor, { withFileTypes: true });
      const match = (await dynamic).find((entry) => entry.isDirectory() && /^\[.+\]$/.test(entry.name));
      if (!match) return false;
      cursor = path.join(cursor, match.name);
    }
  }
  try {
    await access(path.join(cursor, 'page.tsx'));
    return true;
  } catch {
    return false;
  }
}

test('Next.js application entry points exist', async () => {
  for (const file of ['app/layout.tsx', 'app/page.tsx', 'app/globals.css', 'components/theme/ThemeProvider.tsx']) {
    await access(path.join(root, file));
  }
});

test('all workspace sidebar links resolve to an app route', async () => {
  const source = await read('components/navigation/AppSidebar.tsx');
  const routes = [...source.matchAll(/href:\s*"(\/[^"]+)"/g)].map((match) => match[1]);
  assert.ok(routes.length >= 15, 'expected the admin and citizen workspace routes to be represented');
  for (const route of routes) assert.ok(await routeExists(route), `${route} must resolve to a page`);
});

test('public Platform menu destinations resolve', async () => {
  const source = await read('components/navigation/PublicNavbar.tsx');
  for (const route of ['/platform', '/study-area', '/demo-lab']) {
    assert.ok(source.includes(`href="${route}"`), `${route} should remain in the Platform menu`);
    assert.ok(await routeExists(route), `${route} must resolve to a page`);
  }
});

test('theme preference is bootstrapped and theme controls expose state', async () => {
  const layout = await read('app/layout.tsx');
  const toggle = await read('components/theme/ThemeToggle.tsx');
  const css = await read('app/globals.css');
  assert.match(layout, /localStorage\.getItem\('suraksha-theme'\)/);
  assert.match(toggle, /aria-pressed=\{theme === "dark"\}/);
  assert.match(css, /html\.light main/);
  assert.match(css, /html\.light \.workspace-shell/);
  assert.match(css, /hydrograph-chart/);
});

test('Patna preview uses a single coherent station fixture', async () => {
  const data = await read('lib/mock-data.ts');
  const fixture = data.slice(data.indexOf('export const PATNA_GANDHI_GHAT'), data.indexOf('export const STATIONS'));
  assert.match(fixture, /currentStage:\s*46\.85/);
  assert.match(fixture, /warningLevel:\s*47\.6/);
  assert.match(fixture, /dangerLevel:\s*48\.6/);
  for (const file of ['app/citizen/page.tsx', 'app/admin/page.tsx', 'components/three/DigitalTwinScene.tsx', 'components/shared/HydrologicalChart.tsx']) {
    assert.match(await read(file), /PATNA_GANDHI_GHAT/);
  }
});

test('Platform menu supports explicit open, escape, and outside close without hover-toggle conflict', async () => {
  const source = await read('components/navigation/PublicNavbar.tsx');
  assert.match(source, /onClick=\{\(\) => setPlatformDropdownOpen\(!platformDropdownOpen\)\}/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /closeOnOutsidePointer/);
  assert.doesNotMatch(source, /onMouseEnter=\{\(\) => setPlatformDropdownOpen/);
});

test('unavailable engine services never report healthy status or fabricated actuator records', async () => {
  const health = await read('app/api/flood/health/route.ts');
  const stations = await read('app/api/flood/stations/route.ts');
  const gates = await read('app/api/flood/gates/route.ts');
  assert.match(health, /status: "UNAVAILABLE"/);
  assert.doesNotMatch(health, /status: "HEALTHY"/);
  assert.doesNotMatch(stations, /from "@\/lib\/mock-data"/);
  assert.match(gates, /status: 501/);
  assert.doesNotMatch(gates, /last_actuated_at|current_opening_pct/);
});

test('prototype gate and alert approval screens do not claim actions were executed', async () => {
  const gates = await read('app/admin/gates/page.tsx');
  const gateDetail = await read('app/admin/gates/[gateId]/page.tsx');
  const approvals = await read('app/admin/approvals/page.tsx');
  const alerts = await read('app/api/flood/alerts/route.ts');
  assert.match(gates, /No barrage control or actuator endpoint is connected/);
  assert.doesNotMatch(gates, /handleAdjust|setToast\(/);
  assert.match(gateDetail, /Gate execution is unavailable/);
  assert.doesNotMatch(gateDetail, /Execute Gate Verification Check|showToast/);
  assert.match(approvals, /SAMPLE · NOT CONNECTED/);
  assert.doesNotMatch(approvals, /handleApprove|handleReject|Authorize & Publish/);
  assert.match(alerts, /status: 501/);
});

test('dashboard example telemetry is visibly distinguished from observed operations data', async () => {
  const chart = await read('components/shared/HydrologicalChart.tsx');
  const dashboard = await read('app/admin/page.tsx');
  assert.match(chart, /Illustrative sample for Patna/);
  assert.match(chart, /SYNTHETIC SURGE EXAMPLE/);
  assert.doesNotMatch(chart, /Observed Stage/);
  assert.match(dashboard, /Engine status unavailable/);
  assert.match(dashboard, /Synthetic reference · no live incident feed/);
  assert.doesNotMatch(dashboard, /Lalganj tributary surge flagged|NSE Score: 0\.89|HUMAN-IN-THE-LOOP ACTIVE/);
});

test('API explorer documents verified engine routes rather than retired website routes', async () => {
  const explorer = await read('components/docs/renderers/InteractiveApiExplorer.tsx');
  const scenarioProxy = await read('app/api/flood/scenarios/route.ts');
  assert.match(explorer, /\/api\/v1\/flood\/pipeline\/run/);
  assert.match(explorer, /\/api\/v1\/flood\/demo\/scenarios/);
  assert.match(explorer, /\/api\/v1\/flood\/stations/);
  assert.doesNotMatch(explorer, /\/api\/v1\/flood\/(forecast|alerts\/cap|gates\/advisory)/);
  assert.match(scenarioProxy, /\/api\/v1\/flood\/demo\/scenarios/);
});

test('generated API documentation uses the website-owned verified contract override', async () => {
  const [override, published, syncScript, rawDocs, manifestText] = await Promise.all([
    read('content/docs-overrides/09_BACKEND_AND_API/api-reference.md'),
    read('content/docs/09_BACKEND_AND_API/api-reference.md'),
    read('scripts/sync-docs.py'),
    read('lib/docs/docs-data.json'),
    read('lib/docs/docs-manifest.json'),
  ]);
  const docs = JSON.parse(rawDocs);
  const apiDoc = docs.find((doc) => doc.id === '09-backend-and-api--api-reference');
  const manifest = JSON.parse(manifestText);
  assert.equal(published.trim().replace(/\r\n/g, '\n'), override.trim().replace(/\r\n/g, '\n'));
  assert.ok(apiDoc, 'the API reference should be published under its stable docs ID');
  assert.match(apiDoc.content, /\/api\/v1\/flood/);
  assert.match(apiDoc.content, /\/demo\/scenarios/);
  assert.match(apiDoc.content, /SURAKSHA_OPERATOR_API_KEY/);
  assert.match(apiDoc.content, /There is no verified website or engine route for gate telemetry/);
  assert.doesNotMatch(apiDoc.content, /\/alert\/generate|\/api\/v1\/flood\/sitrep|\/api\/v1\/flood\/advisory/);
  assert.match(syncScript, /LOCAL_OVERRIDES_DIR/);
  assert.match(syncScript, /primaryGaugeStation": "Gandhi Ghat, Patna \(GANGES_PATNA\)"/);
  assert.match(syncScript, /"warningThresholdMeters": 49\.50/);
  assert.match(apiDoc.githubUrl, /SURAKSHA-Website\/blob\/codex\/fix-ui-theme-routes\/content\/docs-overrides/);
  assert.equal(apiDoc.wordCount, apiDoc.content.trim().split(/\s+/).length);
  assert.equal(apiDoc.readingTime, Math.max(1, Math.ceil(apiDoc.wordCount / 200)));
  assert.equal(apiDoc.lastVerified, '2026-11-24');
  assert.equal(manifest.metadata.operationalContext.primaryGaugeStation, 'Gandhi Ghat, Patna (GANGES_PATNA)');
  assert.equal(manifest.metadata.totalWords, docs.reduce((sum, doc) => sum + doc.wordCount, 0));
});

test('missing or invalid Supabase profiles never become citizen identities', async () => {
  const [auth, navbar, sidebar] = await Promise.all([
    read('lib/supabase/auth-context.tsx'),
    read('components/navigation/PublicNavbar.tsx'),
    read('components/navigation/AppSidebar.tsx'),
  ]);
  assert.match(auth, /Promise<UserProfile \| null>/);
  assert.match(auth, /if \(!allowedRoles\.includes\(data\.role\)\)/);
  assert.doesNotMatch(auth, /fallbackProfile|role:\s*"citizen"/);
  assert.match(auth, /const computedRole = profile\?\.role \|\| "guest"/);
  assert.match(auth, /SURAKSHA profile could not be verified/);
  assert.match(navbar, /ROLE: \{profile\?\.role \|\| "Unavailable"\}/);
  assert.match(navbar, /Account role could not be verified/);
  assert.match(sidebar, /Profile unavailable/);
  assert.doesNotMatch(sidebar, /Duty Hydrologist|Citizen Account|Patna Reach \(Preview\)/);
});

test('simulation lab submits only active controls and accepts only synthetic engine results', async () => {
  const [page, route, apiDoc] = await Promise.all([
    read('app/demo-lab/page.tsx'),
    read('app/api/flood/scenarios/route.ts'),
    read('docs/API_DOCUMENTATION.md'),
  ]);
  assert.match(page, /river_discharge_multiplier: inflow/);
  assert.doesNotMatch(page, /enable_jev_supervision|Gandak Basin|Upstream flow multiplier/);
  assert.match(page, /synthetic_data_only === true/);
  assert.match(page, /data\.jev_mode === "OFFLINE_DETERMINISTIC_SIMULATOR"/);
  assert.match(page, /data_provenance === "SYNTHETIC_SCENARIO"/);
  assert.match(page, /\+6h|\+12h|\+24h/);
  assert.match(page, /Highest returned stage/);
  assert.match(page, /offline run did not check a live authority bulletin or external source/);
  assert.doesNotMatch(page, /Sparkles|backdrop-blur-|shadow-md|shadow-2xl|\s·\s/);
  assert.match(page, /hydrodynamic-river-routing\.jpg/);
  assert.match(page, /sentinel1-sar-inundation\.jpg/);
  assert.match(page, /<dialog/);
  assert.match(route, /river_discharge_multiplier/);
  assert.match(route, /unsupported scenario options/);
  assert.match(route, /catalog\?\.synthetic_data_only !== true/);
  assert.match(route, /does not provide a usable starting river discharge/);
  assert.match(route, /conditions\.river_discharge_m3s = Number/);
  assert.match(route, /conditions\.rainfall_24h_mm = Number/);
  assert.match(apiDoc, /river_discharge_multiplier/);
  assert.match(apiDoc, /current_condition\.river_discharge_m3s/);
  assert.doesNotMatch(route, /upstream_inflow_multiplier/);
  assert.match(apiDoc, /starting river discharge multiplier/);
});

test('scenario proxy applies sliders to catalog fields and rejects incomplete inputs', async () => {
  const route = await loadTypeScriptRoute('app/api/flood/scenarios/route.ts');
  const previousFetch = globalThis.fetch;
  const previousBackendUrl = process.env.SURAKSHA_BACKEND_URL;
  process.env.SURAKSHA_BACKEND_URL = 'https://engine.test';
  const baseScenario = {
    id: 'BEST_01_CALM_BASELINE',
    input: { current_condition: { river_discharge_m3s: 100, rainfall_24h_mm: 10 } },
  };
  let submittedRun = null;
  let calls = 0;
  globalThis.fetch = async (url, init = {}) => {
    calls += 1;
    if (String(url).endsWith('/api/v1/flood/demo/scenarios')) {
      return new Response(JSON.stringify({ synthetic_data_only: true, scenarios: [baseScenario] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    assert.match(String(url), /\/demo\/scenarios\/BEST_01_CALM_BASELINE\/run\?mode=static$/);
    submittedRun = JSON.parse(init.body);
    return new Response(JSON.stringify({ accepted: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const validResponse = await route.POST(new Request('https://website.test/api/flood/scenarios', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scenario_id: baseScenario.id,
        river_discharge_multiplier: 1.25,
        precipitation_anomaly_mm: 80,
      }),
    }));
    assert.equal(validResponse.status, 200);
    assert.equal(submittedRun.input.current_condition.river_discharge_m3s, 125);
    assert.equal(submittedRun.input.current_condition.rainfall_24h_mm, 90);
    assert.deepEqual(baseScenario.input.current_condition, { river_discharge_m3s: 100, rainfall_24h_mm: 10 });

    calls = 0;
    const extraFieldResponse = await route.POST(new Request('https://website.test/api/flood/scenarios', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scenario_id: baseScenario.id,
        river_discharge_multiplier: 1,
        precipitation_anomaly_mm: 0,
        enable_jev_supervision: false,
      }),
    }));
    assert.equal(extraFieldResponse.status, 400);
    assert.equal(calls, 0, 'unsupported options must not invoke the engine');

    globalThis.fetch = async () => new Response(JSON.stringify({
      synthetic_data_only: true,
      scenarios: [{ id: baseScenario.id, input: { current_condition: { rainfall_24h_mm: 10 } } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
    const incompleteCatalogResponse = await route.POST(new Request('https://website.test/api/flood/scenarios', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scenario_id: baseScenario.id, river_discharge_multiplier: 1, precipitation_anomaly_mm: 0 }),
    }));
    assert.equal(incompleteCatalogResponse.status, 502);
    assert.match((await incompleteCatalogResponse.json()).detail, /usable starting river discharge/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBackendUrl === undefined) delete process.env.SURAKSHA_BACKEND_URL;
    else process.env.SURAKSHA_BACKEND_URL = previousBackendUrl;
  }
});

test('citizen account previews do not claim unsaved data or invented security facts', async () => {
  const profile = await read('app/citizen/profile/page.tsx');
  const locations = await read('app/citizen/locations/page.tsx');
  const notifications = await read('app/citizen/notifications/page.tsx');

  assert.match(profile, /useAuth\(\)/);
  assert.match(profile, /user\?\.email/);
  assert.match(profile, /Profile editing and language preference storage are not connected/);
  assert.doesNotMatch(profile, /Last changed 14 days ago|citizen@example\.test|Changes saved|Protected/);

  assert.match(locations, /Preview only: adding or removing a row changes this page session/);
  assert.match(locations, /not saved/);
  assert.match(locations, /disabled\s+title="Location editing is unavailable/);
  assert.match(notifications, /No notifications will be sent/);
  assert.match(notifications, /Apply to Preview/);
  assert.doesNotMatch(notifications, /Notification preferences saved/);
});

test('password recovery sends a reset link and requires an authenticated update session', async () => {
  const login = await read('app/auth/login/page.tsx');
  const request = await read('app/auth/forgot-password/page.tsx');
  const reset = await read('app/auth/reset-password/page.tsx');
  const callback = await read('app/auth/callback/route.ts');

  assert.ok(await routeExists('/auth/forgot-password'));
  assert.ok(await routeExists('/auth/reset-password'));
  assert.match(login, /href="\/auth\/forgot-password"/);
  assert.match(login, /oauth_exchange_failed/);
  assert.match(request, /resetPasswordForEmail\(email\.trim\(\), \{ redirectTo \}\)/);
  assert.match(request, /auth\/callback\?next=/);
  assert.match(reset, /supabase\.auth\.getUser\(\)/);
  assert.match(reset, /supabase\.auth\.updateUser\(\{ password \}\)/);
  assert.match(callback, /next\.startsWith\("\/\/"\)/);
  assert.match(callback, /next\.includes\("\\\\"\)/);
  assert.match(callback, /auth\/forgot-password\?error=reset_link_invalid/);
  assert.match(request, /reset_link_invalid/);
});

test('canonical engine contracts and TypeScript models exist and cover core flood subsystem', async () => {
  const contracts = await read('types/contracts.ts');
  const libContracts = await read('lib/contracts.ts');

  assert.match(contracts, /export type DataProvenance/);
  assert.match(contracts, /export interface StationMetadata/);
  assert.match(contracts, /export interface CurrentConditionState/);
  assert.match(contracts, /export interface PipelineRunRequest/);
  assert.match(contracts, /export interface PipelineRunResponse/);
  assert.match(contracts, /export interface DemoCatalogResponse/);
  assert.match(contracts, /export interface DemoScenarioRunResponse/);
  assert.match(contracts, /export interface CitizenSosRequest/);
  assert.match(contracts, /export interface EngineHealthResponse/);
  assert.match(libContracts, /export \* from "@\/types\/contracts"/);
});

test('scenario proxy forwards operator api key when configured', async () => {
  const route = await loadTypeScriptRoute('app/api/flood/scenarios/route.ts');
  const previousFetch = globalThis.fetch;
  const previousBackendUrl = process.env.SURAKSHA_BACKEND_URL;
  const previousOperatorKey = process.env.SURAKSHA_OPERATOR_API_KEY;
  process.env.SURAKSHA_BACKEND_URL = 'https://engine.test';
  process.env.SURAKSHA_OPERATOR_API_KEY = 'test-operator-api-key-32-chars-long!';

  const capturedHeaders = [];
  globalThis.fetch = async (url, init = {}) => {
    capturedHeaders.push({ url: String(url), headers: init.headers });
    if (String(url).endsWith('/api/v1/flood/demo/scenarios')) {
      return new Response(JSON.stringify({
        synthetic_data_only: true,
        scenarios: [{ id: 'TEST_01', input: { current_condition: { river_discharge_m3s: 100, rainfall_24h_mm: 10 } } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ accepted: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const res = await route.POST(new Request('https://website.test/api/flood/scenarios', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scenario_id: 'TEST_01',
        river_discharge_multiplier: 1.0,
        precipitation_anomaly_mm: 0,
      }),
    }));
    assert.equal(res.status, 200);
    assert.ok(capturedHeaders.length >= 2);
    for (const call of capturedHeaders) {
      assert.equal(call.headers.authorization, 'Bearer test-operator-api-key-32-chars-long!');
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBackendUrl === undefined) delete process.env.SURAKSHA_BACKEND_URL;
    else process.env.SURAKSHA_BACKEND_URL = previousBackendUrl;
    if (previousOperatorKey === undefined) delete process.env.SURAKSHA_OPERATOR_API_KEY;
    else process.env.SURAKSHA_OPERATOR_API_KEY = previousOperatorKey;
  }
});

test('admin stations catalogue does not claim false telemetry streams or continuous health', async () => {
  const stationsPage = await read('app/admin/stations/page.tsx');

  assert.match(stationsPage, /fetch\("\/api\/flood\/stations"/);
  assert.doesNotMatch(stationsPage, /100% reporting/);
  assert.doesNotMatch(stationsPage, /Continuous stream/);
  assert.doesNotMatch(stationsPage, /Optimal health/);
  assert.match(stationsPage, /No active live stream/);
  assert.match(stationsPage, /Configure Source \(Server-managed\)/);
});

test('code quality and security constraints are preserved', async () => {
  const [tokensCss, clientSupabase, serverSupabase, serverMjs, authCallback] = await Promise.all([
    read('design-system/tokens.css'),
    read('lib/supabase/client.ts'),
    read('lib/supabase/server.ts'),
    read('server.mjs'),
    read('app/auth/callback/route.ts'),
  ]);

  // CSS tokens: accessibility reset does not use specificity-polluting !important
  assert.doesNotMatch(tokensCss, /!important/, 'design-system/tokens.css should avoid !important overrides');

  // Supabase clients: no hardcoded JWT tokens in source code
  assert.doesNotMatch(clientSupabase, /eyJhbGciOi/, 'client.ts must not hardcode JWT anon key');
  assert.doesNotMatch(serverSupabase, /eyJhbGciOi/, 'server.ts must not hardcode JWT anon key');

  // server.mjs: safe linear key matching without backtracking regexes, path traversal guards
  assert.doesNotMatch(serverMjs, /\(\.\*\)\$/, 'server.mjs must avoid greedy backtracking regex on env parsing');
  assert.match(serverMjs, /normalizedSafePath\s*=\s*path\.normalize/);
  assert.match(serverMjs, /!filePath\.startsWith\(root\)/);

  // auth callback: open-redirect and host-header injection guards
  assert.match(authCallback, /forwardedHost/);
  assert.match(authCallback, /new URL\(next, origin\)/);
  assert.match(authCallback, /allowedHosts\.has\(forwardedHost\)/);
});

test('gateway, CSP headers, XSS sanitization, and SOS validation hardening are enforced', async () => {
  const [nextConfig, vercelConfig, mermaidRenderer, docRenderer, middlewareAuth, registerPage, sosSource] =
    await Promise.all([
      read('next.config.mjs'),
      read('vercel.json'),
      read('components/docs/MermaidRenderer.tsx'),
      read('components/docs/renderers/StructuredDocRenderer.tsx'),
      read('lib/supabase/middleware.ts'),
      read('app/auth/register/page.tsx'),
      read('app/api/flood/sos/route.ts'),
    ]);

  assert.doesNotMatch(nextConfig, /\/api\/v1\/flood\/:path\*/);
  assert.match(nextConfig, /poweredByHeader:\s*false/);
  assert.match(vercelConfig, /"Content-Security-Policy"/);
  assert.match(vercelConfig, /"Permissions-Policy"/);
  assert.match(vercelConfig, /"X-XSS-Protection"[\s\S]*"0"/);
  assert.match(mermaidRenderer, /DOMPurify\.sanitize\(/);
  assert.match(docRenderer, /rel",\s*"noopener noreferrer"/);
  assert.match(middlewareAuth, /pathname\.startsWith\("\/admin"\)/);
  assert.match(registerPage, /password\.length < 8/);
  assert.match(sosSource, /isValidUuid/);
  assert.match(sosSource, /verifySameOrigin/);

  const scenariosRoute = await loadTypeScriptRoute('app/api/flood/scenarios/route.ts');
  const crossSiteResp = await scenariosRoute.POST(
    new Request('https://website.test/api/flood/scenarios', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
      },
      body: JSON.stringify({
        scenario_id: 'BEST_01_CALM_BASELINE',
        river_discharge_multiplier: 1,
        precipitation_anomaly_mm: 0,
      }),
    })
  );
  assert.equal(crossSiteResp.status, 403);
});
