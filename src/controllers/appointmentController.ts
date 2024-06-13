import { Request, Response } from "express";
import { Appointment } from "../models/Appointment";
import { User } from "../models/User";
import moment from 'moment';
export const listAppointments = async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    var appointments: any[] = [];
    const appointmentCount = await Appointment.countDocuments();
    try {
        if (appointmentCount) {
            appointments = await Appointment.find()
                .select('user startTime endTime createdAt')
                .skip(Number(page) - 1 * Number(limit))
                .limit(Number(limit));
        }
        return res.status(200).json({ data: appointments, count: appointmentCount });
    } catch (e: any) {
        console.log("Exception: 500: ", e.message);
        return res.status(500).json({ message: e.message });
    }
}

export const searchAppointments = async (req: Request, res: Response) => {
    const { searchString, startTime } = req.query;
    try {
        const query: any = {};

        if (searchString) {
            const searchRegex = new RegExp(searchString as string, 'i');
            query.$or = [
                { 'user.fullName': { $regex: searchRegex }},
                { 'user.status': { $regex: searchRegex }}
            ];
        }

        if (startTime) {
            query.startTime = new Date(startTime as string);
        }
        const appointments = await Appointment.find(query).populate('user');
        return res.status(200).json({ data: appointments });
    } catch (e: any) {
        console.log("Exception: 500: ", e.message);
        return res.status(500).json({ message: e.message });
    }
}

export const createAnAppointment = async (req: Request, res: Response) => {
    const { userId, startTime, endTime } = req.body;
    try {

        if (!startTime || !endTime) {
            return res.status(400).json({ message: "startTime and endTime are required" });
        }

        const start = moment(startTime, "YYYY-MM-DD HH:mm:ss").utc().toDate();
        const end = moment(endTime, "YYYY-MM-DD HH:mm:ss").utc().toDate();

        const now = new Date();

        if (start <= now) {
            return res.status(400).json({ message: "startTime must be in the future" });
        }
        const oneHourLater = new Date(start.getTime() + 60 * 60 * 1000);
        if (end > oneHourLater) {
            return res.status(400).json({ message: "End time must be within one hour of start time" });
        }

        /* Validating the user */
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.status !== 'active') {
            return res.status(400).json({ message: "Booking not allowed for inactive users" });
        }

        const startOfDay = moment(start).startOf('day').toDate();
        const endOfDay = moment(start).endOf('day').toDate();

        const existingAppointment = await Appointment.findOne({
            user: userId,
            startTime: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: "User can only book one appointment per day" });
        }
        /* Validating the time slot */
        const appointments = await Appointment.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    userStatus: '$user.status'
                }
            },
            {
                $match: {
                    $or: [
                        { startTime: { $lt: end, $gte: start } },
                        { endTime: { $gt: start, $lt: end } },
                        { startTime: { $lte: start }, endTime: { $gte: end } }
                    ],
                    userStatus: 'active'
                }
            }
        ]);
        if (appointments.length > 0) {
            return res.status(400).json({ message: "Time slot is not available" });
        }

        const appointmentCreate = new Appointment({ user: userId, startTime: start, endTime: end });
        await appointmentCreate.save();
        return res.status(200).json({
            message: "Appointment created successfully",
            data: {
                _id: appointmentCreate._id,
                user: userId,
                startTime: appointmentCreate.startTime,
                endTime: appointmentCreate.endTime
            }
        });
    } catch (e: any) {
        console.log("Exception: 500: ", e.message);
        return res.status(500).json({ message: e.message });
    }
}