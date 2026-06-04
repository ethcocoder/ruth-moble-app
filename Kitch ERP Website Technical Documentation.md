# Kitch ERP Website Technical Documentation

## 1. Project Overview

Kitch is a premium kitchen equipment e-commerce platform that also functions as an Enterprise Resource Planning (ERP) system for managing various business operations. It is built with a modern web stack, leveraging Firebase for its backend services, authentication, and real-time database capabilities. The frontend is developed using React 19, Vite, and TailwindCSS, while the backend utilizes Express and tRPC.

## 2. Firebase Integration

The Kitch ERP system heavily relies on Firebase for its core backend functionalities, providing a scalable and real-time infrastructure. The primary Firebase services integrated are:

*   **Firebase Authentication**: Handles user registration, login, and session management.
*   **Cloud Firestore**: A NoSQL cloud database used for storing and synchronizing all application data.
*   **Firebase Storage**: Used for storing user-generated content and product images.

### 2.1. Firebase Configuration

Firebase is initialized in `client/src/lib/firebase.ts` [3] with the following configuration parameters, typically loaded from environment variables (e.g., `.env.local`) for security and flexibility [2]:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCR88ybvOtt44VWwVeIyttakN9qcF1Jf5A",
  authDomain: "kitch-ea06f.firebaseapp.com",
  projectId: "kitch-ea06f",
  storageBucket: "kitch-ea06f.firebasestorage.app",
  messagingSenderId: "1073404853721",
  appId: "1:1073404853721:web:c2f9ebcccf21c6f72c6dc8",
  measurementId: "G-215BKJ37N7",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 2.2. Firestore Service Layer

The `client/src/services/firestoreService.ts` file [4] provides a centralized service layer for interacting with Firestore. It encapsulates common CRUD (Create, Read, Update, Delete) operations for various collections, ensuring consistent data access and error handling. Examples include `getAllProducts()`, `getProductById()`, `addProduct()`, `getUserOrders()`, and `createOrder()`.

## 3. Authentication and Authorization

The system implements a robust authentication and authorization mechanism using Firebase Authentication and Firestore-based user roles.

### 3.1. User Registration and Login Flow

Users can register via email/password or Google Sign-Up through the `client/src/pages/Signup.tsx` page [5]. A critical aspect of the signup process is the **strict admin check** implemented in `client/src/lib/strictAdminCheck.ts` [6]. This ensures that the very first user to register is automatically assigned the `admin` role and `approved` status, bootstrapping the system's administrative capabilities. Subsequent users are assigned the `user` role with a `pending` status, requiring administrative approval.

Upon successful registration or login, users are redirected based on their role and status:

*   **Admin**: Redirected to `/admin-dashboard`.
*   **Approved User/Staff**: Redirected to `/staff-dashboard` or `/user-dashboard`.
*   **Pending User**: Redirected to `/approval-waiting` until an admin approves their account.

### 3.2. User Roles and Approval Process

The system defines two primary user roles stored in the Firestore `users` collection [2]:

*   **`admin`**: Has full access to all ERP functionalities, including user management, product management, finance, and HR.
*   **`user` / `staff`**: Regular users with limited access, typically to their own orders or specific staff-level modules.

New users, except for the first registered user, enter a `pending` status. Administrators can approve or reject these pending users from the `AdminDashboardComplete.tsx` page [7], which updates the user's status in Firestore.

### 3.3. Firestore Security Rules

The `firestore.rules` file [8] defines the access control logic for all Firestore collections, enforcing authorization based on user authentication status and roles. Key rules include:

*   **`isAuthenticated()`**: Checks if a user is logged in.
*   **`isAdmin()`**: Checks if the logged-in user has the `admin` role in their Firestore user document.
*   **`isApproved()`**: Checks if the logged-in user has an `approved` status in their Firestore user document.

**Collection-specific rules:**

*   **`/users/{userId}`**: Allows authenticated users to read, and allows self or admin to write/create.
*   **`/products/{productId}`**: Publicly readable; only `admin` or `approved` staff can write.
*   **`/orders/{orderId}`**: Authenticated users can read; `admin` or `approved` users can write.
*   **`/employees/{employeeId}`**, **`/expenses/{expenseId}`**, **`/analytics/{analyticsId}`**: Admin-only read and write access.
*   **`/cms_content/{contentId}`**, **`/testimonials/{testimonialId}`**, **`/features/{featureId}`**: Publicly readable; only `admin` can write.
*   **`/daily_sales/{saleId}`**: `admin` or `approved` staff can read and write.
*   **`/staff_reports/{reportId}`**: `admin` can read; `approved` staff can write.

## 4. Firestore Data Model

The application uses several Firestore collections to store its data. Below are the key collections and their typical schemas:

### 4.1. `users` Collection (`/users/{userId}`)

Stores user profiles and roles. [2] [5]

