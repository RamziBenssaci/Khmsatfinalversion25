# API Documentation V7

This document outlines the API specifications for V7, detailing endpoints, request/response formats, and authentication requirements for various modules including Direct Purchase and Dental services.

## General API Information

### Base URL
```
http://localhost:8000/api
```
Or use the environment variable: `VITE_API_BASE_URL`

### Authentication
- **Type**: Bearer Token
- **Header**: `Authorization: Bearer {token}`
- **Required**: For all endpoints except login

### Standard Headers
- `Content-Type: application/json`
- `Accept: application/json`

### Standard Response Shapes

#### Success Response
```typescript
interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}
```

#### Error Response
```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
```

## API Endpoint Order

The following sections are covered in this documentation:

1. Authentication
2. Direct Purchase Reports
3. Direct Purchase Dashboard
4. Dental Contracts
5. Dental Reports
6. Dental Dashboard
7. Dental Assets
8. Dental Assets Dashboard
9. Facilities and Suppliers

---

## Authentication Endpoints

### 1. Staff Login
**Endpoint**: `POST /staff/login`

**Description**: Authenticate staff user and receive bearer token

**Request Body**:
```json
{
  "username": "staff_username",
  "password": "staff_password"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 2,
    "username": "staff_username",
    "name": "اسم الموظف",
    "email": "staff@example.com",
    "role": "staff",
    "department": "قسم الأسنان",
    "position": "طبيب أسنان",
    "permissions": ["reports", "dental", "warehouse"],
    "created_at": "2025-01-01T00:00:00.000000Z",
    "updated_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "message": "بيانات الدخول غير صحيحة"
}
```

### 2. Admin Login
**Endpoint**: `POST /admin/login`

**Description**: Authenticate admin user and receive bearer token

**Request Body**:
```json
{
  "username": "admin_username",
  "password": "admin_password"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "username": "admin_username",
    "name": "اسم المدير",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": ["all"],
    "created_at": "2025-01-01T00:00:00.000000Z",
    "updated_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "message": "بيانات الدخول غير صحيحة"
}
```

### 3. Staff Logout
**Endpoint**: `POST /staff/logout`

**Description**: Logout staff user and invalidate token

**Headers Required**:
- `Authorization: Bearer {token}`

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

### 4. Admin Logout
**Endpoint**: `POST /admin/logout`

**Description**: Logout admin user and invalidate token

**Headers Required**:
- `Authorization: Bearer {token}`

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

---

## Direct Purchase Endpoints

### 1. Get Direct Purchase Orders
**Endpoint**: `GET /direct-purchase/orders`

**Description**: Retrieve all direct purchase orders

**Headers Required**:
- `Authorization: Bearer {token}`
- `Accept: application/json`
- `Content-Type: application/json`

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب الطلبات بنجاح",
  "data": [
    {
      "id": "DP001",
      "itemNumber": "ITEM-001",
      "itemName": "مستلزمات طبية",
      "beneficiary": "مستشفى الملك فهد",
      "supplier": "شركة المستلزمات الطبية",
      "status": "جديد",
      "totalCost": 5000,
      "orderDate": "2025-01-01",
      "deliveryDate": "2025-01-15"
    }
  ]
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "message": "غير مخول للوصول"
}
```

### 2. Create Direct Purchase Order
**Endpoint**: `POST /direct-purchase/orders`

**Description**: Create a new direct purchase order

**Request Body**:
```json
{
  "itemNumber": "ITEM-001",
  "itemName": "مستلزمات طبية",
  "beneficiary": "مستشفى الملك فهد",
  "supplier": "شركة المستلزمات الطبية",
  "totalCost": 5000,
  "orderDate": "2025-01-01",
  "deliveryDate": "2025-01-15",
  "notes": "ملاحظات"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "تم إنشاء الطلب بنجاح",
  "data": {
    "id": "DP002",
    "itemNumber": "ITEM-001",
    "itemName": "مستلزمات طبية",
    "status": "جديد",
    "totalCost": 5000
  }
}
```

### 3. Get Direct Purchase Reports
**Endpoint**: `GET /direct-purchase/reports`

**Description**: Retrieve filtered direct purchase reports

**Query Parameters**:
- `type` (optional): Report type filter
- `status` (optional): Order status filter
- `facility` (optional): Facility name filter
- `supplier` (optional): Supplier name filter
- `item` (optional): Item name/number filter

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب التقارير بنجاح",
  "data": [
    {
      "id": "DP001",
      "itemNumber": "ITEM-001",
      "itemName": "مستلزمات طبية",
      "beneficiary": "مستشفى الملك فهد",
      "supplier": "شركة المستلزمات الطبية",
      "status": "تم التسليم",
      "totalCost": 5000,
      "orderDate": "2025-01-01",
      "deliveryDate": "2025-01-15"
    }
  ]
}
```

