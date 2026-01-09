// Simple HTTP server for serving the built application
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = join(__dirname, 'dist');

// Create server
const server = createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Determine the file path
    let filePath = req.url;
    
    // If root path, serve index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }
    // If no extension, it's a SPA route, serve index.html
    else if (!extname(filePath)) {
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
        // Read the file from dist directory
        const content = await readFile(join(DIST_DIR, filePath), 'utf8');
        
        // Set headers and send response
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    } catch (error) {
        // Handle 404 errors
        if (error.code === 'ENOENT') {
            console.error(`File not found: ${join(DIST_DIR, filePath)}`);
            // For SPA, serve index.html even if file not found
            try {
                const indexContent = await readFile(join(DIST_DIR, '/index.html'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(indexContent, 'utf-8');
            } catch (indexError) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            }
        } else {
            // Handle other errors
            console.error(`Server error: ${error}`);
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
        }
    }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving files from: ${DIST_DIR}`);
});
