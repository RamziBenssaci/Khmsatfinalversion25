# API Documentation V5 - Dental Contracts Module

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

## Dental Contracts APIs

### 1. Create Dental Contract
Create a new dental equipment/supplies contract.

**Endpoint:** `POST /dental/contracts`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "orderDate": "2024-08-01",
  "itemNumber": "DEN001",
  "itemName": "كرسي أسنان متقدم",
  "quantity": "2",
  "beneficiaryFacility": "عيادة أسنان الرياض",
  "financialApprovalNumber": "FA123456",
  "approvalDate": "2024-07-28",
  "totalCost": "50000.00",
  "supplierName": "شركة الأجهزة الطبية المتقدمة",
  "supplierContact": "+966501234567 - info@medical-advanced.com",
  "status": "جديد",
  "deliveryDate": "2024-09-01",
  "actualDeliveryDate": "",
  "notes": "يتطلب تركيب وتدريب"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "تم إنشاء عقد الأسنان بنجاح",
  "data": {
    "id": "DC001",
    "orderDate": "2024-08-01",
    "itemNumber": "DEN001",
    "itemName": "كرسي أسنان متقدم",
    "quantity": 2,
    "beneficiaryFacility": "عيادة أسنان الرياض",
    "financialApprovalNumber": "FA123456",
    "approvalDate": "2024-07-28",
    "totalCost": 50000.00,
    "supplierName": "شركة الأجهزة الطبية المتقدمة",
    "supplierContact": "+966501234567 - info@medical-advanced.com",
    "status": "جديد",
    "deliveryDate": "2024-09-01",
    "actualDeliveryDate": null,
    "notes": "يتطلب تركيب وتدريب",
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
}
```

**Field Descriptions:**
- `orderDate` (required): Date when the contract/order was created
- `itemNumber` (required): Unique identifier for the dental equipment/item
- `itemName` (required): Name/description of the dental equipment
- `quantity` (required): Number of items requested
- `beneficiaryFacility` (required): Name of dental clinic receiving the equipment
- `financialApprovalNumber` (optional): Financial authorization reference number
- `approvalDate` (optional): Date of financial approval
- `totalCost` (optional): Total contract cost in SAR
- `supplierName` (optional): Name of dental equipment supplier company
- `supplierContact` (optional): Supplier contact details (phone/email)
- `status` (required): Contract status (see status values below)
- `deliveryDate` (optional): Planned delivery date
- `actualDeliveryDate` (optional): Actual delivery date when delivered
- `notes` (optional): Additional notes about installation/training requirements

**Status Values:**
- `جديد` - New contract
- `موافق عليه` - Approved
- `تم التعاقد` - Contract signed
- `تم التسليم` - Delivered
- `مرفوض` - Rejected

### 2. Get All Dental Contracts
Retrieve all dental contracts for listing and management.

**Endpoint:** `GET /dental/contracts`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Query Parameters (Optional):**
- `status`: Filter by contract status
- `facility`: Filter by beneficiary facility
- `supplier`: Filter by supplier name
- `start_date`: Filter contracts from this date
- `end_date`: Filter contracts until this date

**Example Request:**
```
GET /dental/contracts?status=جديد&facility=عيادة أسنان الرياض
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم جلب عقود الأسنان بنجاح",
  "data": [
    {
      "id": "DC001",
      "orderDate": "2024-08-01",
      "itemNumber": "DEN001",
      "itemName": "كرسي أسنان متقدم",
      "quantity": 2,
      "beneficiaryFacility": "عيادة أسنان الرياض",
      "financialApprovalNumber": "FA123456",
      "approvalDate": "2024-07-28",
      "totalCost": 50000.00,
      "supplierName": "شركة الأجهزة الطبية المتقدمة",
      "supplierContact": "+966501234567 - info@medical-advanced.com",
      "status": "جديد",
      "deliveryDate": "2024-09-01",
      "actualDeliveryDate": null,
      "notes": "يتطلب تركيب وتدريب",
      "created_at": "2024-08-01T10:00:00Z",
      "updated_at": "2024-08-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "filtered": 5,
    "total_value": 1250000.00
  }
}
```

### 3. Get Single Dental Contract
Retrieve detailed information about a specific dental contract.

**Endpoint:** `GET /dental/contracts/{id}`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم جلب تفاصيل العقد بنجاح",
  "data": {
    "id": "DC001",
    "orderDate": "2024-08-01",
    "itemNumber": "DEN001",
    "itemName": "كرسي أسنان متقدم",
    "quantity": 2,
    "beneficiaryFacility": "عيادة أسنان الرياض",
    "financialApprovalNumber": "FA123456",
    "approvalDate": "2024-07-28",
    "totalCost": 50000.00,
    "supplierName": "شركة الأجهزة الطبية المتقدمة",
    "supplierContact": "+966501234567 - info@medical-advanced.com",
    "status": "جديد",
    "deliveryDate": "2024-09-01",
    "actualDeliveryDate": null,
    "notes": "يتطلب تركيب وتدريب",
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
}
```

### 4. Update Dental Contract
Update an existing dental contract.

**Endpoint:** `PUT /dental/contracts/{id}`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Request Body:** (Same structure as create, all fields optional for partial updates)
```json
{
  "status": "تم التسليم",
  "actualDeliveryDate": "2024-08-15",
  "notes": "تم التسليم والتركيب بنجاح"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم تحديث العقد بنجاح",
  "data": {
    "id": "DC001",
    "status": "تم التسليم",
    "actualDeliveryDate": "2024-08-15",
    "notes": "تم التسليم والتركيب بنجاح",
    "updated_at": "2024-08-15T14:30:00Z"
  }
}
```

### 5. Delete Dental Contract
Delete a dental contract (soft delete recommended).

**Endpoint:** `DELETE /dental/contracts/{id}`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم حذف العقد بنجاح"
}
```

## Error Responses

### Validation Errors (422):
```json
{
  "success": false,
  "message": "خطأ في البيانات المدخلة",
  "errors": {
    "orderDate": ["تاريخ الطلب مطلوب"],
    "itemNumber": ["رقم الصنف مطلوب"],
    "itemName": ["اسم الصنف مطلوب"],
    "quantity": ["الكمية مطلوبة ويجب أن تكون رقماً موجباً"],
    "beneficiaryFacility": ["العيادة المستفيدة مطلوبة"]
  }
}
```

### Not Found (404):
```json
{
  "success": false,
  "message": "العقد غير موجود"
}
```

### Unauthorized (401):
```json
{
  "success": false,
  "message": "غير مصرح، يرجى تسجيل الدخول"
}
```

### Forbidden (403):
```json
{
  "success": false,
  "message": "ليس لديك صلاحية للوصول لهذا المورد"
}
```

## Frontend Integration Notes

### Form Implementation:
- All 14 form fields are properly mapped to formData state
- Required fields are marked with asterisk (*)
- Form validation occurs on both client and server side
- All fields are submitted in the API request

### Status Management:
- Status dropdown includes all possible states
- Status styling is applied based on current state
- Status changes trigger UI updates

### Data Flow:
1. Form data is collected in `formData` state object
2. On submit, complete `formData` object is sent to API
3. Success response triggers form reset and list refresh
4. Error handling displays appropriate toast messages

### Responsive Design:
- Mobile-friendly form layout
- Table responsively hides columns on mobile
- Dialog popups work across all devices