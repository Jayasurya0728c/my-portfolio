export const config = {
  api: {
    bodyParser: false, // Stream file data directly without buffering in RAM
  },
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, File-Name');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const fileName = req.headers['file-name'] || 'upload.mp4';
    const contentType = req.headers['content-type'] || 'application/octet-stream';

    console.log(`Starting proxy upload: fileName=${fileName}, contentType=${contentType}`);

    // Collect raw binary request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    console.log(`Collected buffer size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    if (buffer.length === 0) {
      console.error('Empty file payload received');
      return res.status(400).json({ error: 'Empty file payload' });
    }

    // Build raw multipart form-data payload manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="reqtype"\r\n\r\n` +
      `fileupload\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="fileToUpload"; filename="${fileName}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
    );
    
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([header, buffer, footer]);

    console.log(`Sending multipart payload to Catbox: size=${payload.length} bytes`);

    const catboxRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length.toString(),
      },
      body: payload,
    });

    const resText = await catboxRes.text();
    console.log(`Catbox response: status=${catboxRes.status}, body="${resText.trim()}"`);

    if (catboxRes.ok && resText.trim().startsWith('http')) {
      return res.status(200).json({ url: resText.trim() });
    } else {
      console.error(`Catbox rejected upload: status=${catboxRes.status}, body="${resText}"`);
      return res.status(500).json({ error: `CDN rejected upload: ${resText}` });
    }
  } catch (err) {
    console.error('Serverless upload proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
