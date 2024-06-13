import express, {Request, Response} from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import userRoute from "./routes/userRoute";
import appointmentRoute from "./routes/appointmentRoute";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 7001;

//Middleware
app.use(bodyParser.json());

//Routes
app.use('/users', userRoute);
app.use('/appointments', appointmentRoute);

// Base URL Route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the API. Use /users or /appointments endpoints.' });
  });
  
  // Catch-all Route for Undefined Routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
  });
  
  // Error Handling Middleware
  app.use((err: any, req: Request, res: Response) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An unexpected error occurred!' });
  });
//Database connection
const mongoDBURI = process.env.MONGODB_URI || "mongodb://localhost:27017/appointment_system_db";
mongoose.connect(mongoDBURI, {})
    .then(() => { 
        console.log("Connection with mongo database successfully done!");
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(e => {
        console.error('Failed to connect to MongoDB', e);
    });