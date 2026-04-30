// Step 2: Strapi boots, /admin and /api are reachable, an admin user can authenticate.

import { assert, header } from "./_lib.mjs";

header("Step 2: boot + admin");

// /admin should serve the SPA HTML at root. Use HEAD to avoid pulling the full body.
const admin = await fetch("http://localhost:1338/admin/", { method: "HEAD" });
assert(admin.status === 200, "/admin returns 200");

// /admin/init returns the admin bootstrap data; should be reachable without auth.
const init = await fetch("http://localhost:1338/admin/init");
assert(init.status === 200, "/admin/init returns 200");
const initJson = await init.json();
// After CLI-creating the admin, the project is no longer "first run"
assert(initJson.data?.hasAdmin === true, "init reports an admin exists");

// /api root: protected; reachable but auth-required is fine.
const api = await fetch("http://localhost:1338/api");
assert([200, 404, 405].includes(api.status), "/api responds with 200/404/405");

// Admin login round-trips with the seeded credentials.
const login = await fetch("http://localhost:1338/admin/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@test.local", password: "Testing123!" }),
});
assert(login.status === 200, "admin login returns 200");
const loginJson = await login.json();
assert(typeof loginJson.data?.token === "string" && loginJson.data.token.length > 10, "admin login returns a JWT");

console.log("\nStep 2 OK");
