function withValidProperties(properties: Record<string, undefined | string | string[]>) {
    return Object.fromEntries(
      Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
    );
  }
  
  export async function GET() {
    const URL = process.env.NEXT_PUBLIC_URL as string;
    
    return Response.json({
      "accountAssociation": {
        "header": "eyJmaWQiOjEzOTkxOTAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg2RWUwMzExYWNFNDQwYjNDYzAwMzA3MWJDY0VmMmI0ZTZDQzM2MjIzIn0",
        "payload": "eyJkb21haW4iOiJ3b3JrLXByb29mLXNldmVuLnZlcmNlbC5hcHAifQ",
        "signature": "47KeaLqMLSV406xjUHaOcBoQ5Vjwy1HKLhcoC2Izaw0r2F9bXGvLdB0xiLFpzTzqCfXHzuNdgduZ/9mBvnkW0Bw="
      },
      "baseBuilder": {
        "ownerAddress": "0x37058bec8B2Ab89188742765843dDDD3fD23199f"
      },
      "miniapp": {
        "version": "1",
        "name": "Credibles",
        "homeUrl": "https://work-proof-seven.vercel.app",
        "iconUrl": "https://ex.co/i.png",
        "splashImageUrl": "https://ex.co/l.png",
        "splashBackgroundColor": "#000000",
        "webhookUrl": "https://ex.co/api/webhook",
        "subtitle": "Fast, fun, social",
        "description": "A fast, fun way to challenge friends in real time.",
        "screenshotUrls": [
          "https://ex.co/s1.png",
          "https://ex.co/s2.png",
          "https://ex.co/s3.png"
        ],
        "primaryCategory": "social",
        "tags": [
          "learn",
          "miniapp",
          "baseapp"
        ],
        "heroImageUrl": "https://ex.co/og.png",
        "tagline": "Learn and Earn",
        "ogTitle": "Credibles",
        "ogDescription": "Complete tasks to upgrade your skills pet",
        "ogImageUrl": "https://ex.co/og.png",
        "noindex": true
      }
    });
  }