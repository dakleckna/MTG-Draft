import { readFile, writeFile, rename } from "node:fs/promises";
import { discoverCatalog } from "./set-discovery.mjs";

const target = new URL("../drafts.json", import.meta.url);
const pending = new URL("../drafts.pending.json", import.meta.url);
const current = JSON.parse(await readFile(target, "utf8"));
const updated = await discoverCatalog(current);
await writeFile(pending, `${JSON.stringify(updated, null, 2)}\n`);
await rename(pending, target);
console.log(`Updated ${updated.length} published set reviews (including prerelease reviews).`);
