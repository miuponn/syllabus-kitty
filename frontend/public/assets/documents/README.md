# Documents

Static documents that need to be publicly accessible.

## Use Cases

- Privacy policy PDF
- Terms of service
- User guides
- Sample syllabi for demo purposes

## Usage

```tsx
<a href="/assets/documents/privacy-policy.pdf" download>
  Download Privacy Policy
</a>

// Or open in new tab
<a href="/assets/documents/user-guide.pdf" target="_blank" rel="noopener noreferrer">
  View User Guide
</a>
```

## Note

For user-uploaded documents (like syllabus PDFs), those should be stored in the backend's `uploads/` directory, not here.
