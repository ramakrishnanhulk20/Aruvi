/**
 * CORS middleware for API routes
 * Restricts access to allowed origins in production
 */

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

const defaultOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://aruvi.vercel.app'
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export function setCorsHeaders(
  response: Response,
  request: Request,
  options: CorsOptions = {}
): Response {
  const opts = { ...defaultOptions, ...options };
  const origin = request.headers.get('origin');
  
  // Set appropriate headers
  const headers = new Headers(response.headers);
  
  // Handle origin
  if (opts.origin === '*') {
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (typeof opts.origin === 'string') {
    if (origin === opts.origin) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  } else if (Array.isArray(opts.origin)) {
    if (origin && opts.origin.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  }
  
  // Set other CORS headers
  if (opts.methods) {
    headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));
  }
  
  if (opts.allowedHeaders) {
    headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
  }
  
  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function handleCors(
  request: Request,
  options: CorsOptions = {}
): Response | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 });
    return setCorsHeaders(response, request, options);
  }
  
  return null;
}
