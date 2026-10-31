const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Carrega vars de wrangler.jsonc para garantir que NEXT_PUBLIC_* estejam presentes no process.env durante o build no CI
try {
  const wranglerPath = path.join(__dirname, "..", "wrangler.jsonc");
  if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, "utf8");
    const varsMatch = content.match(/"vars"\s*:\s*\{([\s\S]*?)\}/);
    if (varsMatch) {
      const regex = /"([A-Za-z0-9_]+)"\s*:\s*"([^"]+)"/g;
      let m;
      while ((m = regex.exec(varsMatch[1])) !== null) {
        if (!process.env[m[1]]) {
          process.env[m[1]] = m[2];
        }
      }
    }
  }
} catch (err) {
  console.warn("Aviso ao carregar variáveis de wrangler.jsonc:", err.message);
}

console.log("🚀 Executando OpenNext Cloudflare build...");
execSync("opennextjs-cloudflare build", {
  stdio: "inherit",
  env: process.env,
});

