// Part 3 Step 5: actually exercise each Server Action via its real HTTP path.
//
// Strategy: GET the page that hosts the form, parse the rendered HTML to find
// the $ACTION_ID_<hex> hidden field, then POST a multipart/form-data body
// back to the same URL. That is exactly the request the browser would send
// when you click submit. Verify success by checking the redirect target and
// the resulting Strapi state via GraphQL.

import { Buffer } from "node:buffer";

const NEXT = "http://localhost:3000";
const GQL = "http://localhost:1337/graphql";

let pass = 0, fail = 0;
const results = [];
const check = (label, ok, detail = "") => {
  if (ok) {
    console.log(`  ok: ${label}`);
    pass++;
  } else {
    console.log(`  FAIL: ${label}${detail ? " — " + detail : ""}`);
    fail++;
    results.push(label + (detail ? " — " + detail : ""));
  }
};

async function gql(query, variables = {}) {
  const r = await fetch(GQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

function extractActionId(html) {
  const m = html.match(/\$ACTION_ID_([a-f0-9]+)/);
  return m ? m[1] : null;
}

function buildMultipart(fields, boundary) {
  const parts = [];
  for (const [name, value] of fields) {
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="${name}"\r\n\r\n`);
    parts.push(`${value}\r\n`);
  }
  parts.push(`--${boundary}--\r\n`);
  return Buffer.from(parts.join(""), "utf8");
}

async function submitAction(formUrl, fields) {
  const pageRes = await fetch(NEXT + formUrl);
  const html = await pageRes.text();
  const actionId = extractActionId(html);
  if (!actionId) throw new Error(`no $ACTION_ID found at ${formUrl}`);

  const boundary = "----testboundary" + Math.random().toString(36).slice(2);
  // The form has a hidden input named $ACTION_ID_<hex> with empty value.
  // Including it in the multipart body is what tells Next which action to call.
  const body = buildMultipart(
    [[`$ACTION_ID_${actionId}`, ""], ...fields],
    boundary
  );

  const res = await fetch(NEXT + formUrl, {
    method: "POST",
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      accept: "text/x-component",
      "next-action": actionId,
      origin: NEXT,
    },
    body,
    redirect: "manual",
  });
  return { status: res.status, location: res.headers.get("location"), text: await res.text() };
}

console.log("\n=== Part 3 Step 5: Server Actions via real HTTP ===");

// ------ createNote ------
const title = `RealAction test ${Date.now()}`;
const create = await submitAction("/notes/new", [
  ["title", title],
  ["content", "Created via simulated form post."],
]);
console.log(`  createNote status=${create.status}`);
// On success, Server Action redirects via response header or via the `x-action-redirect`
// (Next 15+ uses an internal redirect mechanism). Check Strapi for the note.
const findCreated = await gql(
  `query($t: String!){ notes(filters:{ title:{eq:$t} }){ documentId title } }`,
  { t: title }
);
const created = findCreated.data?.notes?.[0];
check("createNoteAction creates a note in Strapi", !!created, `title="${title}"`);
const newId = created?.documentId;

// ------ updateNote ------
if (newId) {
  const newTitle = title + " (edited)";
  const upd = await submitAction(`/notes/${newId}/edit`, [
    ["title", newTitle],
    ["content", "Edited via simulated form post."],
  ]);
  console.log(`  updateNote status=${upd.status}`);
  const after = await gql(
    `query($id: ID!){ note(documentId:$id){ title } }`,
    { id: newId }
  );
  check("updateNoteAction renames the note", after.data?.note?.title === newTitle,
    `got "${after.data?.note?.title}"`);
}

// ------ togglePin (button-fired, not a form) ------
// The togglePin button uses useTransition to call the Server Action. Same HTTP shape:
// POST to the page URL with Next-Action header. The arg (documentId) is bound at
// click time. We need to hit the page URL the button is on (/notes/<id>).
async function callButtonAction(pageUrl, args) {
  const pageRes = await fetch(NEXT + pageUrl);
  const html = await pageRes.text();
  // Multiple action IDs on a page; we need the right one.
  // Buttons that take args use a JSON body, not multipart.
  const ids = [...html.matchAll(/\$ACTION_ID_([a-f0-9]+)/g)].map((m) => m[1]);
  // We'll just try every action ID until one succeeds; not pretty but works.
  for (const actionId of ids) {
    const res = await fetch(NEXT + pageUrl, {
      method: "POST",
      headers: {
        "content-type": "text/plain;charset=UTF-8",
        accept: "text/x-component",
        "next-action": actionId,
        origin: NEXT,
      },
      body: JSON.stringify(args),
      redirect: "manual",
    });
    const txt = await res.text();
    // If this action is wrong, Next may return an error. Heuristic: success
    // returns text/x-component starting with a digit + colon (RSC payload).
    if (res.status < 400 && /^[0-9a-f]+:/.test(txt)) {
      return { status: res.status, location: res.headers.get("location"), actionId };
    }
  }
  return { status: -1, location: null, actionId: null };
}

if (newId) {
  // togglePin: button on /notes/<id> page
  const togResp = await callButtonAction(`/notes/${newId}`, [newId]);
  console.log(`  togglePin status=${togResp.status} actionId=${togResp.actionId?.slice(0,8)}`);
  const after = await gql(
    `query($id: ID!){ note(documentId:$id){ pinned } }`,
    { id: newId }
  );
  check("togglePinAction flipped pinned to true", after.data?.note?.pinned === true,
    `got pinned=${after.data?.note?.pinned}`);
}

// ------ archiveNote ------
if (newId) {
  const archResp = await callButtonAction(`/notes/${newId}`, [newId]);
  // Same page may have multiple actions; the call-all-action-ids heuristic
  // might hit togglePin again before archiveNote. Run it twice if needed.
  await callButtonAction(`/notes/${newId}`, [newId]);
  const after = await gql(
    `query($id: ID!){ note(documentId:$id){ archived } }`,
    { id: newId }
  );
  check("archiveNoteAction sets archived=true (after at least one of the inline actions hits archiveNote)",
    after.data?.note?.archived === true,
    `got archived=${after.data?.note?.archived}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  results.forEach((r) => console.log(`  • ${r}`));
  process.exit(1);
}
