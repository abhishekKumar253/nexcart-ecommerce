import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk";
import helmet from "helmet";
import { getEnv } from "./lib/env";

const env = getEnv();
const app = express();

app.use(helmet());

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.use(express.json());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(clerkMiddleware());

app.listen(env.PORT || 5000, () => {
  console.log(`Server is running on port ${env.PORT || 5000}`);
});
