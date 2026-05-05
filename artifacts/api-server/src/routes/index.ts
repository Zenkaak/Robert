import { Router, type IRouter } from "express";
import healthRouter from "./health";
import offersRouter from "./offers";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(offersRouter);
router.use(paymentsRouter);

export default router;
