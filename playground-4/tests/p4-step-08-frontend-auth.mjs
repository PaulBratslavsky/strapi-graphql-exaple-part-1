// Part 4 Step 8: frontend auth wiring.
//
// File-level checks: every file the post asks for exists with the expected pieces.
// API-level checks:
//   - login & register mutations work end-to-end against Strapi
//   - JWT, sent as Authorization: Bearer, makes the GraphQL backend respect ownership
//     (already proven in Step 6 tests, but we re-confirm via Apollo through the Next dev server)
// Page-level checks (curl):
//   - GET /login returns 200, contains the login form
//   - GET /register returns 200, contains the register form
//   - GET / with no cookie redirects to /login (proxy.ts)
//   - GET /notes/<id> with no cookie redirects to /login (proxy.ts)
//   - GET /login with no cookie still works (PUBLIC_ROUTES)
//
// The Server Action HTTP path (form-submit → loginAction → setJwt → redirect) is
// not invoked from this test; per agreement we leave that to manual click-through.
// What we *can* verify here: the underlying mutations the actions call all work.

import { Buffer } from "node:buffer";

const NEXT = "http://localhost:3000";
const GQL = "http://localhost:1337/graphql";
const SERVER_ROOT = "/Users/paul/work/blog/graphql-customization/playground-4/server";
const CLIENT_ROOT = "/Users/paul/work/blog/graphql-customization/playground-4/client";

let pass = 0, fail = 0;
const failures = [];
const check = (label, ok, detail = "") => {
  if (ok) { console.log(`  ok: ${label}`); pass++; }
  else { console.log(`  FAIL: ${label}${detail ? " — " + detail : ""}`); fail++; failures.push(label); }
};

import { readFileSync, existsSync } from "node:fs";
const has = (rel, needle) => readFileSync(`${CLIENT_ROOT}/${rel}`, "utf8").includes(needle);
const exists = (rel) => existsSync(`${CLIENT_ROOT}/${rel}`);

console.log("\n=== Part 4 Step 8: frontend auth wiring ===\n");

// 8.1 lib/auth.ts
console.log("8.1 lib/auth.ts");
check("lib/auth.ts exists", exists("lib/auth.ts"));
check("auth.ts uses next/headers cookies()", has("lib/auth.ts", 'from "next/headers"'));
check("auth.ts exports JWT_COOKIE = 'strapi_jwt'", has("lib/auth.ts", 'JWT_COOKIE = "strapi_jwt"'));
check("auth.ts exports setJwt with httpOnly cookie", has("lib/auth.ts", "httpOnly: true"));
check("auth.ts exports clearJwt", has("lib/auth.ts", "export async function clearJwt"));

// 8.2 apollo-client.ts attaches JWT
console.log("\n8.2 lib/apollo-client.ts");
check("apollo-client.ts imports getJwt from ./auth", has("lib/apollo-client.ts", 'from "./auth"'));
check("apollo-client.ts has fetch wrapper that injects Authorization", has("lib/apollo-client.ts", 'headers.set("Authorization"'));
check("UsersPermissionsUser typePolicy keyed by id", has("lib/apollo-client.ts", 'UsersPermissionsUser: { keyFields: ["id"] }'));

// 8.3 GraphQL operations
console.log("\n8.3 lib/graphql.ts");
for (const op of ["LOGIN", "REGISTER", "ME"]) {
  check(`lib/graphql.ts exports ${op}`, has("lib/graphql.ts", `export const ${op} = gql\``));
}

// 8.4 login page
console.log("\n8.4 login page + action");
check("app/login/page.tsx exists", exists("app/login/page.tsx"));
check("app/login/actions.ts exists", exists("app/login/actions.ts"));
check("login action calls LOGIN mutation", has("app/login/actions.ts", "LOGIN"));
check("login action calls setJwt", has("app/login/actions.ts", "setJwt(jwt)"));
check("login action redirects on bad credentials", has("app/login/actions.ts", '/login?error=invalid'));

// register page (post implies but doesn't show full code)
console.log("\n8.4 register page + action (post says 'same shape')");
check("app/register/page.tsx exists", exists("app/register/page.tsx"));
check("app/register/actions.ts exists", exists("app/register/actions.ts"));
check("register action uses REGISTER mutation", has("app/register/actions.ts", "REGISTER"));

// 8.5 logout
console.log("\n8.5 logout");
check("app/logout/actions.ts exists", exists("app/logout/actions.ts"));
check("logout calls clearJwt", has("app/logout/actions.ts", "clearJwt()"));

