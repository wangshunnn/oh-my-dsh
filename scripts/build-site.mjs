import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "site");
const output = resolve(root, "dist");
const dataOutput = resolve(output, "data");

await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
await mkdir(dataOutput, { recursive: true });
await cp(resolve(root, "registry/plugins.json"), resolve(dataOutput, "plugins.json"));

const collectionDirectory = resolve(root, "collections");
const collectionFiles = (await readdir(collectionDirectory)).filter((file) => file.endsWith(".json")).sort();
const collections = await Promise.all(collectionFiles.map(async (file) => JSON.parse(await readFile(resolve(collectionDirectory, file), "utf8"))));
await writeFile(resolve(dataOutput, "collections.json"), `${JSON.stringify(collections)}\n`);
await writeFile(resolve(output, ".nojekyll"), "");

console.log(`Built GitHub Pages site with ${collections.length} collections.`);
