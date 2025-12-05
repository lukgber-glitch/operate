# Chat File Upload - Visual Guide

## UI States

### 1. Normal State (No Files)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [📎] [🎤]  ┌─────────────────────────────────────┐  [▶]  │
│              │ Type your message...                │       │
│              │                                     │       │
│              └─────────────────────────────────────┘       │
│                                                             │
│  Press Enter to send, Shift + Enter for new line           │
│                         Drag & drop files or click 📎      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Dragging Files Over Input
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                    ⬆️                                   │ │
│ │            Drop files to attach                        │ │
│ │      PDF, images, Excel, CSV (max 10MB)               │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
       ^^^^^ Background accent, border highlighted ^^^^^
```

### 3. Files Attached
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ 📄 invoice.pdf  │  │ 🖼️ receipt.jpg  │               │
│  │ 245 KB      [x] │  │ 1.2 MB     [x] │               │
│  └──────────────────┘  └──────────────────┘               │
│      (red chip)           (blue chip)                      │
│                                                             │
│  [📎₂] [🎤]  ┌─────────────────────────────────────┐ [▶]  │
│               │ Type your message...                │      │
│               └─────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
   ^^^^ Badge shows "2" files attached
```

### 4. Error State
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️ File "document.docx" is not supported [Dismiss] │   │
│  └─────────────────────────────────────────────────────┘   │
│         ^^^^^ Red error message bar                        │
│                                                             │
│  [📎] [🎤]  ┌─────────────────────────────────────┐  [▶]  │
│              │ Type your message...                │       │
│              └─────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Attachment Chip Details

### PDF Attachment
```
┌────────────────────────┐
│ ┌────┐ invoice.pdf [x]│
│ │📄  │ 245 KB         │
│ └────┘                 │
└────────────────────────┘
  Red background
  (bg-red-100 text-red-700)
```

### Image Attachment
```
┌────────────────────────┐
│ ┌────┐ receipt.jpg [x]│
│ │🖼️ │ 1.2 MB         │
│ └────┘                 │
└────────────────────────┘
  Blue background
  (bg-blue-100 text-blue-700)

With Preview:
┌────────────────────────┐
│ ┌────┐ photo.png  [x] │
│ │📷  │ 850 KB         │
│ └────┘                 │
│  ^^^^ Actual thumbnail │
└────────────────────────┘
```

### Excel/CSV Attachment
```
┌────────────────────────┐
│ ┌────┐ expenses.xlsx[x]│
│ │📊  │ 512 KB         │
│ └────┘                 │
└────────────────────────┘
  Green background
  (bg-green-100 text-green-700)
```

## Icon Reference

### File Type Icons (lucide-react)

| Type  | Icon           | Usage              |
|-------|----------------|--------------------|
| PDF   | FileText       | PDFs               |
| Image | Image          | JPG, PNG, WEBP     |
| Excel | FileSpreadsheet| XLS, XLSX          |
| CSV   | FileSpreadsheet| CSV files          |
| Other | File           | Unsupported types  |

### UI Icons

| Icon      | Purpose                    | Location        |
|-----------|----------------------------|-----------------|
| Paperclip | Attach file button         | Input bar left  |
| Upload    | Drag overlay               | Center overlay  |
| X         | Remove attachment          | Chip top-right  |
| Send      | Send message               | Input bar right |
| Loader2   | Loading spinner            | Send button     |
| Mic       | Voice input (optional)     | Input bar left  |

## Color Palette

### File Type Colors

```css
/* PDF - Red */
bg-red-100    /* #fee2e2 */
text-red-700  /* #b91c1c */
border-red-200

/* Image - Blue */
bg-blue-100   /* #dbeafe */
text-blue-700 /* #1d4ed8 */
border-blue-200

/* Excel - Green */
bg-green-100  /* #dcfce7 */
text-green-700 /* #15803d */
border-green-200

/* CSV - Purple */
bg-purple-100  /* #f3e8ff */
text-purple-700 /* #7e22ce */
border-purple-200

/* Other - Gray */
bg-gray-100   /* #f3f4f6 */
text-gray-700 /* #374151 */
border-gray-200
```

