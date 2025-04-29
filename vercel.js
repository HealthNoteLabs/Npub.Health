// This is a simple entrypoint for Vercel to understand the deployment
export default function handler(req, res) {
  res.status(200).json({
    message: 'Vercel is working!',
    environment: process.env.NODE_ENV,
    vercelInfo: {
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL
    }
  });
} 