import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export async function publishPages({ token, repository, commit, fetchImpl = fetch,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), log = console.log,
  pollAttempts = 60 }) {
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository || "") || !/^[a-f0-9]{40}$/.test(commit || "")) {
    throw new Error("Missing GitHub token, repository or commit");
  }
  const base = `https://api.github.com/repos/${repository}/pages/builds`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "MTG-Draft-pages-publisher" };
  const request = async (url, method) => fetchImpl(url, { method, headers, signal: AbortSignal.timeout(20000) });
  const retryable = status => [408, 409, 429].includes(status) || status >= 500;

  let accepted = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await request(base, "POST");
      // A successful response need not contain JSON. Never parse this body.
      await response.text();
      if (response.ok) { accepted = true; log(`Pages build accepted (HTTP ${response.status}).`); break; }
      if (!retryable(response.status)) throw new Error(`Pages build rejected: HTTP ${response.status}`);
      log(`Pages build request: HTTP ${response.status}; retrying.`);
    } catch (error) {
      if (error.message.startsWith("Pages build rejected:") || attempt === 3) throw error;
      log(`Pages build request failed (${error.name}); retrying.`);
    }
    if (attempt < 3) await sleep(2000 * 2 ** attempt);
  }
  if (!accepted) throw new Error("Pages build request failed after four attempts");

  for (let attempt = 0; attempt < pollAttempts; attempt++) {
    try {
      const response = await request(`${base}/latest`, "GET");
      if ([401, 403].includes(response.status)) throw new Error(`Cannot check Pages build: HTTP ${response.status}`);
      if (response.ok) {
        let build;
        try { build = await response.json(); } catch { log("Incomplete Pages status response; checking again."); }
        if (build?.commit === commit) {
          if (build.status === "built") { log(`Pages published commit ${commit}.`); return; }
          if (build.status === "errored") throw new Error("Pages build failed for the expected commit");
        }
      } else { await response.text(); }
    } catch (error) {
      if (error.message.startsWith("Cannot check Pages build:") || error.message.startsWith("Pages build failed")) throw error;
      log(`Pages status request failed (${error.name}); checking again.`);
    }
    if (attempt < pollAttempts - 1) await sleep(5000);
  }
  throw new Error(`Timed out waiting for Pages to publish ${commit}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  await publishPages({ token: process.env.GITHUB_TOKEN, repository: process.env.GITHUB_REPOSITORY, commit });
}
