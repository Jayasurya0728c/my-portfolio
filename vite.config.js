import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'save-portfolio-data',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === 'POST' && req.url === '/api/save-local') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const filePath = path.resolve(__dirname, 'public/portfolio.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else if (req.method === 'POST' && req.url === '/api/upload-local') {
            const fileNameHeader = req.headers['file-name'] || 'file.png';
            const cleanName = path.basename(fileNameHeader).replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueName = `${Date.now()}_${cleanName}`;
            const uploadDir = path.resolve(__dirname, 'public/screenshots');
            
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const filePath = path.join(uploadDir, uniqueName);
            const writeStream = fs.createWriteStream(filePath);
            
            req.pipe(writeStream);
            
            writeStream.on('finish', () => {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ url: `/screenshots/${uniqueName}` }));
            });
            
            writeStream.on('error', (err) => {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
