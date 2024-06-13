import express from "express";
import {
    listAppointments, searchAppointments, createAnAppointment
} from "../controllers/appointmentController";
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware, listAppointments);
router.get('/search', authMiddleware, searchAppointments);
router.post('/', authMiddleware, createAnAppointment);

export default router;