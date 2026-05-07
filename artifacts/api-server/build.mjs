import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, mkdir, copyFile, writeFile, readdir } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
// Monorepo root is two levels up from artifacts/api-server
const monorepoRoot = path.resolve(artifactDir, "../..");

async function buildAll() {
  // Step 1: Compile @workspace/api-zod to JavaScript first so esbuild can
  // resolve it (package.json exports "./dist/index.js") and so Vercel
  // serverless functions can import it at runtime.
  const apiZodDir = path.resolve(monorepoRoot, "lib/api-zod");
  const tscBin = path.resolve(monorepoRoot, "node_modules/.bin/tsc");
  console.log("Building @workspace/api-zod...");
  execSync(`"${tscBin}" -p tsconfig.json`, { cwd: apiZodDir, stdio: "inherit" });
  console.log("✓ @workspace/api-zod compiled to lib/api-zod/dist/");

  // Step 2: Bundle the api-server with esbuild
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [
      path.resolve(artifactDir, "src/index.ts"),
      path.resolve(artifactDir, "src/vercel-entry.ts"),
    ],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
    sourcemap: "linked",
    plugins: [
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });

  // Step 3: Vercel Build Output API v3 — write to the MONOREPO ROOT so Vercel
  // finds it (the Vercel project root is the monorepo root, not artifacts/api-server).
  const vercelOutDir = path.resolve(monorepoRoot, ".vercel", "output");
  const funcDir = path.resolve(vercelOutDir, "functions", "index.func");

  await rm(vercelOutDir, { recursive: true, force: true });
  await mkdir(funcDir, { recursive: true });

  const distFiles = await readdir(distDir);
  await Promise.all(
    distFiles.map((f) =>
      copyFile(path.resolve(distDir, f), path.resolve(funcDir, f))
    )
  );

  await writeFile(
    path.resolve(funcDir, ".vc-config.json"),
    JSON.stringify(
      {
        runtime: "nodejs20.x",
        handler: "vercel-entry.mjs",
        launcherType: "Nodejs",
      },
      null,
      2
    )
  );

  await writeFile(
    path.resolve(vercelOutDir, "config.json"),
    JSON.stringify(
      {
        version: 3,
        routes: [{ src: "/(.*)", dest: "/index" }],
      },
      null,
      2
    )
  );

  console.log("✓ Vercel Build Output written to .vercel/output/ (monorepo root)");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
