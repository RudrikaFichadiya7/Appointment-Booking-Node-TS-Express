import express from "express";
import {
    listUsers, searchUsers, createUser, updateUserStatus
} from "../controllers/userController";
import { authMiddleware } from '../middlewares/authMiddleware';
const router = express.Router();

router.get('/', authMiddleware, listUsers);
router.get('/search', authMiddleware, searchUsers);
router.post('/', authMiddleware, createUser);
router.patch('/:userId/status', authMiddleware, updateUserStatus);

export default router;