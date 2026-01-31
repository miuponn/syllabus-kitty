# Custom Fonts

Place your custom font files here.

## Supported Formats

- `.woff2` (recommended - best compression and support)
- `.woff` (fallback)
- `.ttf` / `.otf` (use only if woff not available)

## Example Usage

1. Add your font files to this directory
2. Reference in your CSS/globals.css:

```css
@font-face {
  font-family: 'YourFont';
  src: url('/assets/fonts/YourFont.woff2') format('woff2'),
       url('/assets/fonts/YourFont.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: 'YourFont', system-ui, sans-serif;
}
```

## 📝 Note

For Google Fonts, use Next.js built-in font optimization instead:
```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```
