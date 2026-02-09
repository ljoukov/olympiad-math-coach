import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Mirrors ~/projects/spark/web:
// Use mkcert-trusted certs from ~/.localhost-certs so Chrome automation doesn't
// get blocked by the "Your connection is not private" interstitial.
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)
const localCertDir = path.join(os.homedir(), ".localhost-certs")
const keyPath = path.join(localCertDir, "localhost-key.pem")
const certPath = path.join(localCertDir, "localhost.pem")

const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)
if (!hasCerts) {
  const msg = [
    "HTTPS dev requires trusted local certs.",
    "Expected:",
    `  key:  ${keyPath}`,
    `  cert: ${certPath}`,
    "",
    "Create them once with mkcert:",
    "  brew install mkcert nss && mkcert -install",
    `  mkdir -p ${localCertDir}`,
    `  mkcert -key-file "${keyPath}" \\`,
    `         -cert-file "${certPath}" \\`,
    "         localhost 127.0.0.1 ::1",
    "",
    "Then run: pnpm dev",
  ].join("\n")
  console.error(msg)
  process.exit(1)
}

const extraArgs = process.argv.slice(2)

const args = [
  "dev",
  "--experimental-https",
  "--experimental-https-key",
  keyPath,
  "--experimental-https-cert",
  certPath,
  "--hostname",
  "localhost",
  ...extraArgs,
]

const localNextBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
)

const command = fs.existsSync(localNextBin) ? localNextBin : "next"

const child = spawn(command, args, {
  stdio: "inherit",
  env: process.env,
  cwd: projectRoot,
})

child.on("error", (err) => {
  console.error(
    `Failed to start dev server: ${err instanceof Error ? err.message : String(err)}`
  )
  process.exit(1)
})

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
