# Syllabus Kitty Frontend 

Next.js 14 frontend for Syllabus Kitty - with App Router, Tailwind CSS, and Supabase authentication.

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project ([supabase.com](https://supabase.com))
- Backend server running on `http://localhost:8000`

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create `.env.local` with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   Get these from: Supabase Dashboard → Settings → API

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Required |

## Project Structure

```
app/
├── auth/
│   └── callback/     # Supabase OAuth callback handler
├── components/       # React components
│   ├── UploadSection.tsx
│   ├── PDFViewer.tsx
│   ├── SyllabusHeader.tsx
│   ├── AssessmentsList.tsx
│   ├── RecurringEventsList.tsx
│   └── ...
├── lib/              # Supabase client
├── providers/        # Auth context provider
├── syllabus/[id]/    # Dynamic syllabus view page
├── page.tsx          # Home/upload page
└── layout.tsx        # Root layout with Navbar
public/
└── assets/           # Static assets (images, fonts, icons, logos)
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Troubleshooting

### "Failed to fetch" or Network errors

**Backend not running:**
```bash
# Make sure backend is running on port 8000
cd ../backend
source venv/bin/activate
python main.py
```

**CORS error in console:**
- Check backend `.env` has your frontend URL in `ALLOWED_ORIGINS`:
  ```
  ALLOWED_ORIGINS=http://localhost:3000
  ```

### Environment variables not loading

- Make sure file is named `.env.local` (not `.env.local.txt`)
- Variables must start with `NEXT_PUBLIC_` to be accessible in browser
- Restart the dev server after changing env variables

### Supabase auth not working

**Redirect URI mismatch:**
- In Supabase Dashboard → Authentication → URL Configuration, add:
  ```
  http://localhost:3000/auth/callback
  ```

**Google OAuth not configured:**
- Supabase Dashboard → Authentication → Providers → Enable Google
- Add your Google OAuth Client ID and Secret

### Build fails with type errors

```bash
# Check for TypeScript errors
npm run lint

# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### Styles not loading / Tailwind not working

```bash
# Rebuild Tailwind
npm run dev
```

Check `tailwind.config.ts` includes all content paths:
```ts
content: ["./app/**/*.{js,ts,jsx,tsx}"]
```