| Field         | Type     | Description                                       |
| :------------ | :------- | :------------------------------------------------ |
| `email`       | `string` | User's email address.                             |
| `displayName` | `string` | User's display name.                              |
| `createdAt`   | `Date`   | Timestamp of user creation.                       |
| `role`        | `string` | User's role: `admin` or `user`.                   |
| `userType`    | `string` | User type: `owner` or `staff`.                    |
| `status`      | `string` | Account status: `approved`, `pending`, `rejected`.|
| `approvedAt`  | `Date`   | Timestamp of approval (if applicable).            |
| `approvedBy`  | `string` | UID of the admin who approved the user.           |
| `photoURL`    | `string` | URL of user's profile picture (for Google Auth).  |
| `authProvider`| `string` | Authentication provider (e.g., `google`).         |

### 4.2. `products` Collection (`/products/{productId}`)

Stores information about products. [2]

| Field         | Type     | Description                                       |
| :------------ | :------- | :------------------------------------------------ |
| `name`        | `string` | Product name.                                     |
| `description` | `string` | Detailed product description.                     |
| `price`       | `number` | Product price.                                    |
| `category`    | `string` | Product category (e.g., "Knives", "Cookware").  |
| `stock`       | `number` | Current stock quantity.                           |
| `image`       | `string` | URL of the product image.                         |
| `featured`    | `boolean`| Indicates if the product is featured.             |
| `createdAt`   | `Date`   | Timestamp of product creation.                    |
| `updatedAt`   | `Date`   | Timestamp of last update.                         |
| `status`      | `string` | Product status (e.g., `approved`, `pending`).     |

### 4.3. `orders` Collection (`/orders/{orderId}`)

Stores customer order details. [2] [9]

| Field           | Type       | Description                                       |
| :-------------- | :--------- | :------------------------------------------------ |
| `orderNumber`   | `string`   | Unique order identifier.                          |
| `userId`        | `string`   | UID of the user who placed the order.             |
| `customerName`  | `string`   | Name of the customer.                             |
| `customerEmail` | `string`   | Email of the customer.                            |
| `items`         | `array`    | Array of `OrderItem` objects.                     |
| `totalAmount`   | `number`   | Total amount of the order.                        |
| `status`        | `string`   | Order status: `pending`, `completed`, `cancelled`.|
| `paymentStatus` | `string`   | Payment status: `unpaid`, `paid`, `partial`.      |
| `orderDate`     | `Date`     | Timestamp when the order was placed.              |
| `completedDate` | `Date`     | Timestamp when the order was completed.           |
| `notes`         | `string`   | Additional notes for the order.                   |

**`OrderItem` Schema:**

| Field         | Type     | Description                               |
| :------------ | :------- | :---------------------------------------- |
| `productId`   | `string` | ID of the product.                        |
| `productName` | `string` | Name of the product.                      |
| `quantity`    | `number` | Quantity ordered.                         |
| `unitPrice`   | `number` | Price per unit at the time of order.      |
| `total`       | `number` | Total price for this item (`quantity * unitPrice`).|

### 4.4. `employees` Collection (`/employees/{employeeId}`)

Manages employee records for HR. [10]

| Field         | Type     | Description                                       |
| :------------ | :------- | :------------------------------------------------ |
| `name`        | `string` | Employee's full name.                             |
| `email`       | `string` | Employee's email address.                         |
| `role`        | `string` | Employee's role (e.g., "Sales", "HR", "Manager").|
| `salary`      | `number` | Employee's salary.                                |
| `status`      | `string` | Employment status: `active` or `inactive`.        |
| `joinedDate`  | `string` | Date the employee joined.                         |
| `phone`       | `string` | Employee's phone number.                          |
| `department`  | `string` | Department the employee belongs to.               |
| `createdAt`   | `Date`   | Timestamp of employee record creation.            |
| `updatedAt`   | `Date`   | Timestamp of last update.                         |

### 4.5. `daily_sales` Collection (`/daily_sales/{saleId}`)

Records daily sales transactions. [7] [11]

| Field         | Type     | Description                                       |
| :------------ | :------- | :------------------------------------------------ |
| `saleDate`    | `string` | Date of the sale (e.g., "YYYY-MM-DD").            |
| `totalAmount` | `number` | Total revenue from the sale.                      |
| `totalCost`   | `number` | Total cost of goods sold for the sale.            |
| `totalProfit` | `number` | Profit from the sale.                             |
| `items`       | `array`  | Array of sold items (similar to `OrderItem`).     |
| `createdAt`   | `Date`   | Timestamp of sale record creation.                |

### 4.6. `cms_content` Collection (`/cms_content/{contentId}`)

Stores content for Content Management System (CMS) purposes. [2]

| Field       | Type     | Description                                       |
| :---------- | :------- | :------------------------------------------------ |
| `key`       | `string` | Unique key to identify the content (e.g., `homepage_hero`).|
| `content`   | `string` | The actual content (text, HTML, JSON).            |
| `updatedAt` | `Date`   | Timestamp of last update.                         |

### 4.7. `testimonials` Collection (`/testimonials/{testimonialId}`)

