# 🚀 Builder Battle - Deploy Instructions

## Vercel Deployment Guide

### **Step 1: Prepare the Project**

1. **Ensure all files are in place:**
   ```
   builderbattle/
   ├── index.html
   ├── app.js
   ├── package.json
   ├── vercel.json
   ├── api/
   │   └── votes.js
   ├── winnerfirstedition.gif
   └── README.md
   ```

2. **Configure admin addresses:**
   - Edit `api/votes.js`
   - Update the `adminAddresses` array with your wallet addresses

### **Step 2: Deploy to Vercel**

#### **Option A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to builderbattle folder
cd builderbattle

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: builderbattle
# - Directory: ./
# - Override settings? N
```

#### **Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `adriangallery/adrianzero`
4. **Configure:**
   - **Root Directory**: `builderbattle`
   - **Framework Preset**: `Other`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
5. Click "Deploy"

### **Step 3: Configure Environment Variables**

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add the following variables:

```
ADMIN_ADDRESSES=0x4943407105999e3E97EFA2035F5cbC64D72581C6
```

### **Step 4: Test the Deployment**

1. **Visit your deployed URL**: `https://builderbattle.vercel.app`
2. **Test wallet connection**
3. **Test voting** (if you're admin)
4. **Test adding participants** (if you're admin)
5. **Test lottery drawing** (if you're admin)

## 🔧 **Configuration Options**

### **Admin Addresses**
Edit `api/votes.js` line 85-88:
```javascript
const adminAddresses = [
    '0xYourAddressHere',
    '0xAnotherAdminAddress'
];
```

### **Custom Domain**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed

### **Environment Variables**
Create `.env.local` file:
```env
ADMIN_ADDRESSES=0xYourAddress,0xAnotherAddress
```

## 📊 **Database Options**

### **Current: File-based (JSON)**
- ✅ **Simple**: No external dependencies
- ✅ **Free**: No database costs
- ⚠️ **Limited**: File size restrictions
- ⚠️ **Not scalable**: Single server instance

### **Upgrade Options:**

#### **1. Vercel KV (Redis)**
```bash
# Install Vercel KV
npm install @vercel/kv

# Add to vercel.json
{
  "kv": {
    "databases": [
      {
        "name": "builderbattle",
        "id": "your-kv-database-id"
      }
    ]
  }
}
```

#### **2. PlanetScale (MySQL)**
```bash
# Install PlanetScale
npm install @planetscale/database

# Add to vercel.json
{
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

#### **3. Supabase (PostgreSQL)**
```bash
# Install Supabase
npm install @supabase/supabase-js

# Add to vercel.json
{
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

## 🛠️ **Development**

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
vercel dev

# Open http://localhost:3000
```

### **Testing API**
```bash
# Test GET request
curl https://builderbattle.vercel.app/api/votes

# Test POST request (vote)
curl -X POST https://builderbattle.vercel.app/api/votes \
  -H "Content-Type: application/json" \
  -d '{"action":"vote","address":"0x...","participantId":1,"signature":"0x...","message":"..."}'
```

## 🔒 **Security Considerations**

### **Current Security**
- ✅ **Wallet signatures**: Cryptographic proof
- ✅ **Admin validation**: Address-based access control
- ✅ **CORS enabled**: Cross-origin requests allowed

### **Production Recommendations**
- ⚠️ **Rate limiting**: Add request throttling
- ⚠️ **Input validation**: Sanitize all inputs
- ⚠️ **Signature verification**: Verify wallet signatures
- ⚠️ **Admin authentication**: More sophisticated admin controls

## 📈 **Monitoring**

### **Vercel Analytics**
1. Go to Project Settings → Analytics
2. Enable Vercel Analytics
3. Monitor performance and usage

### **Custom Logging**
Add to `api/votes.js`:
```javascript
console.log('Vote received:', { address, participantId, timestamp: new Date() });
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. API not working**
- Check Vercel Functions logs
- Verify file structure
- Check environment variables

#### **2. Wallet connection fails**
- Ensure MetaMask is installed
- Check network connection
- Verify wallet permissions

#### **3. Admin functions not working**
- Verify admin address in code
- Check wallet connection
- Ensure correct address format

### **Debug Mode**
Add to `app.js`:
```javascript
const DEBUG = true;
if (DEBUG) console.log('Debug info:', data);
```

## 📞 **Support**

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues**: Create issue in repository
- **Community**: Discord/Telegram channels

---

**Happy Building! 🏗️**
