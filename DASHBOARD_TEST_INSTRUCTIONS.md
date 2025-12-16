# Dashboard Testing Instructions

## Prerequisites

1. Install Puppeteer (if not already installed):
```bash
cd C:\Users\grube\op\operate-fresh
npm install puppeteer --save-dev
```

## Running the Test

Execute the comprehensive test script:
```bash
cd C:\Users\grube\op\operate-fresh
node test-dashboard.js
```

### Manual Steps:

1. The browser will open automatically (non-headless mode)
2. You'll be directed to https://operate.guru/login
3. **Complete Google OAuth login** using luk.gber@gmail.com
4. The script will automatically test all pages after login
5. Results will be saved to `test-results.json`
6. Screenshots will be saved to `screenshots/` directory

## Pages Being Tested

The script tests 15 pages:

### Core Pages
- `/dashboard` - Main dashboard with widgets
- `/chat` - AI chat interface
- `/autopilot` - AI autopilot settings
- `/autopilot/actions` - Autopilot action history

### Features
- `/calendar` - Calendar view
- `/tasks` - Task management
- `/notifications` - Notification center
- `/notifications/inbox` - Notification inbox
- `/search` - Global search

### User Management
- `/profile` - User profile
- `/settings` - Main settings
- `/settings/profile` - Profile settings
- `/settings/security` - Security settings
- `/settings/notifications` - Notification preferences
- `/settings/billing` - Billing/subscription

## What's Being Checked

For each page, the script verifies:

1. **Page Load**
   - HTTP status (200 OK)
   - Page renders without crashes
   - No JavaScript errors

2. **Content**
   - Page has content (not blank)
   - Title is set correctly
   - No error alerts displayed

3. **Interactive Elements**
   - Navigation links present
   - Buttons are functional
   - Forms render correctly

4. **Page-Specific Features**
   - Dashboard: Widgets are present
   - Chat: Input field exists
   - Calendar: Calendar component renders
   - Tasks: Task list displays

5. **Visual Verification**
   - Screenshot taken for manual review
   - Loading states resolve
   - Layout appears correct

## Expected Output

The script outputs:
- Real-time testing progress in console
- `test-results.json` with summary and issues
- Screenshots for each page in `screenshots/` folder

### Result Format:
```json
{
  "summary": {
    "total": 15,
    "passed": X,
    "failed": Y
  },
  "issues": [
    {
      "page": "/dashboard",
      "component": "Page Load",
      "type": "frontend|backend|ux",
      "severity": "critical|high|medium|low",
      "description": "Detailed description of issue",
      "console_errors": ["array", "of", "errors"]
    }
  ]
}
```

## Troubleshooting

### If Puppeteer fails to launch:
```bash
# Windows: May need to install Chrome manually
# Puppeteer should download Chromium automatically
```

### If login fails:
- Make sure Google OAuth is configured
- Check that luk.gber@gmail.com has access
- Verify the OAuth callback URL includes https://operate.guru

### If pages don't load:
- Check that https://operate.guru is accessible
- Verify the API is running
- Check browser console for errors

## Manual Testing Checklist

If automated testing fails, test manually:

### Dashboard (`/dashboard`)
- [ ] Page loads without errors
- [ ] Widgets display data
- [ ] Real-time updates work (if any)
- [ ] Navigation works
- [ ] Responsive layout

### Chat (`/chat`)
- [ ] Chat interface renders
- [ ] Can type messages
- [ ] Messages send successfully
- [ ] AI responds
- [ ] Message history loads

### Autopilot (`/autopilot`)
- [ ] Settings page loads
- [ ] Can toggle autopilot
- [ ] Settings save correctly
- [ ] Action categories display

### Autopilot Actions (`/autopilot/actions`)
- [ ] Action history loads
- [ ] Can filter actions
- [ ] Action details display
- [ ] Can approve/reject actions

### Calendar (`/calendar`)
- [ ] Calendar grid renders
- [ ] Events display correctly
- [ ] Can navigate months
- [ ] Can create events
- [ ] Event details show

### Tasks (`/tasks`)
- [ ] Task list loads
- [ ] Can create tasks
- [ ] Can edit tasks
- [ ] Can mark complete
- [ ] Filters work

### Notifications (`/notifications`)
- [ ] Notification list loads
- [ ] Can mark as read
- [ ] Can delete notifications
- [ ] Real-time updates work

### Search (`/search`)
- [ ] Search input works
- [ ] Results display
- [ ] Can filter results
- [ ] Search is fast

### Profile (`/profile`)
- [ ] Profile data loads
- [ ] Can edit profile
- [ ] Avatar uploads
- [ ] Changes save

### Settings Pages (`/settings/*`)
- [ ] All settings tabs load
- [ ] Forms render correctly
- [ ] Can update settings
- [ ] Validation works
- [ ] Changes persist

## Common Issues to Look For

### Frontend Issues
- Blank pages
- JavaScript errors in console
- Components not rendering
- Buttons not working
- Forms not submitting
- Navigation broken
- Styling issues
- Dark mode problems

### Backend Issues
- API errors (500, 404)
- Slow response times
- Data not loading
- Websocket disconnects
- Authentication failures

### UX Issues
- Poor mobile responsiveness
- Confusing navigation
- Missing feedback
- Slow loading states
- Accessibility problems
- Inconsistent design

## Next Steps

After testing:

1. Review `test-results.json`
2. Check screenshots in `screenshots/` folder
3. Document any issues found
4. Prioritize fixes by severity
5. Report to appropriate agent:
   - Frontend issues → PRISM
   - Backend issues → FORGE
   - API issues → BRIDGE
   - Database issues → VAULT
   - Performance → FLUX
