# Healthcare Management System API Documentation - Version 2

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require Bearer Token authentication.
```
Authorization: Bearer {token}
```

---

## Items Management Endpoints

### Get All Items
```http
GET /items
```

**Description**: Retrieve all available items with their details including available quantities.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "itemNumber": "ITM-001",
      "itemName": "قفازات طبية",
      "availableQty": 500,
      "unitPrice": 2.5,
      "category": "مستلزمات طبية",
      "supplier": "شركة المستلزمات الطبية",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:20:00Z"
    },
    {
      "id": 2,
      "itemNumber": "ITM-002",
      "itemName": "كمامات جراحية",
      "availableQty": 1000,
      "unitPrice": 1.0,
      "category": "مستلزمات جراحية",
      "supplier": "شركة الأدوات الجراحية",
      "createdAt": "2024-01-16T09:15:00Z",
      "updatedAt": "2024-01-22T11:45:00Z"
    }
  ],
  "message": "تم جلب الأصناف بنجاح"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "فشل في جلب الأصناف",
  "errors": ["Database connection error"]
}
```

### Get Item by Number
```http
GET /items/{itemNumber}
```

**Description**: Retrieve specific item details by item number.

**Parameters**:
- `itemNumber` (string, required): The item number to retrieve

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "itemNumber": "ITM-001",
    "itemName": "قفازات طبية",
    "availableQty": 500,
    "unitPrice": 2.5,
    "category": "مستلزمات طبية",
    "supplier": "شركة المستلزمات الطبية",
    "description": "قفازات طبية عالية الجودة للاستخدام الطبي",
    "specifications": {
      "material": "latex",
      "size": "متوسط",
      "color": "أبيض"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:20:00Z"
  },
  "message": "تم جلب بيانات الصنف بنجاح"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "الصنف غير موجود",
  "errors": ["Item not found"]
}
```

---

## Direct Purchase Management Endpoints

### Submit Purchase Order
```http
POST /api/direct-purchase/submit
```

**Description**: Submit a new direct purchase order with all required details.

**Request Body**:
```json
{
  "orderNumber": "ORD-1704967890123",
  "orderDate": "2024-01-15",
  "itemNumber": "ITM-001",
  "itemName": "قفازات طبية",
  "quantity": "100",
  "beneficiaryFacility": "مستشفى الملك فهد",
  "financialApprovalNumber": "FA-2024-001",
  "financialApprovalDate": "2024-01-10",
  "totalCost": "250.00",
  "supplierCompany": "شركة المستلزمات الطبية",
  "supplierContact": "أحمد محمد",
  "supplierPhone": "0501234567",
  "supplierEmail": "contact@medical-supplies.com",
  "orderStatus": "جديد",
  "deliveryDate": "2024-02-01",
  "handoverDate": "",
  "notes": "طلب عاجل للقسم الطبي"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "orderNumber": "ORD-1704967890123",
    "status": "جديد",
    "submittedAt": "2024-01-15T14:30:00Z",
    "estimatedProcessingTime": "3-5 أيام عمل"
  },
  "message": "تم إرسال طلب الشراء بنجاح"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "فشل في إرسال طلب الشراء",
  "errors": [
    "الكمية المطلوبة تتجاوز الكمية المتاحة",
    "رقم التعميد المالي مطلوب"
  ]
}
```

### Validation Rules for Purchase Orders

1. **Item Validation**:
   - Item number must exist in the system
   - Item name is auto-filled and cannot be manually changed
   - Quantity must not exceed available quantity

2. **Required Fields**:
   - Order date
   - Item number and quantity
   - Beneficiary facility
   - Financial approval number and date
   - Total cost
   - Supplier company details

3. **Business Rules**:
   - Quantity must be positive integer
   - Total cost must be positive number
   - Delivery date must be in the future
   - Financial approval date must be before order date

---

## Error Handling

### Standard Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `422` - Unprocessable Entity (business logic errors)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "وصف مختصر للخطأ",
  "errors": [
    "تفاصيل الخطأ الأول",
    "تفاصيل الخطأ الثاني"
  ],
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T14:30:00Z"
}
```

---

## Data Models

### Item Model
```typescript
interface Item {
  id: number;
  itemNumber: string;
  itemName: string;
  availableQty: number;
  unitPrice: number;
  category: string;
  supplier: string;
  description?: string;
  specifications?: object;
  createdAt: string;
  updatedAt: string;
}
```

### Purchase Order Model
```typescript
interface PurchaseOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  itemNumber: string;
  itemName: string;
  quantity: number;
  beneficiaryFacility: string;
  financialApprovalNumber: string;
  financialApprovalDate: string;
  totalCost: number;
  supplierCompany: string;
  supplierContact: string;
  supplierPhone: string;
  supplierEmail: string;
  orderStatus: 'جديد' | 'موافق عليه' | 'تم التعاقد' | 'تم التسليم' | 'مرفوض';
  deliveryDate?: string;
  handoverDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Notes for Laravel Implementation

1. **Middleware**: Use `auth:sanctum` for API authentication
2. **Validation**: Implement comprehensive validation rules using Form Requests
3. **Rate Limiting**: Apply rate limiting to prevent abuse
4. **CORS**: Configure CORS for frontend integration
5. **Localization**: Support Arabic language responses
6. **Database Design**: 
   - Use foreign key constraints
   - Implement soft deletes for audit trail
   - Add indexes for performance optimization
7. **Security**: 
   - Validate all inputs
   - Use parameterized queries
   - Implement proper authorization checks
   - Log all purchase order submissions

### Database Schema Updates

```sql
-- Items table
CREATE TABLE items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_number VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    available_qty INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100),
    supplier VARCHAR(255),
    description TEXT,
    specifications JSON,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_item_number (item_number),
    INDEX idx_category (category)
);

-- Update purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN item_number VARCHAR(50) AFTER order_date,
ADD FOREIGN KEY (item_number) REFERENCES items(item_number);
```