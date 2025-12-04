# Command Palette Integration Checklist

## Pre-Integration Checks

### Dependencies
- [ ] Install `zustand`: `npm install zustand`
- [ ] Install `cmdk`: `npm install cmdk`
- [ ] Install `lucide-react`: `npm install lucide-react`
- [ ] Verify `@radix-ui/react-icons` is installed
- [ ] Verify `@radix-ui/react-dialog` is installed
- [ ] Check all dependencies are compatible with Next.js 14

### File Verification
- [ ] Verify all component files exist in `apps/web/src/components/command-palette/`
- [ ] Verify all hook files exist in `apps/web/src/hooks/`
- [ ] Check that `components/ui/command.tsx` exists (shadcn/ui)
- [ ] Check that `components/ui/dialog.tsx` exists (shadcn/ui)

## Integration Steps

### 1. Add Provider to Layout
- [ ] Open `app/layout.tsx` or `app/(dashboard)/layout.tsx`
- [ ] Import `CommandPaletteProvider`
```tsx
import { CommandPaletteProvider } from '@/components/command-palette';
```
- [ ] Wrap children with provider
```tsx
<CommandPaletteProvider>
  {children}
</CommandPaletteProvider>
```
- [ ] Save file

### 2. Test Basic Functionality
- [ ] Start development server: `npm run dev`
- [ ] Navigate to any page
- [ ] Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- [ ] Verify modal opens
- [ ] Verify input has focus
- [ ] Type a search query
- [ ] Verify results appear
- [ ] Use arrow keys to navigate
- [ ] Press `Enter` to select
- [ ] Press `Escape` to close

### 3. Add Search Button (Optional)
- [ ] Open your navbar component
- [ ] Import hook: `import { useCommandPalette } from '@/hooks/useCommandPalette';`
- [ ] Add button:
```tsx
const { open } = useCommandPalette();
<button onClick={open}>Search ⌘K</button>
```
- [ ] Test button opens modal

## API Integration

### 1. Create API Routes
- [ ] Create `/api/search/invoices/route.ts`
- [ ] Create `/api/search/expenses/route.ts`
- [ ] Create `/api/search/clients/route.ts`
- [ ] Create `/api/search/reports/route.ts`
- [ ] Implement search logic with Prisma
- [ ] Test API routes with curl or Postman

### 2. Update Search Hook
- [ ] Open `apps/web/src/hooks/useGlobalSearch.ts`
- [ ] Replace mock search functions with API calls
- [ ] Update error handling
- [ ] Test each category
- [ ] Verify results format matches type

### 3. Test Integration
- [ ] Test search returns real data
- [ ] Test pagination works
- [ ] Test error states display correctly
- [ ] Test empty states display correctly
- [ ] Verify loading states work

## Customization

### 1. Add Custom Categories
- [ ] Update `SearchCategory` type in `useGlobalSearch.ts`
- [ ] Add search function to `mockSearchAPI`
- [ ] Add category label to `SearchCategory.tsx`
- [ ] Add to `categoryOrder` in `SearchResults.tsx`
- [ ] Test new category

### 2. Add Icons
- [ ] Import icons from `lucide-react`
- [ ] Add icons to search results
- [ ] Test icon display
- [ ] Verify icon alignment

### 3. Style Customization
- [ ] Update colors in Tailwind config if needed
- [ ] Customize modal size in `CommandPaletteModal.tsx`
- [ ] Adjust spacing in components
- [ ] Test dark mode appearance
- [ ] Test responsive layout

## Testing

### Unit Tests
- [ ] Write tests for `useCommandPalette`
- [ ] Write tests for `useGlobalSearch`
- [ ] Write tests for `useDebounce`
- [ ] Write tests for each component
- [ ] Run tests: `npm test`
- [ ] Verify all tests pass

### Integration Tests
- [ ] Test full search flow
- [ ] Test keyboard navigation
- [ ] Test recent searches
- [ ] Test result selection
- [ ] Test navigation
- [ ] Test action execution