### 4. Get Direct Purchase Dashboard Data
**Endpoint**: `GET /direct-purchase/dashboard`

**Description**: Retrieve aggregated dashboard data for direct purchases

**Query Parameters**:
- `facility` (optional): Filter by facility
- `item` (optional): Filter by item
- `supplier` (optional): Filter by supplier

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب بيانات لوحة التحكم بنجاح",
  "data": {
    "summary": {
      "total": 150,
      "new": 12,
      "approved": 35,
      "contracted": 78,
      "delivered": 20,
      "rejected": 5,
      "totalValue": 850000
    },
    "statusData": [
      { "name": "جديد", "value": 12, "color": "#3b82f6" },
      { "name": "موافق عليه", "value": 35, "color": "#f59e0b" },
      { "name": "تم التعاقد", "value": 78, "color": "#8b5cf6" },
      { "name": "تم التسليم", "value": 20, "color": "#10b981" },
      { "name": "مرفوض", "value": 5, "color": "#ef4444" }
    ],
    "monthlyData": [
      { "month": "يناير", "orders": 42, "value": 285000 },
      { "month": "فبراير", "orders": 38, "value": 245000 },
      { "month": "مارس", "orders": 35, "value": 180000 },
      { "month": "أبريل", "orders": 35, "value": 140000 }
    ],
    "topSuppliers": [
      { "name": "شركة المستلزمات الطبية", "orders": 45, "value": 385000 },
      { "name": "مؤسسة التجهيزات الطبية", "orders": 32, "value": 265000 }
    ]
  }
}
```

---

## Dental Contracts Endpoints

### 1. Get Dental Contracts
**Endpoint**: `GET /dental/contracts`

**Description**: Retrieve all dental contracts

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب العقود بنجاح",
  "data": [
    {
      "id": "DC001",
      "orderDate": "2025-01-01",
      "itemNumber": "DENT-001",
      "itemName": "كرسي أسنان متقدم",
      "quantity": 1,
      "beneficiaryFacility": "عيادة أسنان الرياض",
      "financialApprovalNumber": "FA-001",
      "approvalDate": "2025-01-02",
      "totalCost": 25000,
      "supplierName": "شركة الأجهزة الطبية",
      "supplierContact": "+966501234567",
      "status": "تم التعاقد",
      "deliveryDate": "2025-02-01",
      "actualDeliveryDate": null,
      "notes": "ملاحظات خاصة"
    }
  ]
}
```

### 2. Create Dental Contract
**Endpoint**: `POST /dental/contracts`

**Description**: Create a new dental contract

**Request Body**:
```json
{
  "orderDate": "2025-01-01",
  "itemNumber": "DENT-001",
  "itemName": "كرسي أسنان متقدم",
  "quantity": 1,
  "beneficiaryFacility": "عيادة أسنان الرياض",
  "financialApprovalNumber": "FA-001",
  "approvalDate": "2025-01-02",
  "totalCost": 25000,
  "supplierName": "شركة الأجهزة الطبية",
  "supplierContact": "+966501234567",
  "status": "جديد",
  "deliveryDate": "2025-02-01",
  "notes": "ملاحظات خاصة"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "تم إنشاء العقد بنجاح",
  "data": {
    "id": "DC002",
    "orderDate": "2025-01-01",
    "itemNumber": "DENT-001",
    "itemName": "كرسي أسنان متقدم",
    "quantity": 1,
    "beneficiaryFacility": "عيادة أسنان الرياض",
    "totalCost": 25000,
    "status": "جديد"
  }
}
```

### 3. Get Specific Dental Contract
**Endpoint**: `GET /dental/contracts/{id}`

