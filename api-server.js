// QR Generator Pro - API Server
// Usar con Node.js: node api-server.js

const http = require('http');
const url = require('url');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 3000;
const API_KEY = 'qr-generator-pro-api-key'; // Cambiar en producción

// Rate limiting simple
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 100; // 100 requests por minuto

function checkRateLimit(ip) {
    const now = Date.now();
    const userLimit = rateLimit.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (now > userLimit.resetTime) {
        userLimit.count = 1;
        userLimit.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
        userLimit.count++;
    }
    
    rateLimit.set(ip, userLimit);
    return userLimit.count <= RATE_LIMIT_MAX;
}

// CORS headers
function getCORSHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        'Content-Type': 'application/json'
    };
}

// API Response helper
function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, getCORSHeaders());
    res.end(JSON.stringify(data));
}

// Generate QR Code
async function generateQR(data, options = {}) {
    const {
        size = 512,
        format = 'png',
        color = '#000000',
        bgColor = '#ffffff',
        errorCorrection = 'M'
    } = options;

    try {
        const qrDataUrl = await QRCode.toDataURL(data, {
            width: size,
            color: {
                dark: color,
                light: bgColor
            },
            errorCorrectionLevel: errorCorrection,
            margin: 1
        });

        return {
            success: true,
            data: qrDataUrl,
            format: format,
            size: size
        };
    } catch (error) {
        throw new Error('Failed to generate QR code: ' + error.message);
    }
}

