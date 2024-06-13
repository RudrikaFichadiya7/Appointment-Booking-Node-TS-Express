import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';  // Import IUser

interface IAppointment extends Document {
    user: IUser['_id'];  // Use IUser
    startTime: Date;
    endTime: Date;
}

const appointmentSchema = new Schema<IAppointment>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }
},
    {
        timestamps: true
    });

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
