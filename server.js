// Simple HTTP server for serving the built application
import { createServer } from 'http';
import { readFile, readdir } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create server
const server = createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Determine the file path
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Add file extension if not present
    if (!extname(filePath)) {
        filePath = '/index.html';
    }
    
    // Map file extensions to MIME types
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    
    // Get MIME type
    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
    
    try {
        // Read the file
        const content = await readFile(join(__dirname, filePath), 'utf8');
        
        // Set headers and send response
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    } catch (error) {
        // Handle 404 errors
        if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>', 'utf-8');
        } else {
            // Handle other errors
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
        }
    }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
