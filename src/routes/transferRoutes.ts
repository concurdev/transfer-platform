import express from "express";
import { transferHandler, checkTransferStatus } from "../controllers/transferController";

const router = express.Router();
router.post("/transfer", transferHandler);
router.get("/transfer/status/:transferId", checkTransferStatus);

export default router;