Stores customer testimonials. [2]

| Field       | Type     | Description                                       |
| :---------- | :------- | :------------------------------------------------ |
| `name`      | `string` | Name of the person giving the testimonial.        |
| `role`      | `string` | Role or title of the person.                      |
| `text`      | `string` | The testimonial text.                             |
| `rating`    | `number` | Rating given (e.g., 1-5 stars).                   |
| `createdAt` | `Date`   | Timestamp of testimonial creation.                |

### 4.8. `features` Collection (`/features/{featureId}`)

Stores application features or highlights. [2]

| Field       | Type     | Description                                       |
| :---------- | :------- | :------------------------------------------------ |
| `title`     | `string` | Title of the feature.                             |
| `description`| `string` | Description of the feature.                       |
| `icon`      | `string` | Icon identifier for the feature.                  |
| `createdAt` | `Date`   | Timestamp of feature creation.                    |

### 4.9. `staff_reports` Collection (`/staff_reports/{reportId}`)

Records audit-style reports generated by staff actions. [11]

| Field         | Type     | Description                                       |
| :------------ | :------- | :------------------------------------------------ |
| `staffId`     | `string` | UID of the staff member who performed the action. |
| `staffName`   | `string` | Name of the staff member.                         |
| `action`      | `string` | Description of the action performed.              |
| `details`     | `object` | Detailed context of the action.                   |
| `timestamp`   | `Date`   | Timestamp of the report.                          |
| `type`        | `string` | Type of report (e.g., `automatic`).               |

## 5. Core ERP Modules

The Kitch ERP system is composed of several modules, primarily accessible through the `AdminDashboardComplete.tsx` [7] and `StaffDashboard.tsx` pages. These modules interact with Firestore to manage various business aspects.

### 5.1. Product Management (`ProductManagementEnhanced.tsx`)

This module allows administrators to manage products in the `products` collection. It supports real-time listing, creation, updating, and deletion of products. It also includes functionality for approving products (setting `status` to `approved`) and calculating inventory/revenue statistics. Staff-facing product management (`StaffProductManagement.tsx`) allows staff to create new products (which enter a `pending` status for admin approval) and reports updates/deletions to admins via `staff_reports` [11].

### 5.2. Order Management (`OrderManagement.tsx`)

Accessible by administrators, this module provides comprehensive management of customer orders stored in the `orders` collection. It offers real-time order tracking, the ability to create, edit, and delete orders, and functionality to update order and payment statuses. [9]

### 5.3. User Management (`UserManagementEnhanced.tsx`)

This module, available to administrators, allows for the management of user accounts in the `users` collection. It provides capabilities to view all users, manually create/update/delete user documents, and approve pending user accounts. The form schema includes fields for `displayName`, `email`, `role`, `status`, and `userType`.

### 5.4. HR Management (`HRManagement.tsx`)

The HR Management module, primarily for administrators, manages employee records in the `employees` collection. It allows for the creation, updating, and deletion of employee profiles, including details such as name, email, role, salary, and employment status. It also provides KPIs for active employees and payroll. [10]

### 5.5. Finance Management (`FinanceManagementEnhanced.tsx`)

This module provides administrators with an overview of the system's financial health. It uses data from `daily_sales` and potentially other collections (though `expenses` is noted as not yet fully implemented) to calculate total revenue, expenses, net profit, and order statistics. It also supports exporting monthly financial reports to PDF and Excel formats. [12]

### 5.6. Daily Sales Log (`DailySalesLog.tsx`)

This module is used to record daily sales transactions into the `daily_sales` collection. It allows for the entry of sales, which then update related product stock and profit metrics. It also provides per-day financial statistics and export options. [7]

## 6. Application Routing

The application's routing is defined in `client/src/App.tsx` [13] using `wouter`. It sets up routes for authentication pages, dashboards, and administrative tools. Notably, it uses `AuthProvider` for Firebase authentication context and includes a `ProtectedAdminRoute` to restrict access to admin-specific pages based on the user's role.

## References

[1] Kitch ERP GitHub Repository. Available at: `https://github.com/ethcocoder/Kitch`
[2] `FIREBASE_SETUP.md` in Kitch repository.
[3] `client/src/lib/firebase.ts` in Kitch repository.
[4] `client/src/services/firestoreService.ts` in Kitch repository.
[5] `client/src/pages/Signup.tsx` in Kitch repository.
[6] `client/src/lib/strictAdminCheck.ts` in Kitch repository.
[7] `client/src/pages/AdminDashboardComplete.tsx` in Kitch repository.
[8] `firestore.rules` in Kitch repository.
[9] `client/src/components/OrderManagement.tsx` in Kitch repository.
[10] `client/src/components/HRManagement.tsx` in Kitch repository.
[11] `client/src/components/StaffDailySalesLog.tsx` in Kitch repository.
[12] `client/src/components/FinanceManagementEnhanced.tsx` in Kitch repository.
[13] `client/src/App.tsx` in Kitch repository.
