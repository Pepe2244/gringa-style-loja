const { execSync } = require("child_process");

console.log("🚀 Executando OpenNext Cloudflare build...");
execSync("opennextjs-cloudflare build", {
  stdio: "inherit",
});
