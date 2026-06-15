import { Router } from "express";
import { createCheckout } from "../controllers/CheckoutController";

const router = Router();

router.post("/", createCheckout);

export default router;