### E2E Tests
- [ ] Write Playwright tests
- [ ] Test Cmd+K shortcut
- [ ] Test search and select flow
- [ ] Test across browsers
- [ ] Run E2E tests: `npm run e2e`

## Performance Optimization

### 1. Debouncing
- [ ] Verify debounce delay is appropriate (300ms default)
- [ ] Adjust if needed for your use case
- [ ] Test with fast typing

### 2. Result Limiting
- [ ] Set max results per category (10-20)
- [ ] Add pagination if needed
- [ ] Test with large datasets

### 3. Caching
- [ ] Implement React Query or SWR (optional)
- [ ] Cache recent searches
- [ ] Cache API responses
- [ ] Test cache invalidation

### 4. Code Splitting
- [ ] Verify lazy loading works
- [ ] Check bundle size
- [ ] Optimize imports

## Accessibility

### 1. Keyboard Navigation
- [ ] Test all keyboard shortcuts
- [ ] Test tab navigation
- [ ] Test focus management
- [ ] Test with keyboard only

### 2. Screen Readers
- [ ] Test with screen reader
- [ ] Verify ARIA labels
- [ ] Check announcements
- [ ] Test focus indicators

### 3. Visual Accessibility
- [ ] Test color contrast
- [ ] Test with high contrast mode
- [ ] Test text sizing
- [ ] Verify responsive design

## Browser Testing

- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Test on mobile Chrome
- [ ] Test on mobile Safari

## Documentation

- [ ] Read `README.md`
- [ ] Read `INTEGRATION_GUIDE.md`
- [ ] Read `ARCHITECTURE.md`
- [ ] Update team documentation
- [ ] Add to onboarding guide

## Security

- [ ] Verify search queries are sanitized
- [ ] Check for XSS vulnerabilities
- [ ] Test authorization for search results
- [ ] Verify sensitive data is not exposed
- [ ] Test rate limiting if needed

## Analytics (Optional)

- [ ] Add search analytics tracking
- [ ] Track popular searches
- [ ] Track result click-through rates
- [ ] Track no-results queries
- [ ] Set up dashboards

## Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Performance tested
- [ ] Security reviewed

### Deployment
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Get QA approval
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Monitor search analytics
- [ ] Plan improvements

## Troubleshooting

### Modal Not Opening
- [ ] Check provider is in layout
- [ ] Verify keyboard event listeners
- [ ] Check browser console for errors
- [ ] Test with different browsers

### Search Not Working
- [ ] Check API endpoints
- [ ] Verify API responses
- [ ] Check network tab
- [ ] Review error logs
- [ ] Test with mock data

### Slow Performance
- [ ] Check debounce delay
- [ ] Review API response times
- [ ] Check bundle size
- [ ] Profile with React DevTools
- [ ] Optimize queries

### UI Issues
- [ ] Check CSS conflicts
- [ ] Verify Tailwind classes
- [ ] Test in different viewports
- [ ] Check z-index stacking
- [ ] Verify dark mode

## Success Criteria

- [ ] Command palette opens with Cmd+K / Ctrl+K
- [ ] Search returns relevant results within 500ms
- [ ] All categories working
- [ ] Keyboard navigation smooth
- [ ] Recent searches persisting
- [ ] No console errors
- [ ] All tests passing
- [ ] Accessible to all users
- [ ] Works on all browsers
- [ ] Mobile responsive

## Next Steps

After successful integration:

1. **Gather Feedback**
   - [ ] Collect user feedback
   - [ ] Identify pain points
   - [ ] Track usage metrics

2. **Iterate**
   - [ ] Add requested features
   - [ ] Fix reported bugs
   - [ ] Improve performance

3. **Extend**
   - [ ] Add more categories
   - [ ] Implement AI suggestions
   - [ ] Add advanced filters

4. **Optimize**
   - [ ] Improve search relevance
   - [ ] Reduce load times
   - [ ] Enhance UX

## Support

For issues or questions:
- Review documentation in component directory
- Check GitHub issues
- Contact PRISM agent
- Review Next.js 14 documentation

---

**Last Updated**: 2025-12-04
**Version**: 1.0.0
**Status**: Ready for Integration
