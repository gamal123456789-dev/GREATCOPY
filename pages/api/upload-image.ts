import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file upload - 1GB limit
const upload = multer({
  storage: multer.memoryStorage(),
  // 1GB file size limit
  limits: {
    fileSize: 1073741824,  // 1GB file size limit
    files: 10,             // Allow up to 10 files
    fields: 20,            // Allow up to 20 form fields
    fieldSize: 1073741824, // 1GB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept any file type
    cb(null, true);
  },
});

// Disable Next.js body parser for this route with optimizations
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,     // No response size limit
    externalResolver: true,   // Handle large file processing
  },
};

// Helper function to run multer
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('image'));

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save the original file without any processing or compression
    fs.writeFileSync(filePath, file.buffer);

    // Return the image URL
    const imageUrl = `/uploads/${fileName}`;
    
    res.status(200).json({
      success: true,
      imageUrl,
      originalName: file.originalname,
      size: file.buffer.length,
      mimeType: file.mimetype
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}