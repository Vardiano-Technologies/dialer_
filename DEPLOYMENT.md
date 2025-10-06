# AI Dialer - Vercel Deployment Guide

## Prerequisites
1. Vercel account (free at vercel.com)
2. GitHub account
3. Twilio account with credentials

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token  
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number
   - `NODE_ENV`: production

### 3. Update Frontend URLs
After deployment, update the frontend to use your Vercel domain:
- Replace `http://localhost:3000` with your Vercel URL
- Update in `src/pages/Dialer.tsx` and `public/agent-dashboard.html`

### 4. Test Deployment
- Visit your Vercel URL
- Test agent management at `your-url.vercel.app/agent-dashboard.html`
- Test dialer at `your-url.vercel.app/dialer`

## Important Notes
- Database is in-memory for Vercel (data resets on restart)
- For production, consider using a persistent database like PlanetScale or Supabase
- Twilio webhooks need public URLs (use ngrok for local testing)
