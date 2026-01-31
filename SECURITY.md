# 🔐 Environment Variables & Secrets Management

## ⚠️ CRITICAL SECURITY RULES

**NEVER commit these files to version control:**
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `credentials.json` (Google API credentials)
- `token.json` (OAuth tokens)

All these files are already in `.gitignore` to prevent accidental commits.

---

## 📁 Environment Files Structure

### Frontend (`/frontend`)

**`.env.local`** - Your actual secrets (gitignored ✅)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**`.env.example`** - Template (committed to git ✅)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`/backend`)

**`.env`** - Your actual secrets (gitignored ✅)
```bash
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL_ID=gemini-2.0-flash-exp
GOOGLE_CALENDAR_CREDENTIALS_PATH=./credentials.json
GOOGLE_CALENDAR_TOKEN_PATH=./token.json
HOST=0.0.0.0
PORT=8000
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
MAX_UPLOAD_SIZE_MB=25
UPLOAD_DIR=./uploads
```

**`.env.example`** - Template (committed to git ✅)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
# ... (same structure, but with placeholder values)
```

---

## 🚀 Setup Instructions

### First Time Setup

1. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your actual GEMINI_API_KEY
   ```

2. **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local if you need to change the API URL
   ```

### Getting API Keys

#### Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste it in `backend/.env` as `GEMINI_API_KEY=your_key_here`

#### Google Calendar API (Future Use)
1. Go to: https://console.cloud.google.com/
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Download `credentials.json` to `backend/` directory

---

## 🔒 What's Protected

### Frontend Environment Variables

| Variable | Description | Public? |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | Yes (NEXT_PUBLIC_ prefix means it's bundled into client code) |

**Note:** Any variable prefixed with `NEXT_PUBLIC_` is exposed to the browser. Never put secrets in NEXT_PUBLIC_ variables!

### Backend Environment Variables

| Variable | Description | Secret? |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | ⚠️ **YES - NEVER EXPOSE** |
| `GEMINI_MODEL_ID` | Model identifier | No |
| `GOOGLE_CALENDAR_CREDENTIALS_PATH` | Path to credentials.json | Path only (file is gitignored) |
| `GOOGLE_CALENDAR_TOKEN_PATH` | Path to token.json | Path only (file is gitignored) |
| `HOST` | Server host | No |
| `PORT` | Server port | No |
| `DEBUG` | Debug mode | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |
| `MAX_UPLOAD_SIZE_MB` | Max file size | No |
| `UPLOAD_DIR` | Upload directory | No |

---

## ✅ Security Checklist

Before deploying or committing:

- [ ] `.env` files are in `.gitignore`
- [ ] `.env.local` files are in `.gitignore`
- [ ] `credentials.json` is in `.gitignore`
- [ ] `token.json` is in `.gitignore`
- [ ] All secrets use `.env` files, not hardcoded
- [ ] `.env.example` files contain NO actual secrets
- [ ] Run `git status` to verify no secret files are staged
- [ ] Frontend uses environment variables for API URL
- [ ] Backend uses environment variables for API keys

---

## 🔍 Checking for Exposed Secrets

### Before committing:
```bash
# Check what files are staged
git status

# Check if any .env files are tracked
git ls-files | grep -E '\.env$|\.env\.local$|credentials\.json$|token\.json$'

# Should return nothing! If it shows files, they're being tracked (BAD!)
```

### If you accidentally committed secrets:

```bash
# DON'T PANIC! Remove the file from git history:
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env.local

# Commit the removal
git commit -m "Remove accidentally committed secrets"

# IMPORTANT: Rotate/regenerate any exposed API keys immediately!
```

---

## 🌍 Deployment Considerations

### Production Environment Variables

For production deployments (Vercel, Heroku, etc.):

1. **Never** commit production secrets
2. Use the platform's environment variable settings:
   - Vercel: Project Settings → Environment Variables
   - Heroku: Settings → Config Vars
   - AWS: Systems Manager → Parameter Store
3. Use different API keys for production vs development
4. Set `DEBUG=False` in production
5. Update `ALLOWED_ORIGINS` to include your production domain

### Example Production Setup (Vercel)

In Vercel dashboard, add these environment variables:
- `NEXT_PUBLIC_API_URL` → `https://your-api-domain.com`

For backend (if deploying separately):
- `GEMINI_API_KEY` → `your_production_key`
- `ALLOWED_ORIGINS` → `https://your-frontend-domain.com`
- `DEBUG` → `False`

---

## 🆘 Troubleshooting

### "Cannot read property 'NEXT_PUBLIC_API_URL' of undefined"

**Solution:** Make sure `.env.local` exists in the `frontend/` directory

```bash
cd frontend
cp .env.example .env.local
```

Then restart the Next.js dev server:
```bash
npm run dev
```

### "Invalid API key" error from Gemini

**Solution:** Check your `backend/.env` file:

1. Make sure `GEMINI_API_KEY` has your actual key (no quotes needed)
2. No spaces around the `=` sign
3. No trailing spaces
4. The key should start with something like `AIza...`

### Backend can't find environment variables

**Solution:** Make sure `backend/.env` exists:

```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

---

## 📝 Summary

✅ **DO:**
- Use `.env` and `.env.local` files for secrets
- Keep `.env.example` files updated (with placeholder values)
- Check `.gitignore` includes all secret files
- Use environment variables in code
- Rotate keys if they're exposed

❌ **DON'T:**
- Hardcode API keys in source code
- Commit `.env` or `.env.local` files
- Put secrets in filenames or comments
- Share your `.env` files via Slack/email
- Use production keys in development

---

## 🔗 References

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Python-dotenv Documentation](https://github.com/theskumar/python-dotenv)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
