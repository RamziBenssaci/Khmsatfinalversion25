# API Documentation V3 - Suppliers Management

## Overview
This document contains the API documentation for suppliers management endpoints in the Riyadh Health Cluster 2 system.

## Base URL
```
https://api.riyadh-health-cluster2.sa/v1
```

## Authentication
All API endpoints require authentication via Bearer token:
```
Authorization: Bearer <your-token-here>
```

## Suppliers API Endpoints

### 1. Get All Suppliers
Retrieve a list of all suppliers in the system.

**Endpoint:** `GET /suppliers`

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "supplier_001",
      "name": "شركة التقنية الطبية المتقدمة",
      "companyType": "medical_equipment",
      "contactPerson": "أحمد محمد الأحمد",
      "email": "ahmed@medical-tech.sa",
      "phone": "+966501234567",
      "address": "الرياض، حي الملز، شارع الملك فهد",
      "taxNumber": "300123456789003",
      "commercialRegister": "1010123456",
      "category": "أجهزة طبية",
      "status": "active",
      "contractStartDate": "2024-01-01",
      "contractEndDate": "2024-12-31",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalCount": 25,
  "currentPage": 1,
  "totalPages": 3
}
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10, max: 100)
- `status` (optional): Filter by status (`active`, `inactive`, `pending`)
- `category` (optional): Filter by supplier category
- `search` (optional): Search by supplier name or contact person

**Example Request:**
```bash
curl -X GET "https://api.riyadh-health-cluster2.sa/v1/suppliers?page=1&limit=20&status=active" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### 2. Get Single Supplier
Retrieve details of a specific supplier.

**Endpoint:** `GET /suppliers/{id}`

**Path Parameters:**
- `id` (required): Supplier ID

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "supplier_001",
    "name": "شركة التقنية الطبية المتقدمة",
    "companyType": "medical_equipment",
    "contactPerson": "أحمد محمد الأحمد",
    "email": "ahmed@medical-tech.sa",
    "phone": "+966501234567",
    "address": "الرياض، حي الملز، شارع الملك فهد",
    "taxNumber": "300123456789003",
    "commercialRegister": "1010123456",
    "category": "أجهزة طبية",
    "status": "active",
    "contractStartDate": "2024-01-01",
    "contractEndDate": "2024-12-31",
    "totalOrders": 156,
    "totalValue": 2500000.00,
    "rating": 4.8,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Create New Supplier
Add a new supplier to the system.

**Endpoint:** `POST /suppliers`

**Request Body:**
```json
{
  "name": "شركة الحلول الصحية الذكية",
  "companyType": "medical_supplies",
  "contactPerson": "فاطمة عبدالله الزهراني",
  "email": "fatima@smart-health.sa",
  "phone": "+966502345678",
  "address": "الرياض، حي العليا، طريق الملك عبدالعزيز",
  "taxNumber": "300234567890003",
  "commercialRegister": "1010234567",
  "category": "مستلزمات طبية",
  "contractStartDate": "2024-02-01",
  "contractEndDate": "2025-01-31"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "تم إنشاء الشركة الموردة بنجاح",
  "data": {
    "id": "supplier_026",
    "name": "شركة الحلول الصحية الذكية",
    // ... other supplier details
    "status": "pending",
    "createdAt": "2024-08-08T14:20:00Z",
    "updatedAt": "2024-08-08T14:20:00Z"
  }
}
```

### 4. Update Supplier
Update an existing supplier's information.

**Endpoint:** `PUT /suppliers/{id}`

**Path Parameters:**
- `id` (required): Supplier ID

**Request Body:** (Same as create, all fields optional)
```json
{
  "phone": "+966502345999",
  "email": "new-email@smart-health.sa",
  "status": "active"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "تم تحديث بيانات الشركة الموردة بنجاح",
  "data": {
    // Updated supplier object
  }
}
```

### 5. Delete Supplier
Remove a supplier from the system.

**Endpoint:** `DELETE /suppliers/{id}`

**Path Parameters:**
- `id` (required): Supplier ID

**Response Format:**
```json
{
  "success": true,
  "message": "تم حذف الشركة الموردة بنجاح"
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "SUPPLIER_NOT_FOUND",
    "message": "الشركة الموردة غير موجودة",
    "details": "Supplier with ID 'supplier_999' was not found"
  },
  "timestamp": "2024-08-08T14:30:00Z"
}
```

### Common Error Codes
- `SUPPLIER_NOT_FOUND` (404): Supplier not found
- `SUPPLIER_ALREADY_EXISTS` (409): Supplier with same name or tax number already exists
- `INVALID_SUPPLIER_DATA` (400): Invalid or missing required fields
- `SUPPLIER_HAS_ACTIVE_ORDERS` (409): Cannot delete supplier with active orders
- `UNAUTHORIZED` (401): Invalid or missing authentication token
- `FORBIDDEN` (403): Insufficient permissions
- `VALIDATION_ERROR` (422): Field validation failed

## Field Validations

### Required Fields (Create)
- `name`: 2-100 characters, Arabic and English allowed
- `contactPerson`: 2-50 characters
- `email`: Valid email format
- `phone`: Saudi mobile format (+966xxxxxxxxx)
- `taxNumber`: 15 digits, valid Saudi tax number format
- `commercialRegister`: 10 digits
- `category`: Must be from predefined categories

### Optional Fields
- `address`: Max 200 characters
- `contractStartDate`: ISO date format (YYYY-MM-DD)
- `contractEndDate`: ISO date format (YYYY-MM-DD)

### Status Values
- `active`: Supplier is active and can receive orders
- `inactive`: Supplier is temporarily inactive
- `pending`: Supplier registration is pending approval
- `suspended`: Supplier is suspended due to violations

### Company Types
- `medical_equipment`: أجهزة طبية
- `medical_supplies`: مستلزمات طبية  
- `pharmaceuticals`: أدوية
- `dental_supplies`: مستلزمات الأسنان
- `laboratory_equipment`: أجهزة المختبرات
- `maintenance_services`: خدمات الصيانة

## Usage Examples

### Filter Active Medical Equipment Suppliers
```bash
curl -X GET "https://api.riyadh-health-cluster2.sa/v1/suppliers?status=active&category=أجهزة طبية" \
  -H "Authorization: Bearer <token>"
```

### Search for Suppliers by Name
```bash
curl -X GET "https://api.riyadh-health-cluster2.sa/v1/suppliers?search=التقنية" \
  -H "Authorization: Bearer <token>"
```

### Get Suppliers with Pagination
```bash
curl -X GET "https://api.riyadh-health-cluster2.sa/v1/suppliers?page=2&limit=25" \
  -H "Authorization: Bearer <token>"
```

## Integration Notes

1. **Caching**: Supplier data is cached for 30 minutes to improve performance
2. **Rate Limiting**: Maximum 100 requests per minute per API key
3. **Webhook Support**: Available for supplier status changes and new registrations
4. **Bulk Operations**: Contact API support for bulk import/export capabilities

## Changelog

### Version 3.0 (2024-08-08)
- Initial release of Suppliers API
- Added comprehensive supplier management endpoints
- Implemented field validation and error handling
- Added support for supplier categories and status management
