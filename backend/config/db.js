import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // reuse connections instead of opening new ones
      minPoolSize: 2, // keep a couple warm
      serverSelectionTimeoutMS: 8000, // fail fast instead of hanging
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
