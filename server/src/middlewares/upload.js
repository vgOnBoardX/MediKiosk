import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder_name', 
  api_key: process.env.CLOUDINARY_API_KEY || 'placeholder_key', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder_secret' 
});

const storage = multer.memoryStorage(); // Store files in memory so we can stream to Cloudinary

export const upload = multer({ storage });
export const cloudinaryInstance = cloudinary;
