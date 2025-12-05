import { NextRequest, NextResponse } from "next/server";
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402";

// Configure x402 middleware
const x402Gate = paymentMiddleware(
  process.env.WALLET_ADDRESS as `0x${string}`,
  {
    "/api/headhunter": {
      price: "5.00",
      network: "base-sepolia",
      config: {
        description: "Access Verified Talent Data",
      },
    },
  },
  facilitator
);

// Helper to convert Next.js request/response to Express-like format
async function handleRequest(request: NextRequest) {
  return new Promise<NextResponse>((resolve, reject) => {
    // Read request body if present
    let body: unknown = null;
    
    interface ExpressRequest {
      method: string;
      url: string;
      path: string;
      headers: Record<string, string>;
      get: (name: string) => string | null;
      body: unknown;
    }
    
    const req: ExpressRequest = {
      method: request.method,
      url: request.url,
      path: new URL(request.url).pathname,
      headers: Object.fromEntries(request.headers.entries()),
      get: (name: string) => request.headers.get(name),
      body: body,
    };

    let responseData: unknown = null;

    const res = {
      statusCode: 200,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      } as Record<string, string>,
      json: (data: unknown) => {
        responseData = data;
        resolve(NextResponse.json(data, { status: res.statusCode, headers: res.headers }));
      },
      status: (code: number) => {
        res.statusCode = code;
        return res;
      },
      setHeader: (name: string, value: string) => {
        res.headers[name] = value;
      },
      end: (data?: string | ArrayBuffer) => {
        if (data) {
          resolve(new NextResponse(data, { status: res.statusCode, headers: res.headers }));
        } else if (responseData) {
          resolve(NextResponse.json(responseData, { status: res.statusCode, headers: res.headers }));
        } else {
          resolve(new NextResponse(null, { status: res.statusCode, headers: res.headers }));
        }
      },
    } as {
      statusCode: number;
      headers: Record<string, string>;
      json: (data: unknown) => void;
      status: (code: number) => { statusCode: number; headers: Record<string, string>; json: (data: unknown) => void; end: (data?: string | ArrayBuffer) => void; };
      setHeader: (name: string, value: string) => void;
      end: (data?: string | ArrayBuffer) => void;
    };

    // Handle async body reading for POST/PUT requests
    const processMiddleware = async () => {
      if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
        try {
          const contentType = request.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            body = await request.json();
          } else if (contentType?.includes("text/")) {
            body = await request.text();
          } else {
            body = await request.arrayBuffer();
          }
          req.body = body;
        } catch {
          // Body might not be JSON or might be empty
          body = null;
        }
      }

      // Call x402 middleware
      x402Gate(req, res, (err?: Error | unknown) => {
        if (err) {
          // Middleware rejected - likely payment required (402)
          // Check if middleware already set status code
          if (res.statusCode === 402) {
            // Return 402 with payment details
            resolve(
              NextResponse.json(
                { 
                  error: "Payment required",
                  amount: "5.00",
                  recipient: process.env.WALLET_ADDRESS,
                  network: "base-sepolia"
                },
                { status: 402, headers: res.headers }
              )
            );
          } else {
            reject(err);
          }
        } else {
          // Payment verified - return mock talent data
          resolve(
            NextResponse.json({
              topTalent: [
                { name: "Alice", level: 5, category: "dev" },
                { name: "Bob", level: 3, category: "defi" },
              ],
            }, { headers: res.headers })
          );
        }
      });
    };

    processMiddleware().catch(() => {
      // If middleware sends 402, it should be in res.statusCode
      if (res.statusCode === 402) {
        // Return 402 with payment details
        resolve(
          NextResponse.json(
            { 
              error: "Payment required",
              amount: "5.00",
              recipient: process.env.WALLET_ADDRESS,
              network: "base-sepolia"
            },
            { status: 402, headers: res.headers }
          )
        );
      } else {
        // Other errors
        resolve(
          NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
          )
        );
      }
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    const response = await handleRequest(request);
    // Add CORS and COOP headers
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  } catch {
    const response = NextResponse.json(
      { error: "Payment required", amount: "5.00", recipient: process.env.WALLET_ADDRESS, network: "base-sepolia" },
      { status: 402 }
    );
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    return response;
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await handleRequest(request);
    // Add CORS and COOP headers
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  } catch {
    const response = NextResponse.json(
      { error: "Payment required", amount: "5.00", recipient: process.env.WALLET_ADDRESS, network: "base-sepolia" },
      { status: 402 }
    );
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    return response;
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  });
}

