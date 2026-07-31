import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "dist");

if (outputRoot !== path.join(projectRoot, "dist")) {
  throw new Error("Unexpected build output path");
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(path.join(outputRoot, "server"), { recursive: true });
await mkdir(path.join(outputRoot, "client"), { recursive: true });
await cp(path.join(projectRoot, "img"), path.join(outputRoot, "client", "img"), { recursive: true });
await cp(path.join(projectRoot, "index.html"), path.join(outputRoot, "client", "index.html"));

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") url.pathname = "/index.html";
    const response = await env.ASSETS.fetch(new Request(url, request));
    if (response.status !== 404) return response;
    return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
  }
};
`;

await writeFile(path.join(outputRoot, "server", "index.js"), worker, "utf8");

const html = await readFile(path.join(outputRoot, "client", "index.html"), "utf8");
if (!html.includes("<title>Lisan")) throw new Error("Built page is missing its title");

console.log("Lisan site build complete");
