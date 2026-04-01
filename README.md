# Ghana Journalists Association (GJA) Portal

## Overview
The GJA Portal has been split into two independent applications:

1. **User Registration Portal** (`gja-register.html`) - For members to register
2. **Admin Dashboard** (`gja-admin.html`) - For administrators to manage member applications

## File Structure

### User Registration Portal (`gja-register.html`)
- **Purpose**: Allow journalists and media practitioners to register for GJA membership
- **Features**:
  - Multi-step form (Personal Info → Contact Details → Professional Info → Review & Submit)
  - Real-time form completion progress tracking
  - Photo upload for passport
  - Google Forms and Google Drive integration
  - Application submission with unique Member ID
  - Success modal with reference number
  - Data storage in browser localStorage

- **Key Sections**:
  - Hero section with organization information
  - 4-tab registration form
  - Sidebar with setup instructions
  - GJA information card

- **Access**: 
  - Direct: Open `gja-register.html` in browser
  - From Admin: Click "GJA Admin" button → redirects to admin login

### Admin Dashboard (`gja-admin.html`)
- **Purpose**: Manage member applications and review registrations
- **Features**:
  - Secure login (Demo: admin@gja.org / GJAPass123)
  - Member application dashboard
  - Real-time statistics (Total, Pending, Approved, Rejected)
  - Advanced filtering (Name/Email, Status, Region, Media Type)
  - Approve/Reject member applications
  - CSV export of member data
  - Session-based authentication (24-hour expiry)

- **Key Sections**:
  - Login page
  - Dashboard with statistics
  - Filtering sidebar
  - Members table with action buttons
  - Export functionality

- **Access**: 
  - Direct: Open `gja-admin.html` in browser
  - From Registration: Click "GJA Admin" button → redirects to admin login

## Data Flow

```
Registration Portal → localStorage (gja_members_data) ← Admin Dashboard
                  ↓
            Member applications
            stored with:
            - Unique ID
            - Personal info
            - Contact details
            - Professional data
            - Status (Pending/Approved/Rejected)
            - Timestamp
```

## Browser Storage

Both applications use `localStorage` to share member data:
- **Key**: `gja_members_data` - JSON array of member applications
- **Key**: `gja_drive` - Google Drive folder URL
- **Key**: `gja_admin_auth` - Admin session token

### Member Object Structure
```json
{
  "id": "GJA-2026-12345",
  "fname": "John",
  "lname": "Doe",
  "email": "john@example.com",
  "phone": "+233123456789",
  "address": "123 Main St",
  "region": "Greater Accra",
  "employer": "Daily Gazette",
  "mediatype": "Print / Newspaper",
  "status": "Pending",
  "date": "01 April 2026",
  "photoUrl": ""
}
```

## Features

### Registration Portal
✅ Multi-step form with validation
✅ Real-time progress tracking
✅ Input sanitization (XSS prevention)
✅ ARIA accessibility labels
✅ Keyboard navigation support
✅ Photo upload
✅ Google Forms embedding
✅ Google Drive integration
✅ Local storage persistence

### Admin Dashboard
✅ Secure login with 24-hour sessions
✅ Member statistics dashboard
✅ Advanced filtering
✅ Approve/Reject applications
✅ CSV export
✅ Event delegation for performance
✅ Input sanitization
✅ Accessibility-first design

## Security Features

1. **Input Sanitization**: All user input is sanitized to prevent XSS attacks
2. **Authentication**: Session-based admin login with token validation
3. **ARIA Labels**: Proper accessibility attributes for screen readers
4. **Focus Management**: Keyboard navigation and focus indicators
5. **Error Handling**: User-friendly error messages with validation

## Responsive Design

Both applications are fully responsive:
- **Desktop**: Full layout with sidebars
- **Tablet**: Adjusted grid layouts
- **Mobile**: Single-column layouts with optimized spacing

## Future Enhancements

### Recommended Improvements
1. **Backend Integration**: Move from localStorage to a proper database
2. **Email Confirmations**: Send confirmation emails to applicants
3. **Member Directory**: Public searchable directory of members
4. **Bulk Actions**: Multi-select and bulk approve/reject
5. **Payment Integration**: Membership fees collection
6. **API Integration**: Connect to Google Sheets API for syncing
7. **Two-Factor Authentication**: Enhanced admin security
8. **Audit Logs**: Track all admin actions
9. **Email Notifications**: Notify members of status changes
10. **Advanced Analytics**: Member demographics and trends

## Demo Credentials

**Admin Login**
- Email: `admin@gja.org`
- Password: `GJAPass123`

**Demo Member Account** (optional)
- First Name: John
- Last Name: Doe
- Email: john.doe@example.com
- Employer: Ghana Broadcasting Corporation

## Keyboard Shortcuts

### Registration Portal
- `Tab` - Navigate between form fields
- `Shift + Tab` - Navigate backwards
- `Enter` - Submit form (on submit button)

### Admin Dashboard
- `Tab` - Navigate filters and buttons
- `Enter` - Apply filter or action

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Installation

1. Download both `gja-register.html` and `gja-admin.html`
2. Place in a web-accessible directory
3. Open `gja-register.html` for user registration
4. Open `gja-admin.html` for admin access
5. Use demo credentials to login to admin portal

## Testing

### Registration Flow
1. Fill out all 4 tabs with test data
2. Verify progress indicator updates
3. Submit application
4. Check localStorage (DevTools → Application → Local Storage)
5. Navigate to admin portal to see application

### Admin Flow
1. Login with demo credentials
2. View statistics dashboard
3. Test filters (search, status, region, media type)
4. Approve/reject a test application
5. Export data as CSV

## Support

For issues or questions:
- Check console for JavaScript errors (DevTools F12)
- Verify localStorage is enabled
- Clear browser cache and try again
- Check form validation error messages

## License

Ghana Journalists Association - Member Registration Portal
© 2026
