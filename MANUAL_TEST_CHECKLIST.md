# Manual Dashboard Testing Checklist

**Tester**: _____________
**Date**: _____________
**Environment**: https://operate.guru
**Login**: luk.gber@gmail.com

---

## Pre-Test Setup

- [ ] Clear browser cache
- [ ] Open DevTools Console (F12)
- [ ] Log in via Google OAuth

---

## 1. Dashboard (`/dashboard`)

**URL**: https://operate.guru/dashboard

### Checks:
- [ ] Page loads (no white screen)
- [ ] No console errors
- [ ] Page title correct
- [ ] Navigation menu visible
- [ ] Breadcrumbs correct

### Widgets:
- [ ] Total widgets visible: _____
- [ ] Widgets display data (not loading forever)
- [ ] Widgets respond to interactions
- [ ] No error messages in widgets

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 2. Chat (`/chat`)

**URL**: https://operate.guru/chat

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Chat input visible
- [ ] Can type in input
- [ ] Can send message
- [ ] Message appears in chat
- [ ] AI responds to message
- [ ] Message history displays

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 3. Autopilot Settings (`/autopilot`)

**URL**: https://operate.guru/autopilot

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Settings form visible
- [ ] Toggle switches work
- [ ] Can save settings
- [ ] Success message shows
- [ ] Settings persist after refresh

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 4. Autopilot Actions (`/autopilot/actions`)

**URL**: https://operate.guru/autopilot/actions

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Action list displays
- [ ] Actions have data
- [ ] Can filter actions
- [ ] Can view action details
- [ ] Can approve/reject actions

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 5. Calendar (`/calendar`)

**URL**: https://operate.guru/calendar

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Calendar grid visible
- [ ] Current month highlighted
- [ ] Events display (if any)
- [ ] Can navigate months
- [ ] Can create event
- [ ] Can edit event

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 6. Tasks (`/tasks`)

**URL**: https://operate.guru/tasks

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Task list visible
- [ ] Can create task
- [ ] Can edit task
- [ ] Can mark complete
- [ ] Can delete task
- [ ] Filters work

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 7. Notifications (`/notifications`)

**URL**: https://operate.guru/notifications

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Notification list visible
- [ ] Notifications have content
- [ ] Can mark as read
- [ ] Can delete notification
- [ ] Unread count updates

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 8. Notification Inbox (`/notifications/inbox`)

**URL**: https://operate.guru/notifications/inbox

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Inbox view displays
- [ ] Different from /notifications
- [ ] Interactions work

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 9. Global Search (`/search`)

**URL**: https://operate.guru/search

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Search input visible
- [ ] Can type query
- [ ] Results display
- [ ] Results are relevant
- [ ] Can filter results
- [ ] Can click through to items

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 10. User Profile (`/profile`)

**URL**: https://operate.guru/profile

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Profile data displays
- [ ] Avatar shows
- [ ] Can edit fields
- [ ] Can save changes
- [ ] Changes persist

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 11. Settings Main (`/settings`)

**URL**: https://operate.guru/settings

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Settings tabs/navigation visible
- [ ] Current section highlighted
- [ ] Can navigate between sections

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 12. Profile Settings (`/settings/profile`)

**URL**: https://operate.guru/settings/profile

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Form fields display
- [ ] Can edit fields
- [ ] Validation works
- [ ] Can save
- [ ] Changes persist

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 13. Security Settings (`/settings/security`)

**URL**: https://operate.guru/settings/security

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Security options display
- [ ] Can change password (if applicable)
- [ ] 2FA options visible (if applicable)
- [ ] Session management works

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 14. Notification Preferences (`/settings/notifications`)

**URL**: https://operate.guru/settings/notifications

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Notification categories display
- [ ] Toggle switches work
- [ ] Can save preferences
- [ ] Preferences persist

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## 15. Billing Settings (`/settings/billing`)

**URL**: https://operate.guru/settings/billing

### Checks:
- [ ] Page loads
- [ ] No console errors
- [ ] Billing info displays
- [ ] Subscription status shows
- [ ] Payment method visible (if applicable)
- [ ] Can update payment
- [ ] Invoices list (if any)

### Issues Found:
```
Component: __________
Severity: Critical / High / Medium / Low
Description:


```

---

## Cross-Page Tests

### Navigation
- [ ] All nav links work
- [ ] Breadcrumbs update correctly
- [ ] Back/forward browser buttons work
- [ ] Deep links work (refresh on any page)

### Responsive Design
- [ ] Desktop view (1920x1080): Works
- [ ] Tablet view (768px): Works
- [ ] Mobile view (375px): Works

### Dark Mode (if applicable)
- [ ] Can toggle dark mode
- [ ] All pages work in dark mode
- [ ] No styling issues
- [ ] Images/icons adapt

### Performance
- [ ] Pages load quickly (<3s)
- [ ] No infinite loading states
- [ ] Smooth transitions
- [ ] No lag on interactions

### Accessibility
- [ ] Can navigate with keyboard
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] ARIA labels present (check in DevTools)

---

## Summary

### Total Pages Tested: _____ / 15

### Overall Status:
- [ ] All Critical Issues Resolved
- [ ] All High Priority Issues Resolved
- [ ] Medium/Low Issues Documented

### Critical Issues (Block Launch):
```
1.
2.
3.
```

### High Priority Issues:
```
1.
2.
3.
```

### Medium/Low Priority Issues:
```
1.
2.
3.
```

### Recommendations:
```
1.
2.
3.
```

---

## Sign-Off

**Tester**: _____________
**Date**: _____________
**Status**: PASS / FAIL / PASS WITH ISSUES

**Notes**:
```



```