// 8.6 proxy
console.log("\n8.6 proxy.ts");
check("proxy.ts exists at client root", exists("proxy.ts"));
check("proxyimports JWT_COOKIE from @/lib/auth", has("proxy.ts", 'from "@/lib/auth"'));
check("proxyallows /login + /register", has("proxy.ts", '"/login", "/register"'));
check("proxyredirects when no JWT", has("proxy.ts", "NextResponse.redirect"));
check("proxymatcher excludes _next/, favicon, api/", has("proxy.ts", "_next/|favicon|api/"));

// === API-level: login + register actually work end-to-end ===
console.log("\n8.x API-level: login/register mutations work against Strapi");

async function gql(query, variables) {
  const r = await fetch(GQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

const stamp = Date.now();
const username = `step8user-${stamp}`;
const email = `${username}@x.com`;
const password = "password123";

const reg = await gql(
  `mutation R($i: UsersPermissionsRegisterInput!){ register(input: $i){ jwt user { id username } } }`,
  { i: { username, email, password } }
);
const jwt = reg.data?.register?.jwt;
check("register mutation returns a JWT", !!jwt && jwt.length > 20);
check("register mutation returns user id+username", reg.data?.register?.user?.username === username);

const login = await gql(
  `mutation L($i: UsersPermissionsLoginInput!){ login(input: $i){ jwt user { id username } } }`,
  { i: { identifier: username, password } }
);
check("login mutation returns a JWT for the same user", !!login.data?.login?.jwt);

const meAnon = await gql(`{ me { id username } }`, {});
check("anonymous me query returns null (or error)", meAnon.data?.me === null || !!meAnon.errors);

// me with JWT
const meAuthed = await fetch(GQL, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` },
  body: JSON.stringify({ query: `{ me { id username } }` }),
}).then((r) => r.json());
check("authenticated me query returns the right user", meAuthed.data?.me?.username === username);

// === Page-level: proxybehavior ===
console.log("\n8.x Page-level: proxyredirect / public-route behavior");

async function fetchManual(path, headers = {}) {
  const r = await fetch(NEXT + path, { headers, redirect: "manual" });
  return { status: r.status, location: r.headers.get("location") };
}

// Anonymous home page → redirect to /login
const anonHome = await fetchManual("/");
check(`anonymous GET / redirects (status ${anonHome.status})`, anonHome.status === 307 || anonHome.status === 302);
check(`redirect target is /login`, (anonHome.location ?? "").includes("/login"));
check(`redirect preserves returnTo`, (anonHome.location ?? "").includes("returnTo=%2F"));

// Anonymous /notes/<id> → also redirect
const anonDetail = await fetchManual("/notes/some-id");
check("anonymous GET /notes/<id> redirects to /login", (anonDetail.status === 307 || anonDetail.status === 302) && (anonDetail.location ?? "").includes("/login"));

// /login itself does not redirect (PUBLIC_ROUTES)
const loginPage = await fetchManual("/login");
check("GET /login is not redirected (PUBLIC_ROUTES allows it)", loginPage.status === 200);

// /register also public
const registerPage = await fetchManual("/register");
check("GET /register is not redirected", registerPage.status === 200);

// With a valid JWT cookie, the home page should NOT redirect.
const cookieHeader = `strapi_jwt=${jwt}`;
const authedHome = await fetchManual("/", { cookie: cookieHeader });
check("authenticated GET / does NOT redirect", authedHome.status === 200);

// And the home page renders this user's notes only (none, since they just registered).
// Fetch the actual page body to confirm.
const homeFull = await fetch(NEXT + "/", { headers: { cookie: cookieHeader } });
const homeText = await homeFull.text();
check("authenticated home renders the page (status 200)", homeFull.status === 200);
check("home reports 0 active for fresh user", homeText.includes('[0,'));

// Login page & register page render their forms
const loginText = await fetch(NEXT + "/login").then((r) => r.text());
check("login page renders identifier input", loginText.includes('name="identifier"'));
check("login page renders password input", loginText.includes('name="password"'));
check("login page links to /register", loginText.includes('href="/register"'));

const registerText = await fetch(NEXT + "/register").then((r) => r.text());
check("register page renders username input", registerText.includes('name="username"'));
check("register page renders email input", registerText.includes('name="email"'));
check("register page renders password input", registerText.includes('name="password"'));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  • ${f}`));
  process.exit(1);
}
