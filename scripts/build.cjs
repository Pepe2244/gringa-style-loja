const { execSync } = require("child_process");

// Quando o @opennextjs/cloudflare chama o build internamente, ele define OPEN_NEXT_BUILD=true
// ou executa o Next.js diretamente. Se não estiver no contexto do OpenNext, iniciamos o build do OpenNext.
if (process.env.OPEN_NEXT_BUILD === "true") {
  console.log("⚡ Executando Next.js build (interno do OpenNext)...");
  execSync("next build --webpack", { stdio: "inherit" });
} else {
  console.log("🚀 Executando OpenNext Cloudflare build...");
  execSync("opennextjs-cloudflare build", {
    stdio: "inherit",
    env: {
      ...process.env,
      OPEN_NEXT_BUILD: "true",
    },
  });
}
