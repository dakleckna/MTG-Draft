import { test } from "node:test";
import assert from "node:assert/strict";
import { publishPages } from "./publish-pages.mjs";

const commit = "a".repeat(40);
const options = { token: "test-token", repository: "test/repo", commit,
  sleep: async () => {}, log: () => {}, pollAttempts: 4 };
const built = () => Response.json({ status: "built", commit });

test("empty successful POST response is accepted and real build is checked", async () => {
  const calls = [];
  await publishPages({ ...options, fetchImpl: async (url, init) => {
    calls.push(init.method);
    return init.method === "POST" ? new Response(null, { status: 201 }) : built();
  } });
  assert.deepEqual(calls, ["POST", "GET"]);
});

test("retries network errors and 5xx, tolerates truncated status JSON, waits for correct commit", async () => {
  const responses = [new TypeError("network"), new Response("", { status: 502 }),
    new Response("", { status: 201 }), new Response("{"),
    Response.json({ status: "built", commit: "b".repeat(40) }), built()];
  await publishPages({ ...options, fetchImpl: async () => {
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return response;
  } });
  assert.equal(responses.length, 0);
});

test("permission errors, failed builds and polling timeout remain real failures", async () => {
  await assert.rejects(publishPages({ ...options, fetchImpl: async () => new Response("", { status: 403 }) }), /HTTP 403/);
  await assert.rejects(publishPages({ ...options, fetchImpl: async (_, init) => init.method === "POST"
    ? new Response("", { status: 201 }) : Response.json({ status: "errored", commit }) }), /build failed/);
  await assert.rejects(publishPages({ ...options, fetchImpl: async (_, init) => init.method === "POST"
    ? new Response("", { status: 201 }) : Response.json({ status: "building", commit }) }), /Timed out/);
});
