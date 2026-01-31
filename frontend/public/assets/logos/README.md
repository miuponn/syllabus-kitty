# Logos

Syllabus Kitty branding and logo files.

## Logo Variants

Suggested variants to include:
- `syllabus-kitty-logo.svg` - Main logo (full color)
- `syllabus-kitty-logo-white.svg` - White version (for dark backgrounds)
- `syllabus-kitty-logo-black.svg` - Black version (for light backgrounds)
- `syllabus-kitty-icon.svg` - Icon only (no text)
- `syllabus-kitty-wordmark.svg` - Text only (no icon)

## Favicon Files

- `favicon-32x32.png`
- `favicon-192x192.png`
- `favicon-512x512.png`
- `apple-touch-icon.png` (180x180px)

## Usage

```tsx
// In your component
<img 
  src="/assets/logos/syllabus-kitty-logo.svg" 
  alt="Syllabus Kitty"
  className="h-12 w-auto"
/>

// For Next.js Image
import Image from 'next/image';

<Image
  src="/assets/logos/syllabus-kitty-logo.svg"
  alt="Syllabus Kitty"
  width={200}
  height={50}
/>
```

## Favicon Setup

Place in `app/` directory (not here):
- `app/favicon.ico`
- `app/apple-icon.png`
- `app/icon.png`

Or reference from here in `app/layout.tsx`:
```tsx
export const metadata = {
  icons: {
    icon: '/assets/logos/favicon-32x32.png',
    apple: '/assets/logos/apple-touch-icon.png',
  },
}
```
