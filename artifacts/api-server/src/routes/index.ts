import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import exercisesRouter from "./exercises";
import vocabRouter from "./vocab";
import srsRouter from "./srs";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import classesRouter from "./classes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(exercisesRouter);
router.use(vocabRouter);
router.use(srsRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(classesRouter);

export default router;
