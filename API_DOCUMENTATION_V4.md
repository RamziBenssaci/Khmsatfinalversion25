# API Documentation V4 - Direct Purchase Module

## Base URL
```
http://localhost:8000/api
```

## Authentication
All requests require authentication headers:
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

## Direct Purchase Dashboard APIs

### 1. Get Direct Purchase Orders
Retrieve all direct purchase orders for dashboard display.

**Endpoint:** `GET /direct-purchase/orders`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "DP001",
      "itemNumber": "ITM123",
      "itemName": "جهاز طبي متخصص",
      "beneficiary": "مستشفى الملك فهد",
      "supplier": "شركة المعدات الطبية",
      "status": "جديد",
      "totalCost": 50000,
      "orderDate": "2024-08-01",
      "deliveryDate": null,
      "created_at": "2024-08-01T10:00:00Z",
      "updated_at": "2024-08-01T10:00:00Z"
    }
  ]
}
```

**Status Values:**
- `جديد` - New order
- `موافق عليه` - Approved
- `تم التعاقد` - Contracted
- `تم التسليم` - Delivered
- `مرفوض` - Rejected

### 2. Get Facilities
Retrieve all facilities for filtering.

**Endpoint:** `GET /facilities`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "مستشفى الملك فهد",
      "sector": "الرياض",
      "type": "مستشفى",
      "total_clinics": 25,
      "working": 22,
      "not_working": 2,
      "out_of_order": 1,
      "created_at": "2024-08-01T10:00:00Z"
    }
  ]
}
```

### 3. Get Suppliers
Retrieve all suppliers for filtering.

**Endpoint:** `GET /suppliers`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "شركة المعدات الطبية",
      "contact_person": "أحمد محمد",
      "email": "ahmed@medical-supplies.com",
      "phone": "+966501234567",
      "address": "الرياض، المملكة العربية السعودية",
      "status": "active",
      "created_at": "2024-08-01T10:00:00Z"
    }
  ]
}
```

## Direct Purchase Reports APIs

### 1. Get Reports with Filters
Retrieve filtered reports for the reports page.

**Endpoint:** `GET /direct-purchase/reports`

**Query Parameters:**
- `status` (optional): Filter by order status
- `facility` (optional): Filter by facility name
- `supplier` (optional): Filter by supplier name
- `item_search` (optional): Search in item number or name
- `start_date` (optional): Filter orders from this date
- `end_date` (optional): Filter orders until this date

**Example Request:**
```
GET /direct-purchase/reports?status=جديد&facility=مستشفى الملك فهد&start_date=2024-08-01
```

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "DP001",
      "itemNumber": "ITM123",
      "itemName": "جهاز طبي متخصص",
      "beneficiary": "مستشفى الملك فهد",
      "supplier": "شركة المعدات الطبية",
      "status": "جديد",
      "totalCost": 50000,
      "orderDate": "2024-08-01",
      "deliveryDate": null
    }
  ],
  "meta": {
    "total": 150,
    "filtered": 25,
    "total_cost": 1250000
  }
}
```

## Frontend Implementation Notes

### Dashboard Component Features:
1. **Real-time Filtering**: Client-side filtering using React state
2. **Statistics Calculation**: Dynamic stats based on filtered data
3. **Charts Integration**: Recharts for data visualization
4. **Mobile Responsive**: Responsive design with Tailwind CSS

### Reports Component Features:
1. **Advanced Filtering**: Multiple filter criteria
2. **Export Functions**: Excel and PDF export capabilities
3. **Real-time Search**: Live filtering as user types
4. **Mobile Responsive**: Optimized for mobile devices

### Error Handling:
All API calls include proper error handling with toast notifications for user feedback.

### Data Flow:
1. Components fetch data on mount
2. Data is stored in local state
3. Filters are applied client-side for better performance
4. Charts and statistics update automatically based on filtered data

## Status Codes

### Success Responses:
- `200 OK` - Request successful
- `201 Created` - Resource created successfully

### Error Responses:
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

### Error Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Error message for this field"]
  }
}
```