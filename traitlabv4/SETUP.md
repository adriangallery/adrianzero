# TraitLAB V4 - Setup Guide

## Environment Variables Configuration

### Required for Production (Vercel)

#### 1. Alchemy API Key (Recommended - Best Performance)

**Why Alchemy?**
- Free tier: 300M compute units/month
- Better rate limits than public endpoints
- Faster response times
- More reliable infrastructure

**How to get it:**
1. Go to [Alchemy](https://www.alchemy.com/)
2. Sign up for a free account
3. Create a new app:
   - Chain: **Base**
   - Network: **Base Mainnet**
4. Copy your API Key
5. Add to Vercel:
   - Go to your project settings
   - Environment Variables section
   - Add: `VITE_ALCHEMY_API_KEY` = `your_api_key_here`

#### 2. Infura API Key (Optional - Fallback)

Already configured with default key. Can be replaced with your own:
- Get from: [Infura](https://www.infura.io/)
- Variable: `VITE_INFURA_API_KEY`

### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   VITE_ALCHEMY_API_KEY=your_actual_alchemy_key
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add the following:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_ALCHEMY_API_KEY` | Your Alchemy API key | Production, Preview, Development |

4. Redeploy your application

### RPC Priority Order

The app will try RPCs in this order:

1. **Alchemy** (if API key is configured) ⭐ Best
2. **Infura** (with default or custom key)
3. **Public Base RPC** (fallback, rate limited)
4. **LlamaRPC** (fallback)
5. **PublicNode** (fallback)

### Benefits

**With Alchemy API Key:**
- ✅ No rate limiting errors (429)
- ✅ Faster loading times
- ✅ More reliable
- ✅ 300M compute units/month (free)

**Without API Key:**
- ⚠️ May hit rate limits with large wallets
- ⚠️ Slower performance
- ⚠️ Less reliable during peak times

### Troubleshooting

**"Too Many Requests" errors:**
- Make sure `VITE_ALCHEMY_API_KEY` is set in Vercel
- Verify the API key is valid
- Check you haven't exceeded your monthly quota

**Slow loading:**
- Add Alchemy API key for better performance
- Check your internet connection
- Try clearing browser cache

### Monitoring

Check your Alchemy dashboard to monitor:
- API usage
- Request volume
- Error rates
- Remaining compute units

### Cost

- Alchemy Free Tier: **$0/month** (300M compute units)
- Recommended for most apps
- Upgrade only if you exceed free tier limits
