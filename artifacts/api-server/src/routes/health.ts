import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", async (_req, res): Promise<void> => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
