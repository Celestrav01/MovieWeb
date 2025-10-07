import mongoose from "mongoose";

const connectDB = async() => {
    try {
        mongoose.connection.on('connected', () => console.log("Connected to mongoDB atlas!"));  
        await mongoose.connect(`${process.env.MONGODB_URI}/QuickShow1`);
    } catch (error) {
        console.log(error);
    }
}

export default connectDB;