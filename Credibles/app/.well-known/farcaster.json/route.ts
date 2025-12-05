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
        "iconUrl": "https://work-proof-seven.vercel.app/sphere.svg",
        "splashImageUrl": "https://work-proof-seven.vercel.app/sphere.svg",
        "splashBackgroundColor": "#000000",
        "subtitle": "Credential NFT Platform",
        "description": "Complete tasks to upgrade your SkillPet and mint achievement NFTs on Base",
        "primaryCategory": "defi",
        "tags": [
          "credentials",
          "nft",
          "learn"
        ],
        "tagline": "Learn and Earn Credentials",
        "ogTitle": "Credibles - WorkProof",
        "ogDescription": "Complete tasks to upgrade your SkillPet and earn verifiable credentials",
        "ogImageUrl": "https://work-proof-seven.vercel.app/sphere.svg",
        "noindex": false
      }
    });
  }