**Description**: Retrieve a specific dental contract by ID

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب العقد بنجاح",
  "data": {
    "id": "DC001",
    "orderDate": "2025-01-01",
    "itemNumber": "DENT-001",
    "itemName": "كرسي أسنان متقدم",
    "quantity": 1,
    "beneficiaryFacility": "عيادة أسنان الرياض",
    "totalCost": 25000,
    "status": "تم التعاقد"
  }
}
```

### 4. Update Dental Contract
**Endpoint**: `PUT /dental/contracts/{id}`

**Description**: Update an existing dental contract

**Request Body**: Same as create contract

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم تحديث العقد بنجاح",
  "data": {
    "id": "DC001",
    "status": "تم التسليم",
    "actualDeliveryDate": "2025-01-30"
  }
}
```

### 5. Delete Dental Contract
**Endpoint**: `DELETE /dental/contracts/{id}`

**Description**: Delete a dental contract

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم حذف العقد بنجاح"
}
```

---

## Dental Reports Endpoints

### 1. Get Dental Contract Reports
**Endpoint**: `GET /dental/contracts/reports`

**Description**: Retrieve dental contract reports with server-side filtering

**Query Parameters**:
- `type` (optional): Report type filter

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم إنشاء التقرير بنجاح",
  "data": [
    {
      "id": "DC001",
      "itemNumber": "DENT-001",
      "itemName": "كرسي أسنان متقدم",
      "beneficiary": "عيادة أسنان الرياض",
      "supplier": "شركة الأجهزة الطبية",
      "status": "تم التسليم",
      "totalCost": 25000,
      "orderDate": "2025-01-01",
      "deliveryDate": "2025-01-30"
    }
  ]
}
```

---

## Dental Dashboard Endpoints

### 1. Get Dental Dashboard Data
**Endpoint**: `GET /dental/contracts/dashboard`

**Description**: Retrieve aggregated dashboard data for dental contracts

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب بيانات لوحة التحكم بنجاح",
  "data": {
    "summary": {
      "total": 125,
      "new": 8,
      "approved": 25,
      "contracted": 67,
      "delivered": 18,
      "rejected": 7,
      "totalValue": 1850000
    },
    "statusData": [
      { "name": "جديد", "value": 8, "color": "#3b82f6" },
      { "name": "موافق عليه", "value": 25, "color": "#f59e0b" },
      { "name": "تم التعاقد", "value": 67, "color": "#8b5cf6" },
      { "name": "تم التسليم", "value": 18, "color": "#10b981" },
      { "name": "مرفوض", "value": 7, "color": "#ef4444" }
    ],
    "monthlyData": [
      { "month": "يناير", "contracts": 32, "value": 485000 },
      { "month": "فبراير", "contracts": 28, "value": 420000 },
      { "month": "مارس", "contracts": 35, "value": 560000 },
      { "month": "أبريل", "contracts": 30, "value": 385000 }
    ],
    "contracts": []
  }
}
```

### 2. Get Top Suppliers
**Endpoint**: `GET /dental/contracts/top-suppliers`

**Description**: Retrieve top suppliers for dental contracts

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب أفضل الموردين بنجاح",
  "data": [
    {
      "name": "شركة التجهيزات الطبية المتقدمة",
      "contracts": 35,
      "value": 650000
    },
    {
      "name": "مؤسسة الأجهزة التشخيصية",
      "contracts": 28,
      "value": 485000
    }
  ]
}
```

### 3. Get Top Clinics
**Endpoint**: `GET /dental/contracts/top-clinics`

**Description**: Retrieve top clinics for dental contracts

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب أكثر العيادات نشاطاً بنجاح",
  "data": [
    {
      "name": "عيادة الأسنان - المبنى الرئيسي",
      "contracts": 42,
      "value": 720000
    },
    {
      "name": "مركز طب الأسنان التخصصي",
      "contracts": 35,
      "value": 580000
    }
  ]
}
```

---

## Dental Assets Endpoints

### 1. Get Dental Assets
**Endpoint**: `GET /dental/assets`

**Description**: Retrieve all dental assets

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب الأصول بنجاح",
  "data": [
    {
      "id": "DA001",
      "deviceName": "كرسي أسنان متقدم",
      "serialNumber": "SN123456",
      "facilityName": "عيادة أسنان الرياض",
      "supplierName": "شركة الأجهزة الطبية",
      "supplierContact": "+966501234567",
      "supplierEmail": "info@medical.com",
      "deviceModel": "Model-X1",
      "deliveryDate": "2025-01-01",
      "installationDate": "2025-01-05",
      "warrantyPeriod": 2,
      "deviceStatus": "يعمل",
      "warrantyStatus": "تحت الضمان",
      "malfunctionCount": 0,
      "notes": "ملاحظات"
    }
  ]
}
```

