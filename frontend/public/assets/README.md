# Assets Directory Structure

This directory contains all static assets for the Syllabus Kitty frontend.

## 📁 Directory Organization

```
public/assets/
├── fonts/          # Custom fonts (non-Google Fonts)
├── images/         # General images
├── logos/          # App logos and branding
├── icons/          # Icon files (SVG, PNG)
└── documents/      # Static documents (if needed)
```

## 🎨 Usage in Next.js

### Images
```tsx
import Image from 'next/image';

<Image 
  src="/assets/images/example.png" 
  alt="Description"
  width={500}
  height={300}
/>
```

### Fonts
Add custom fonts in `fonts/` and reference them in CSS:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/assets/fonts/CustomFont.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}
```

### Logos/Icons
```tsx
<img src="/assets/logos/logo.svg" alt="Syllabus Kitty" />
```

## 📝 Best Practices

- Use **WebP** format for images (better compression)
- Use **WOFF2** format for fonts (best browser support)
- Use **SVG** for logos and icons (scalable)
- Optimize images before adding them
- Use descriptive filenames (e.g., `syllabus-kitty-logo-purple.svg`)

## 🚫 What NOT to store here

- User-uploaded files (use backend uploads/)
- Generated files
- Temporary files
- Sensitive data or credentials

## 📏 Recommended Sizes

### Logos
- Main logo: 500x500px (SVG preferred)
- Favicon: 32x32px, 192x192px, 512x512px
- Social media preview: 1200x630px

### Images
- Hero images: 1920x1080px
- Thumbnails: 400x300px
- Keep file sizes under 200KB when possible
