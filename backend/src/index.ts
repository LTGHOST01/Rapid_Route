import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { startJourneyTicker } from "./services/journeyTicker";

const app = createApp();

app.listen(env.PORT, () => {
  startJourneyTicker();
  logger.info("RapidRoute API listening", {
    port: env.PORT,
    googleConfigured: Boolean(env.GOOGLE_MAPS_API_KEY),
  });
});
