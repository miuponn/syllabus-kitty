# Icons

Icon files for UI elements.

## Recommended Format

**SVG** is preferred for icons:
- Scalable to any size
- Small file size
- Can be styled with CSS
- Sharp on all displays

## Organization

Organize by category:
- `ui/` - UI icons (buttons, navigation, etc.)
- `social/` - Social media icons
- `features/` - Feature-specific icons

## Usage

### Inline SVG (Recommended)
```tsx
export default function Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
      {/* SVG path data */}
    </svg>
  );
}
```

### As Image
```tsx
<img src="/assets/icons/ui/upload.svg" alt="Upload" className="w-6 h-6" />
```

## Icon Libraries

Consider using icon libraries instead:
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted SVG icons
- [Lucide](https://lucide.dev/) - Icon toolkit
- [React Icons](https://react-icons.github.io/react-icons/) - Popular icons as React components

```tsx
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

<CloudArrowUpIcon className="w-6 h-6" />
```
