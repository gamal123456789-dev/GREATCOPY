import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    return res.status(200).end();
  }
  
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath } = req.query;
    
    if (!filePath || !Array.isArray(filePath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const fileName = filePath.join('/');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', fileName);

    // Security check: ensure the path is within uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    const fileStats = await stat(resolvedPath);
    if (!fileStats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Read and serve the file
    const fileBuffer = await readFile(resolvedPath);
    
    // Set appropriate content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    let isDownloadable = false;
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        isDownloadable = true;
        break;
      case '.doc':
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        isDownloadable = true;
        break;
      case '.txt':
        contentType = 'text/plain';
        isDownloadable = true;
        break;
      case '.zip':
        contentType = 'application/zip';
        isDownloadable = true;
        break;
    }

    // Set cache headers - shorter cache for better refresh behavior
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.setHeader('ETag', `"${fileStats.mtime.getTime()}-${fileStats.size}"`);
    res.setHeader('Last-Modified', fileStats.mtime.toUTCString());
    res.setHeader('Content-Length', fileStats.size);
    
    // VPS-specific headers for better download support
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    // Add Content-Disposition for downloadable files
    if (isDownloadable) {
      const filename = path.basename(fileName);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Handle conditional requests for better performance
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    const etag = `"${fileStats.mtime.getTime()}-${fileStats.size}"`;
    
    if (ifNoneMatch === etag || (ifModifiedSince && new Date(ifModifiedSince) >= fileStats.mtime)) {
      return res.status(304).end();
    }
    
    return res.status(200).send(fileBuffer);
    
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(404).json({ error: 'File not found' });
  }
}

export const config = {
  api: {
    responseLimit: '20mb',
  },
};