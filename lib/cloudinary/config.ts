// lib/cloudinary/config.ts
// Server-only. Never import this from a "use client" file.
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/*
  .env.local additions needed:

  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret

  Get these from https://console.cloudinary.com/ -> Dashboard.
  No upload preset needed since uploads are signed server-side.
*/