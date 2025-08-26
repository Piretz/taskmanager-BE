import express from "express";
import { addReport, getETA } from "../controllers/etaController.js";

const router = express.Router();

router.post("/report", addReport); 
router.get("/eta", getETA); 

export default router;
