# Final Acceptance Testing Checklist

Use this checklist after installing the project locally and before a final demonstration or release.

## Environment

- [ ] MySQL is running.
- [ ] `.env` exists locally and is not committed.
- [ ] Backend starts with `npm run dev`.
- [ ] Frontend starts with `npm run dev`.
- [ ] Frontend production build succeeds with `npm run build`.
- [ ] `npm audit` has been reviewed.

## Authentication

- [ ] Student registration works.
- [ ] Student login works.
- [ ] Invalid credentials are rejected.
- [ ] Protected pages redirect unauthenticated users to login.
- [ ] Logout clears the authenticated session.
- [ ] Profile can be viewed and updated.
- [ ] Password-change validation works.

## Student Dashboard

- [ ] Dashboard loads without console errors.
- [ ] Navigation links open the correct pages.
- [ ] Notifications are visible.
- [ ] Dark mode works without breaking the layout.
- [ ] Mobile/responsive layout is usable.

## Sports and Grounds

- [ ] Sports list loads.
- [ ] Sports search/filter works.
- [ ] Ground list loads.
- [ ] Ground details load.
- [ ] Available ground/court information is shown correctly.

## Booking

- [ ] Available slots are displayed for a selected date.
- [ ] A free slot can be booked.
- [ ] Campus booking remains free; no payment is requested.
- [ ] An already-booked slot cannot be booked again.
- [ ] Past slots cannot be booked.
- [ ] Invalid date/time input is rejected.
- [ ] Booking confirmation is displayed.
- [ ] Booking history is displayed.
- [ ] A booking can be cancelled when permitted.
- [ ] Cancelled slots become available again where applicable.

## Timetable

- [ ] Student timetable loads.
- [ ] Free periods are identifiable.
- [ ] Busy class periods are blocked.
- [ ] A booking overlapping a class period is rejected by the backend.
- [ ] Frontend slot state matches backend availability.

## Equipment and Inventory

- [ ] Equipment catalogue loads.
- [ ] Available quantity is shown.
- [ ] Equipment reservation works.
- [ ] Reservation cancellation works.
- [ ] Inventory quantities update after issue/return.
- [ ] Invalid or unavailable equipment actions are rejected.

## QR System

- [ ] Equipment QR can be generated/displayed where supported.
- [ ] QR scanner opens in a supported browser/device.
- [ ] Manual QR payload fallback works if camera scanning is unavailable.
- [ ] Authorized staff can issue equipment.
- [ ] Authorized staff can return equipment.
- [ ] Unauthorized users cannot perform staff-only QR actions.

## Tournaments

- [ ] Tournament list loads.
- [ ] Authorized staff can create a tournament.
- [ ] Students can register a team where permitted.
- [ ] Fixtures can be created/updated by authorized staff.
- [ ] Results update correctly.
- [ ] Leaderboard reflects results.
- [ ] Authorized staff can issue certificates.

## Notifications

- [ ] Notifications load.
- [ ] Individual notification can be marked read.
- [ ] All notifications can be marked read.
- [ ] Booking/tournament/equipment notifications are generated where implemented.

## AI Sports Assistant

- [ ] Assistant page loads.
- [ ] A sports recommendation can be requested.
- [ ] Equipment guidance can be requested.
- [ ] Free-slot assistance can be requested.
- [ ] Sports questions receive a response.
- [ ] Errors are shown clearly if the AI endpoint is unavailable.

## Reports and Analytics

- [ ] Reports page loads for authorized users.
- [ ] Unauthorized users cannot access protected analytics.
- [ ] Most active student data loads.
- [ ] Most popular sport data loads.
- [ ] Ground usage data loads.
- [ ] Equipment usage data loads.
- [ ] Department participation data loads.

## Final regression

- [ ] No broken frontend routes.
- [ ] No unexpected blank pages.
- [ ] No unhandled API errors in the browser console.
- [ ] No secrets are present in committed files.
- [ ] No accidental `node_modules` files are tracked.
- [ ] Git working tree contains only intended changes.
- [ ] `main` contains the tested version.