// Request handler
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const ip = req.connection.remoteAddress || 'unknown';

    // CORS preflight
    if (req.method === 'OPTIONS') {
        sendResponse(res, 200, { message: 'CORS preflight successful' });
        return;
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
        // Check rate limit
        if (!checkRateLimit(ip)) {
            sendResponse(res, 429, {
                success: false,
                error: 'Rate limit exceeded. Maximum 100 requests per minute.'
            });
            return;
        }

        // Generate QR endpoint
        if (pathname === '/api/generate' && req.method === 'POST') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const { data, options } = JSON.parse(body);

                    if (!data) {
                        sendResponse(res, 400, {
                            success: false,
                            error: 'Missing required field: data'
                        });
                        return;
                    }

                    const result = await generateQR(data, options);
                    sendResponse(res, 200, result);

                } catch (error) {
                    sendResponse(res, 500, {
                        success: false,
                        error: error.message
                    });
                }
            });

            return;
        }

        // Generate QR endpoint (GET)
        if (pathname === '/api/generate' && req.method === 'GET') {
            try {
                const { data, size = 512, color = '#000000', bgColor = '#ffffff' } = parsedUrl.query;

                if (!data) {
                    sendResponse(res, 400, {
                        success: false,
                        error: 'Missing required parameter: data'
                    });
                    return;
                }

                const result = await generateQR(decodeURIComponent(data), {
                    size: parseInt(size),
                    color: color,
                    bgColor: bgColor
                });

                sendResponse(res, 200, result);

            } catch (error) {
                sendResponse(res, 500, {
                    success: false,
                    error: error.message
                });
            }

            return;
        }

        // API Info endpoint
        if (pathname === '/api/info' && req.method === 'GET') {
            sendResponse(res, 200, {
                name: 'QR Generator Pro API',
                version: '1.0.0',
                description: 'Generate QR codes programmatically',
                endpoints: {
                    'GET /api/info': 'Get API information',
                    'GET /api/generate?data=URL': 'Generate QR code (GET)',
                    'POST /api/generate': 'Generate QR code (POST)',
                    'GET /api/docs': 'Get API documentation'
                },
                limits: {
                    rateLimit: '100 requests per minute',
                    maxSize: '1024x1024 pixels',
                    formats: ['png', 'jpeg', 'svg']
                },
                example: {
                    get: 'GET /api/generate?data=https://example.com&size=512&color=%23000000',
                    post: {
                        method: 'POST',
                        url: '/api/generate',
                        body: {
                            data: 'https://example.com',
                            options: {
                                size: 512,
                                color: '#000000',
                                bgColor: '#ffffff',
                                errorCorrection: 'M'
                            }
                        }
                    }
                }
            });

            return;
        }

        // Documentation endpoint
        if (pathname === '/api/docs' && req.method === 'GET') {
            sendResponse(res, 200, {
                documentation: {
                    title: 'QR Generator Pro API Documentation',
                    version: '1.0.0',
                    baseUrl: `http://localhost:${PORT}`,
                    authentication: 'No authentication required (free tier)',
                    endpoints: [
                        {
                            path: '/api/info',
                            method: 'GET',
                            description: 'Get API information and available endpoints',
                            parameters: [],
                            response: {
                                success: 'boolean',
                                name: 'string',
                                version: 'string',
                                endpoints: 'object'
                            }
                        },
                        {
                            path: '/api/generate',
                            method: 'GET',
                            description: 'Generate a QR code with basic options',
                            parameters: [
                                { name: 'data', type: 'string', required: true, description: 'Data to encode (URL, text, etc.)' },
                                { name: 'size', type: 'number', required: false, default: 512, description: 'QR code size in pixels (256-1024)' },
                                { name: 'color', type: 'string', required: false, default: '#000000', description: 'QR code color (hex)' },
                                { name: 'bgColor', type: 'string', required: false, default: '#ffffff', description: 'Background color (hex)' }
                            ],
                            response: {
                                success: 'boolean',
                                data: 'string (base64 data URL)',
                                format: 'string',
                                size: 'number'
                            }
                        },
                        {
                            path: '/api/generate',
                            method: 'POST',
                            description: 'Generate a QR code with advanced options',
                            body: {
                                data: { type: 'string', required: true, description: 'Data to encode' },
                                options: {
                                    type: 'object',
                                    required: false,
                                    properties: {
                                        size: { type: 'number', default: 512 },
                                        color: { type: 'string', default: '#000000' },
                                        bgColor: { type: 'string', default: '#ffffff' },
                                        errorCorrection: { type: 'string', default: 'M', enum: ['L', 'M', 'Q', 'H'] }
                                    }
                                }
                            },
                            response: {
                                success: 'boolean',
                                data: 'string (base64 data URL)',
                                format: 'string',
                                size: 'number'
                            }
                        }
                    ],
                    errorCodes: {
                        400: 'Bad Request - Missing required parameters',
                        429: 'Too Many Requests - Rate limit exceeded',
                        500: 'Internal Server Error - Failed to generate QR code'
                    },
                    examples: {
                        javascript: `
// GET request
fetch('http://localhost:${PORT}/api/generate?data=https://example.com&size=512')
  .then(res => res.json())
  .then(data => console.log(data));

// POST request
fetch('http://localhost:${PORT}/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      size: 512,
      color: '#667eea',
      bgColor: '#ffffff'
    }
  })
})
.then(res => res.json())
.then(data => console.log(data));
                        `,
                        curl: `
# GET request
curl "http://localhost:${PORT}/api/generate?data=https://example.com&size=512"

# POST request
curl -X POST "http://localhost:${PORT}/api/generate" \\
  -H "Content-Type: application/json" \\
  -d '{"data":"https://example.com","options":{"size":512,"color":"#667eea"}}'
                        `
                    }
                }
            });

            return;
        }

        // 404 for unknown API routes
        sendResponse(res, 404, {
            success: false,
            error: 'API endpoint not found'
        });

        return;
    }

    // Non-API routes
    sendResponse(res, 404, {
        error: 'Not found',
        message: 'Use /api/info for API information or /api/docs for documentation'
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 QR Generator Pro API Server                          ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║                                                           ║
║   API Endpoints:                                          ║
║   - GET  /api/info     - API information                  ║
║   - GET  /api/docs     - API documentation                ║
║   - GET  /api/generate - Generate QR (GET)                ║
║   - POST /api/generate - Generate QR (POST)               ║
║                                                           ║
║   Rate Limit: 100 requests per minute                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = server;
