import express from "express";
import transferRoutes from "./routes/transferRoutes";
import env from "./config/env";
import { Logger } from "./utils/logger";
import { colorMsg } from "./utils/helper";
import { GREEN_COLOR } from "./utils/constants";

const logger = Logger.getInstance();

const app = express();
app.use(express.json());
app.use("/api", transferRoutes);

const PORT = env.server.port;
const serverUrl = `${env.server.url}`;

app.listen(PORT, () => {
  logger.info(colorMsg(`Server running on ${serverUrl}`, GREEN_COLOR));
});

export default app;
