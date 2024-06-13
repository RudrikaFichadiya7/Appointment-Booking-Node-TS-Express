import { Request, Response } from "express";
import { User } from "../models/User";

export const listUsers = async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query; // Rudrika: Check if dynamic page and limit working from Postman api testing.
    try {
        const users = await User.find({ role: "user" })
            .select('fullName email status role')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        let userCount = await User.countDocuments();
        return res.status(200).json({ data: users, count: userCount });
    } catch (e: any) {
        console.log("Exception: 500: ", e);
        return res.status(500).json({ message: e.message || "Exception occured" });
    }
}

export const searchUsers = async (req: Request, res: Response) => {
    const { searchString } = req.query;
    try {
        // Can also set filter for the role "admin" that only need to fetch "users", currently fetching all users
        const query: any = {};
        if (searchString) {
            const searchRegex = new RegExp(searchString as string, 'i');
            query.$or = [
                { fullName: { $regex: searchRegex } },
                { email: { $regex: searchRegex } },
                { status: { $regex: searchRegex } }
            ];
        }
        
        const users = await User.find(query).select('-password'); 
        return res.status(200).json({ data: users });
    } catch (e: any) {
        console.log("Exception: 500: ", e);
        return res.status(500).json({ message: e.message });
    }
}

export const createUser = async (req: Request, res: Response) => {
    const { fullName, email, password, status } = req.body;
    try {

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        //Basic validations
        if (!fullName) {
            return res.status(400).json({ message: "Full Name is required" });
        }
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }
        // Basic password complexity: At least 1 uppercase, 1 lowercase, and 1 digit
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one uppercase letter, one lowercase letter, and one digit" });
        }
        const user = new User({ fullName, email, password, status });
        await user.save();

        return res.status(201).json({
            message: "User created successfully",
            data: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                status: user.status
            }

        });

    } catch (e: any) {
        console.log("Exception: 500: ", e.message);
        return res.status(500).json({ message: e.message });
    }
}

export const updateUserStatus = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status } = req.body;
    try {
        if (status && (status !== 'active' && status !== 'inactive')) {
            return res.status(400).json({ message: 'Enter valid status' }); // In the case of front-end integration only expect values will be provided, this check will prevent the different data when we try with the postman API testing
        }
        const user = await User.findByIdAndUpdate(userId, { status }, { new: true })
        .select('-password -__v')
        .lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json({data: user});
    } catch (e: any) {
        return res.status(500).json({ message: e.message });
    }
};