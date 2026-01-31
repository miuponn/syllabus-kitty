# Images

General images for the application.

## Recommended Formats

- **WebP** - Best compression, modern browsers
- **PNG** - For images requiring transparency
- **JPEG** - For photos without transparency
- **SVG** - For illustrations and graphics

## Usage

```tsx
import Image from 'next/image';

<Image 
  src="/assets/images/your-image.webp"
  alt="Description"
  width={800}
  height={600}
  priority // Use for above-the-fold images
/>
```

## Organization Suggestions

- `backgrounds/` - Background images
- `illustrations/` - Decorative illustrations
- `screenshots/` - App screenshots
- `hero/` - Hero section images

## Optimization

Before adding images:
1. Resize to the maximum size you'll display
2. Compress using tools like:
   - https://squoosh.app/
   - https://tinypng.com/
   - ImageOptim (macOS)
3. Convert to WebP when possible