### Semantic Colors

```css
/* Error */
bg-destructive/10    /* Light red background */
border-destructive/20 /* Red border */
text-destructive     /* Red text */

/* Drag Active */
bg-accent/50         /* Light accent */
border-primary       /* Primary color border */

/* Primary (Active state) */
text-primary         /* When files attached */
```

## Responsive Behavior

### Desktop (>768px)
- Full layout with hints on both sides
- Attachment chips in horizontal row
- All buttons visible

### Tablet (768px - 1024px)
- Slightly condensed
- Chips may wrap to 2 rows
- Hints remain visible

### Mobile (<768px)
- Bottom hint hidden (save space)
- Chips stack vertically
- Touch-optimized hit areas

## Interaction Flows

### Flow 1: Drag and Drop
```
User drags file over input
  ↓
Background highlights, overlay shows
  ↓
User drops file
  ↓
File validates (type, size)
  ↓
Preview chip appears
  ↓
User clicks send
  ↓
Files upload, message sends
  ↓
Chips clear
```

### Flow 2: Click to Browse
```
User clicks 📎 button
  ↓
File picker dialog opens
  ↓
User selects files (can multi-select)
  ↓
Files validate
  ↓
Preview chips appear
  ↓
User types message
  ↓
User clicks send
  ↓
Files upload, message sends
```

### Flow 3: Remove Before Send
```
User attaches files
  ↓
Preview chips appear
  ↓
User clicks [x] on a chip
  ↓
Chip removed from preview
  ↓
Counter updates
  ↓
User can add more or send
```

## Accessibility Features

### ARIA Labels
- File input: `aria-label="File upload input"`
- Attach button: `aria-label="Attach file"`
- Remove button: `aria-label="Remove {filename}"`
- Send button: `aria-label="Send message"`
- Message input: `aria-label="Message input"`

### Keyboard Navigation
- Tab: Navigate between buttons
- Enter: Activate button (send, remove, etc.)
- Space: Activate button
- Shift+Enter: New line in textarea

### Screen Reader Announcements
- Error messages: `aria-live="polite"`
- Character counter: `aria-live="polite"`
- File attached: Announced via tooltip

## Animation & Transitions

### Drag Over
```css
transition: colors 200ms ease-in-out
bg-background → bg-accent/50
border-default → border-primary
```

### Error Message
```css
Fade in: opacity 0 → 1 (150ms)
Slide down: translateY(-10px) → 0
```

### Chip Add/Remove
```css
Scale in: scale(0.95) → scale(1) (200ms)
Fade in: opacity 0 → 1
```

## Layout Specs

### Input Container
- Padding: 16px (p-4)
- Border: 1px solid (border-t)
- Background: Background color

### Attachment Chips
- Padding: 8px (p-2)
- Gap: 8px (gap-2)
- Border radius: 8px (rounded-lg)
- Min width: 180px
- Max width: 250px

### Icons
- Size: 16px (h-4 w-4)
- Thumbnail: 40px x 40px (h-10 w-10)

### Counter Badge
- Height: 20px (h-5)
- Padding: 6px (px-1.5)
- Font size: 12px (text-xs)
- Position: absolute -top-1 -right-1

## Tooltips

Hover states show additional information:

- **Attach button**: "Attach files (2/5)" - Shows count and limit
- **File chip**: Full filename if truncated
- **Remove button**: "Remove {filename}"

## Loading States

### During Upload
```
┌─────────────────────────────────────┐
│ [📎] [🎤]  [...........] [⏳]      │
│                 ↑           ↑       │
│              Loading    Disabled    │
│              spinner      send      │
└─────────────────────────────────────┘
```

### Upload Complete
```
Files clear automatically
Input returns to normal state
Ready for next message
```

## Edge Cases Handled

1. **Max files reached** → Error message, attach button disabled
2. **File too large** → Error message, file rejected
3. **Wrong file type** → Error message, file rejected
4. **Slow network** → Loading state shown
5. **Upload failure** → Error message, files retained
6. **Very long filename** → Truncated with ellipsis
7. **No message + no files** → Send button disabled
8. **Files only, no message** → Sends with "Attached files" text
