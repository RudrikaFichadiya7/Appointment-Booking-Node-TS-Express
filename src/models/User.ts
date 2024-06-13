import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  fullName: string;
  email: string;
  status: 'active' | 'inactive';
  password: string;
  role: 'admin' | 'user';
}

const userSchema = new Schema<IUser>({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    password: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], required: true, default: 'active' },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
},
{
  timestamps: true
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

export const User = model<IUser>('User', userSchema);
