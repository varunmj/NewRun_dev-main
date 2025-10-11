# Upcoming Features Archive

This directory contains features that have been temporarily removed from the main NewRun platform but preserved for future development.

## 📁 Directory Structure

### Frontend Features
- **AcademicHub/** - Academic planning and course management
- **StudentFinance/** - Budget planning and financial tracking  
- **Transportation/** - Route planning and carpool matching

### Backend Features
- **AcademicHub/** - Academic-related models and routes
- **StudentFinance/** - Financial models and endpoints
- **Transportation/** - Transportation models and routes

## 🚀 Features Moved Here

### 1. Academic Hub
**Status:** Temporarily Disabled
**Components:**
- `AcademicHub.jsx` - Main academic dashboard
- `academicHub.js` - Backend routes
- `academicRoutes.js` - Additional academic endpoints
- Models: `academicCalendar.model.js`, `assignment.model.js`, `course.model.js`, `studyGroup.model.js`

**Reason for Removal:** Students already have university systems for course management

### 2. Student Finance
**Status:** Temporarily Disabled
**Components:**
- `StudentFinance.jsx` - Financial dashboard
- `studentFinance.js` - Backend routes
- Models: `budget.model.js`, `financialReport.model.js`, `transaction.model.js`

**Reason for Removal:** High regulatory complexity and students have existing banking relationships

### 3. Transportation
**Status:** Temporarily Disabled
**Components:**
- `Transportation.jsx` - Transportation dashboard
- Models: `route.model.js`, `transit.model.js`, `carpool.model.js`

**Reason for Removal:** Google Maps/Apple Maps provide better functionality

## 🔄 Reintegration Process

To reintegrate any of these features:

1. Copy the desired feature files back to their original locations
2. Update navigation menus to include the feature
3. Re-enable backend routes in `index.js`
4. Update onboarding flow to include the feature
5. Test thoroughly before deployment

## 📝 Notes

- All code has been preserved with original functionality
- Features are completely disconnected from the main system
- No user-facing access to these features
- Can be easily restored when needed

---
*Last Updated: $(date)*
*Moved by: NewRun Development Team*
