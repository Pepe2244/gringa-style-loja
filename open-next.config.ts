import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

const config = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: memoryQueue,
});

const openNextConfig = {
  ...config,
  buildCommand: "npm run build:next",
};

export default openNextConfig;
