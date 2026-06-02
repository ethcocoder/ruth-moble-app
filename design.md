# Kitch Mobile App - Interface Design

## Screen Architecture (Portrait 9:16)

### Public/Customer Screens
1. **Landing Home** - Featured products, hero section, testimonials, CTA to browse
2. **Products List** - Searchable grid/list of all products with categories, pricing, stock status
3. **Product Detail** - Full product info, images, pricing, add to cart, reviews
4. **Cart** - Items in cart, quantity adjustment, total calculation, checkout button
5. **Checkout** - Shipping address, payment info, order confirmation
6. **Orders** - Customer's order history with status tracking

### Authentication Screens
1. **Login** - Email, password, forgot password link, sign up link
2. **Register** - Email, password, display name, role selection (customer/staff)
3. **Pending Approval** - Message showing account awaiting admin approval

### Staff Screens
1. **Staff Dashboard** - KPIs (total products, low stock, today's sales, daily revenue)
2. **Products View** - List of products with current stock, search/filter by category
3. **Daily Sales Log** - Record sales (product, qty, price, cost), auto-profit calc, date filter
4. **Sales History** - View past sales, export to PDF/Excel

### Admin Screens
1. **Admin Dashboard** - KPIs (users, pending approvals, revenue, employees, products)
2. **User Management** - List users, approve/reject pending, manage roles
3. **Product Management** - CRUD products, manage categories, pricing, images, featured flag
4. **Order Management** - View all orders, filter by status, update fulfillment
5. **Sales Analytics** - View all staff sales, filter by date/staff, verify accuracy
6. **Finance Dashboard** - Revenue, expenses, profit, monthly reports, category breakdown
7. **HR Management** - Employee records, status tracking, performance metrics
8. **CMS Management** - Edit landing page hero, features, testimonials, product listings

## Color Palette
- **Primary**: #0a7ea4 (Professional blue)
- **Background**: #ffffff (Light) / #151718 (Dark)
- **Surface**: #f5f5f5 (Light) / #1e2022 (Dark)
- **Foreground**: #11181C (Light) / #ECEDEE (Dark)
- **Muted**: #687076 (Light) / #9BA1A6 (Dark)
- **Success**: #22C55E
- **Warning**: #F59E0B
- **Error**: #EF4444

## Key User Flows

### Customer Flow
Landing → Browse Products → View Detail → Add to Cart → Checkout → Order Confirmation → Track Order

### Staff Flow
Login → Dashboard → View Products → Record Sale → View Sales History → Export Report

### Admin Flow
Login → Dashboard → Approve Users → Manage Products → View Orders → Analyze Sales → Generate Reports

## Mobile-First Principles
- One-handed navigation (thumb-friendly bottom tabs)
- Minimal scrolling with collapsible sections
- Large touch targets (48px minimum)
- Clear visual hierarchy
- Bottom sheet modals for actions
- Pull-to-refresh for lists
