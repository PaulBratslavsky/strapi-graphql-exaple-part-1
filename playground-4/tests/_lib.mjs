import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const SERVER = new URL("../server/", import.meta.url).pathname.replace(/\/$/, "");
export const CLIENT = new URL("../client/", import.meta.url).pathname.replace(/\/$/, "");
export const NEXT_URL = "http://localhost:3000";
export const GQL_URL = "http://localhost:1337/graphql";

export function assert(cond, msg) {
  if (!cond) {
    console.error("  FAIL:", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log("  ok:", msg);
}

export function fileContains(rel, needle, root = SERVER) {
  const t = readFileSync(join(root, rel), "utf8");
  return t.includes(needle);
}

export function fileExists(rel, root = SERVER) {
  return existsSync(join(root, rel));
}

export function readFile(rel, root = SERVER) {
  return readFileSync(join(root, rel), "utf8");
}

export async function fetchPage(path) {
  const r = await fetch(NEXT_URL + path);
  return { status: r.status, text: await r.text() };
}

export async function gql(query, variables = {}, headers = {}) {
  const r = await fetch(GQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });
  return { status: r.status, json: await r.json() };
}

export function header(label) {
  console.log(`\n=== ${label} ===`);
}

export async function register(username) {
  const u = `${username}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const r = await gql(
    `mutation R($input: UsersPermissionsRegisterInput!) {
      register(input: $input) { jwt user { id username email } }
    }`,
    { input: { username: u, email: `${u}@x.com`, password: "password123" } }
  );
  if (r.json.errors) throw new Error(`register failed: ${JSON.stringify(r.json.errors)}`);
  return { jwt: r.json.data.register.jwt, user: r.json.data.register.user };
}

export function authHeader(jwt) {
  return { Authorization: `Bearer ${jwt}` };
}
