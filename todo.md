# Kitch Mobile App - Development Checklist

## Core Infrastructure
- [x] Firebase configuration and initialization using iOS Firebase config
- [x] Auth context and hooks (useAuth + role/status persistence)
- [x] Navigation structure (Expo Router with stack + tabs)
- [x] Theme and color system finalization
- [x] API server setup with Express and tRPC
- [x] Firestore service layer or TRPC backend services for ERP data

## Authentication and Authorization
- [x] Login screen with Firebase email/password
- [x] Register screen with staff/admin role selection
- [x] Pending approval screen for new staff accounts
- [x] Auth state persistence and role/status loading
- [x] Strict admin bootstrapping for the first admin user
- [x] Role-based redirect flow for staff/admin users
- [x] Secure logout and session cleanup

## Staff ERP Features
- [x] Staff dashboard with KPIs
- [x] Products inventory view with stock levels and categories
- [x] Staff product CRUD with admin approval required before activation
- [ ] Product submission and editing supported, locked while not active
- [x] Daily sales log screen for recording sales transactions with actual sale price
- [x] Sales history screen with filters by date and product
- [x] Sales price override support by customer or promotion
- [ ] Stock adjustment and low-stock indicators
- [ ] Export daily sales / reports to PDF or Excel
- [x] Approved staff-only access enforcement
- [x] Staff profile management and account settings

## Admin ERP Features
- [x] Admin dashboard with system KPIs
- [x] User management screen for approve/reject staff
- [x] Product management CRUD with inventory, pricing, featured flag, and approval workflow
- [ ] Monthly promotions/offers management screen
- [ ] Staff pricing and employee discount management
- [ ] Product-level variable pricing and marketing price overrides
- [x] Order management screen and status updates
- [x] Sales analytics and revenue reporting with daily/weekly/monthly rollups
- [ ] Admin report generation with PDF and Excel export
- [x] Finance dashboard for revenue, profit, and expense summaries
- [x] HR management for employee records and statuses
- [x] Admin profile management and account settings
- [x] System language preference support (English / Amharic)
- [x] User theme preference support (dark / light mode)

## Backend Data Model
- [x] `users` collection/table: email, role, status, approvedBy, createdAt
- [x] `products` collection/table: name, category, stock, basePrice, status
- [x] `orders` collection/table: order items, totalAmount, status, customer info
- [x] `order_items` or `sales_items` structure: productId, salePrice, quantity, profit, customerPriceOverride, promotionCode
- [x] `daily_sales` collection/table: saleDate, items, totalAmount, profit, salesCount
- [ ] `reports` collection/table: daily, weekly, monthly aggregates with revenue and profit
- [x] `employees` collection/table: name, role, salary, status, department
- [x] `staff_reports` collection/table for staff action audit logs

## Polish & Delivery
- [x] App branding (logo, colors, name)
- [x] Loading states and error handling
- [x] Empty states for lists and dashboards
- [x] Pull-to-refresh functionality for product and sales lists (staff dashboard and staff sales screens)
- [x] Haptic feedback on interactions (HapticButton component, HapticTab already present)
- [x] Dark mode support
- [x] Responsive layout validation for iOS
- [ ] Package as ZIP for delivery

## Notes from Documentation
- Focus on staff/admin ERP use cases rather than customer retail flows.
- User signup should assign `admin` to the first account and `staff`/`pending` to future accounts.
- Admin can approve staff users and manage ERP resources through the dashboard.
- Backend should support Firestore-like collections and role-based access control.
- UI screens should mirror admin/staff modules from the Kitch ERP documentation.