### 2. Create Dental Asset
**Endpoint**: `POST /dental/assets`

**Description**: Create a new dental asset

**Request Body**:
```json
{
  "deviceName": "كرسي أسنان متقدم",
  "serialNumber": "SN123456",
  "facilityName": "عيادة أسنان الرياض",
  "supplierName": "شركة الأجهزة الطبية",
  "supplierContact": "+966501234567",
  "supplierEmail": "info@medical.com",
  "deviceModel": "Model-X1",
  "deliveryDate": "2025-01-01",
  "installationDate": "2025-01-05",
  "warrantyPeriod": 2,
  "deviceStatus": "يعمل",
  "notes": "ملاحظات"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "تم إضافة الجهاز بنجاح",
  "data": {
    "id": "DA002",
    "deviceName": "كرسي أسنان متقدم",
    "serialNumber": "SN123456",
    "facilityName": "عيادة أسنان الرياض",
    "deviceStatus": "يعمل"
  }
}
```

### 3. Get Specific Dental Asset
**Endpoint**: `GET /dental/assets/{id}`

**Description**: Retrieve a specific dental asset by ID

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب الجهاز بنجاح",
  "data": {
    "id": "DA001",
    "deviceName": "كرسي أسنان متقدم",
    "serialNumber": "SN123456",
    "facilityName": "عيادة أسنان الرياض",
    "deviceStatus": "يعمل"
  }
}
```

### 4. Update Dental Asset
**Endpoint**: `PUT /dental/assets/{id}`

**Description**: Update an existing dental asset

**Request Body**: Same as create asset

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم تحديث الجهاز بنجاح",
  "data": {
    "id": "DA001",
    "deviceStatus": "مكهن",
    "malfunctionCount": 1
  }
}
```

### 5. Delete Dental Asset
**Endpoint**: `DELETE /dental/assets/{id}`

**Description**: Delete a dental asset

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم حذف الجهاز بنجاح"
}
```

---

## Dental Assets Dashboard Endpoints

### 1. Get Dental Assets Dashboard Data
**Endpoint**: `GET /dental/assets/dashboard`

**Description**: Retrieve dental assets dashboard data

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب بيانات لوحة التحكم بنجاح",
  "data": {
    "assets": [
      {
        "id": 1,
        "name": "كرسي أسنان متقدم",
        "facility": "عيادة أسنان الرياض",
        "supplier": "شركة الأجهزة الطبية",
        "status": "يعمل",
        "type": "معدات طبية"
      }
    ],
    "aggregates": {
      "total": 50,
      "working": 45,
      "broken": 5,
      "facilities": 10,
      "suppliers": 8
    }
  }
}
```

---

## Facilities and Suppliers Endpoints

### 1. Get Facilities List
**Endpoint**: `GET /facilities`

**Description**: Retrieve all facilities for dropdown filters

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب المنشآت بنجاح",
  "data": [
    {
      "id": 1,
      "name": "مستشفى الملك فهد",
      "type": "مستشفى",
      "status": "active"
    },
    {
      "id": 2,
      "name": "عيادة أسنان الرياض",
      "type": "عيادة",
      "status": "active"
    }
  ]
}
```

### 2. Get Suppliers List
**Endpoint**: `GET /suppliers`

**Description**: Retrieve all suppliers for dropdown filters

**Success Response (200)**:
```json
{
  "success": true,
  "message": "تم جلب الموردين بنجاح",
  "data": [
    {
      "id": 1,
      "name": "شركة المستلزمات الطبية",
      "contact": "+966501234567",
      "email": "info@medical-supplies.com"
    },
    {
      "id": 2,
      "name": "شركة الأجهزة الطبية",
      "contact": "+966507654321",
      "email": "sales@medical-devices.com"
    }
  ]
}
```

---

## Status Codes

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

---

## Notes

- All endpoints require authentication except login endpoints
- Responses should be consistent with the UI expectations shown in the frontend pages
- Use `/facilities` and `/suppliers` endpoints to populate filter dropdowns
- Dashboard endpoints provide aggregated data for charts and statistics
- All dates should be in ISO format (YYYY-MM-DD)
- Arabic text should be properly encoded in UTF-8
- Status values for dental contracts and direct purchase orders: "جديد", "موافق عليه", "تم التعاقد", "تم التسليم", "مرفوض"
- Device status values for dental assets: "يعمل", "مكهن"
- Token expires in 3600 seconds (1 hour) and should be refreshed accordingly