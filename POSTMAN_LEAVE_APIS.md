# Leave Management APIs - Postman Collection

**Base URL:** `http://localhost:3000/api/v1`  
**Authentication:** Bearer Token required for all endpoints

---

## Leave Request Endpoints

### 1. Get All Leaves
**Method:** `GET`  
**Route:** `/leaves`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Query Parameters:**
```
?page=1
&limit=10
&status=pending
&employeeId=<employee-id>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "leave_id_here",
      "employeeId": "employee_id_here",
      "employeeName": "John Doe",
      "leaveType": "Sick Leave",
      "fromDate": "2024-01-15T00:00:00.000Z",
      "toDate": "2024-01-16T00:00:00.000Z",
      "reason": "Not feeling well",
      "status": "pending",
      "days": 2,
      "createdAt": "2024-01-14T10:00:00.000Z",
      "updatedAt": "2024-01-14T10:00:00.000Z"
    }
  ],
  "message": "Leaves retrieved successfully",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

---

### 2. Get My Leave Requests
**Method:** `GET`  
**Route:** `/leaves/my-requests`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Query Parameters:**
```
?page=1
&limit=10
&status=pending
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "leave_id_here",
      "employeeId": "current_employee_id",
      "leaveType": "Casual Leave",
      "fromDate": "2024-02-01T00:00:00.000Z",
      "toDate": "2024-02-02T00:00:00.000Z",
      "reason": "Personal work",
      "status": "approved",
      "days": 2,
      "approvedBy": "manager_id",
      "approvedAt": "2024-01-28T15:30:00.000Z"
    }
  ],
  "message": "My leave requests retrieved successfully"
}
```

---

### 3. Get My Pending Leaves
**Method:** `GET`  
**Route:** `/leaves/my-pending`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "leave_id_here",
      "employeeId": "current_employee_id",
      "leaveType": "Earned Leave",
      "fromDate": "2024-03-10T00:00:00.000Z",
      "toDate": "2024-03-15T00:00:00.000Z",
      "reason": "Family vacation",
      "status": "pending",
      "days": 5
    }
  ],
  "message": "Pending leaves retrieved successfully"
}
```

---

### 4. Get Leave by ID
**Method:** `GET`  
**Route:** `/leaves/:id`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_id_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "leave_id_here",
    "employeeId": "employee_id_here",
    "employee": {
      "_id": "employee_id_here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "department": "Engineering"
    },
    "leaveType": "Sick Leave",
    "fromDate": "2024-01-15T00:00:00.000Z",
    "toDate": "2024-01-16T00:00:00.000Z",
    "reason": "Not feeling well",
    "status": "approved",
    "days": 2,
    "approvedBy": {
      "_id": "manager_id",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "approvedAt": "2024-01-14T14:30:00.000Z",
    "createdAt": "2024-01-14T10:00:00.000Z",
    "updatedAt": "2024-01-14T14:30:00.000Z"
  },
  "message": "Leave retrieved successfully"
}
```

---

### 5. Create Leave Request
**Method:** `POST`  
**Route:** `/leaves`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "employeeId": "employee_id_here",
  "leaveType": "Sick Leave",
  "fromDate": "2024-01-20",
  "toDate": "2024-01-22",
  "reason": "Doctor appointment and recovery"
}
```

**Valid Leave Types:**
- `Sick Leave`
- `Casual Leave`
- `Earned Leave`
- `Maternity Leave`
- `Paternity Leave`
- `Unpaid Leave`

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "_id": "new_leave_id_here",
    "employeeId": "employee_id_here",
    "leaveType": "Sick Leave",
    "fromDate": "2024-01-20T00:00:00.000Z",
    "toDate": "2024-01-22T00:00:00.000Z",
    "reason": "Doctor appointment and recovery",
    "status": "pending",
    "days": 3,
    "createdAt": "2024-01-19T09:00:00.000Z",
    "updatedAt": "2024-01-19T09:00:00.000Z"
  },
  "message": "Leave request created successfully"
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "leaveType",
      "message": "Invalid leave type"
    },
    {
      "field": "fromDate",
      "message": "Valid from date is required"
    }
  ]
}
```

---

### 6. Update Leave Request
**Method:** `PUT`  
**Route:** `/leaves/:id`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_id_here
```

**Request Body:**
```json
{
  "leaveType": "Casual Leave",
  "fromDate": "2024-01-21",
  "toDate": "2024-01-23",
  "reason": "Updated reason for leave"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "leave_id_here",
    "employeeId": "employee_id_here",
    "leaveType": "Casual Leave",
    "fromDate": "2024-01-21T00:00:00.000Z",
    "toDate": "2024-01-23T00:00:00.000Z",
    "reason": "Updated reason for leave",
    "status": "pending",
    "days": 3,
    "updatedAt": "2024-01-19T10:30:00.000Z"
  },
  "message": "Leave updated successfully"
}
```

---

### 7. Approve Leave Request
**Method:** `PUT`  
**Route:** `/leaves/:id/approve`  
**Auth:** Required (Manager/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_id_here
```

**Request Body (Optional):**
```json
{
  "comment": "Approved. Have a good rest!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "leave_id_here",
    "status": "approved",
    "approvedBy": "manager_id",
    "approvedAt": "2024-01-19T11:00:00.000Z",
    "comment": "Approved. Have a good rest!"
  },
  "message": "Leave approved successfully"
}
```

---

### 8. Reject Leave Request
**Method:** `PUT`  
**Route:** `/leaves/:id/reject`  
**Auth:** Required (Manager/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_id_here
```

**Request Body (Optional):**
```json
{
  "reason": "Insufficient leave balance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "leave_id_here",
    "status": "rejected",
    "rejectedBy": "manager_id",
    "rejectedAt": "2024-01-19T11:30:00.000Z",
    "rejectionReason": "Insufficient leave balance"
  },
  "message": "Leave rejected successfully"
}
```

---

### 9. Cancel Leave Request
**Method:** `POST`  
**Route:** `/leaves/:id/cancel`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_id_here
```

**Request Body (Optional):**
```json
{
  "reason": "No longer need leave"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "leave_id_here",
    "status": "cancelled",
    "cancelledBy": "employee_id",
    "cancelledAt": "2024-01-19T12:00:00.000Z",
    "cancellationReason": "No longer need leave"
  },
  "message": "Leave cancelled successfully"
}
```

---

### 10. Get Leave Balance
**Method:** `GET`  
**Route:** `/leaves/balance/:employeeId`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
employeeId: employee_id_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employeeId": "employee_id_here",
    "employeeName": "John Doe",
    "leaveBalances": [
      {
        "leaveType": "Sick Leave",
        "total": 10,
        "used": 3,
        "remaining": 7,
        "year": 2024
      },
      {
        "leaveType": "Casual Leave",
        "total": 8,
        "used": 2,
        "remaining": 6,
        "year": 2024
      },
      {
        "leaveType": "Earned Leave",
        "total": 15,
        "used": 5,
        "remaining": 10,
        "year": 2024
      },
      {
        "leaveType": "Maternity Leave",
        "total": 90,
        "used": 0,
        "remaining": 90,
        "year": 2024
      },
      {
        "leaveType": "Paternity Leave",
        "total": 15,
        "used": 0,
        "remaining": 15,
        "year": 2024
      }
    ],
    "message": "Leave balance retrieved successfully"
  }
}
```

---

### 11. Get Leave Approvals (For Managers/HR)
**Method:** `GET`  
**Route:** `/leaves/approvals`  
**Auth:** Required (Manager/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Query Parameters:**
```
?page=1
&limit=10
&status=pending
&department=Engineering
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "leave_id_here",
      "employee": {
        "_id": "employee_id_here",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com",
        "department": "Engineering",
        "manager": "manager_id"
      },
      "leaveType": "Sick Leave",
      "fromDate": "2024-01-20T00:00:00.000Z",
      "toDate": "2024-01-22T00:00:00.000Z",
      "reason": "Doctor appointment",
      "status": "pending",
      "days": 3,
      "appliedOn": "2024-01-19T09:00:00.000Z"
    }
  ],
  "message": "Leave approvals retrieved successfully",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

---

## Holiday Management Endpoints

### 12. Get All Holidays
**Method:** `GET`  
**Route:** `/leaves/holidays`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Query Parameters:**
```
?year=2024
&month=1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "holiday_id_here",
      "name": "New Year's Day",
      "date": "2024-01-01T00:00:00.000Z",
      "type": "public",
      "year": 2024,
      "isRecurring": true
    },
    {
      "_id": "holiday_id_here",
      "name": "Republic Day",
      "date": "2024-01-26T00:00:00.000Z",
      "type": "public",
      "year": 2024,
      "isRecurring": true
    }
  ],
  "message": "Holidays retrieved successfully"
}
```

---

### 13. Get Holiday by ID
**Method:** `GET`  
**Route:** `/leaves/holidays/:id`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: holiday_id_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "holiday_id_here",
    "name": "Independence Day",
    "date": "2024-08-15T00:00:00.000Z",
    "type": "public",
    "year": 2024,
    "isRecurring": true,
    "description": "National holiday",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Holiday retrieved successfully"
}
```

---

### 14. Create Holiday
**Method:** `POST`  
**Route:** `/leaves/holidays`  
**Auth:** Required (Admin/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Company Annual Day",
  "date": "2024-03-15",
  "type": "company",
  "isRecurring": false,
  "description": "Annual company celebration",
  "year": 2024
}
```

**Holiday Types:**
- `public` - Government holidays
- `company` - Company-specific holidays
- `optional` - Optional holidays

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_holiday_id_here",
    "name": "Company Annual Day",
    "date": "2024-03-15T00:00:00.000Z",
    "type": "company",
    "isRecurring": false,
    "description": "Annual company celebration",
    "year": 2024,
    "createdAt": "2024-01-19T13:00:00.000Z"
  },
  "message": "Holiday created successfully"
}
```

---

### 15. Update Holiday
**Method:** `PUT`  
**Route:** `/leaves/holidays/:id`  
**Auth:** Required (Admin/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: holiday_id_here
```

**Request Body:**
```json
{
  "name": "Company Annual Day (Updated)",
  "date": "2024-03-16",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "holiday_id_here",
    "name": "Company Annual Day (Updated)",
    "date": "2024-03-16T00:00:00.000Z",
    "type": "company",
    "isRecurring": false,
    "description": "Updated description",
    "year": 2024,
    "updatedAt": "2024-01-19T13:30:00.000Z"
  },
  "message": "Holiday updated successfully"
}
```

---

### 16. Delete Holiday
**Method:** `DELETE`  
**Route:** `/leaves/holidays/:id`  
**Auth:** Required (Admin/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: holiday_id_here
```

**Response:**
```json
{
  "success": true,
  "message": "Holiday deleted successfully"
}
```

---

## Leave Type Management Endpoints

### 17. Get All Leave Types
**Method:** `GET`  
**Route:** `/leaves/types`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "leave_type_id_here",
      "name": "Sick Leave",
      "code": "SL",
      "daysPerYear": 10,
      "isPaid": true,
      "requiresDocument": true,
      "description": "For illness and medical emergencies",
      "isActive": true
    },
    {
      "_id": "leave_type_id_here",
      "name": "Casual Leave",
      "code": "CL",
      "daysPerYear": 8,
      "isPaid": true,
      "requiresDocument": false,
      "description": "For personal reasons",
      "isActive": true
    },
    {
      "_id": "leave_type_id_here",
      "name": "Earned Leave",
      "code": "EL",
      "daysPerYear": 15,
      "isPaid": true,
      "requiresDocument": false,
      "description": "Accumulated based on work duration",
      "isActive": true
    }
  ],
  "message": "Leave types retrieved successfully"
}
```

---

### 18. Get Leave Type by ID
**Method:** `GET`  
**Route:** `/leaves/types/:id`  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_type_id_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "leave_type_id_here",
    "name": "Maternity Leave",
    "code": "ML",
    "daysPerYear": 90,
    "isPaid": true,
    "requiresDocument": true,
    "description": "For female employees during pregnancy",
    "isActive": true,
    "applicableTo": ["female"],
    "minServiceRequired": 80,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Leave type retrieved successfully"
}
```

---

### 19. Create Leave Type
**Method:** `POST`  
**Route:** `/leaves/types`  
**Auth:** Required (Admin/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Compensatory Off",
  "code": "CO",
  "daysPerYear": 0,
  "isPaid": true,
  "requiresDocument": false,
  "description": "For work done on holidays",
  "isActive": true,
  "applicableTo": ["all"],
  "isAccumulative": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_leave_type_id_here",
    "name": "Compensatory Off",
    "code": "CO",
    "daysPerYear": 0,
    "isPaid": true,
    "requiresDocument": false,
    "description": "For work done on holidays",
    "isActive": true,
    "applicableTo": ["all"],
    "isAccumulative": false,
    "createdAt": "2024-01-19T14:00:00.000Z"
  },
  "message": "Leave type created successfully"
}
```

---

### 20. Update Leave Type
**Method:** `PUT`  
**Route:** `/leaves/types/:id`  
**Auth:** Required (Admin/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_type_id_here
```

**Request Body:**
```json
{
  "daysPerYear": 12,
  "description": "Updated description for casual leave",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "leave_type_id_here",
    "name": "Casual Leave",
    "code": "CL",
    "daysPerYear": 12,
    "isPaid": true,
    "requiresDocument": false,
    "description": "Updated description for casual leave",
    "isActive": true,
    "updatedAt": "2024-01-19T14:30:00.000Z"
  },
  "message": "Leave type updated successfully"
}
```

---

### 21. Delete Leave Type
**Method:** `DELETE`  
**Route:** `/leaves/types/:id`  
**Auth:** Required (Admin/HR only)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
```
id: leave_type_id_here
```

**Response:**
```json
{
  "success": true,
  "message": "Leave type deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "employeeId",
      "message": "Valid employee ID is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided or invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Leave request not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An error occurred while processing your request"
}
```

---

## Postman Collection Setup

### Environment Variables
Create an environment in Postman with these variables:

```
BASE_URL = http://localhost:3000/api/v1
JWT_TOKEN = your_jwt_token_here
EMPLOYEE_ID = employee_id_here
LEAVE_ID = leave_id_here
HOLIDAY_ID = holiday_id_here
LEAVE_TYPE_ID = leave_type_id_here
```

### Collection Variables
```
@BASE_URL = {{BASE_URL}}
@TOKEN = {{JWT_TOKEN}}
```

### Pre-request Script
```javascript
// Set authorization header automatically
pm.request.headers.add({
    key: 'Authorization',
    value: `Bearer {{JWT_TOKEN}}`
});
```

### Tests Script
```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success property", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

pm.test("Response is successful", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});
```

---

## Testing Workflow

### 1. Employee Workflow
1. Login to get JWT token
2. Get leave balance: `GET /leaves/balance/:employeeId`
3. Create leave request: `POST /leaves`
4. Check my requests: `GET /leaves/my-requests`
5. Cancel if needed: `POST /leaves/:id/cancel`

### 2. Manager/HR Workflow
1. Login to get JWT token
2. Get pending approvals: `GET /leaves/approvals`
3. Approve leave: `PUT /leaves/:id/approve`
4. Reject leave: `PUT /leaves/:id/reject`
5. View all leaves: `GET /leaves`

### 3. Admin Workflow
1. Login to get JWT token
2. Create holiday: `POST /leaves/holidays`
3. Create leave type: `POST /leaves/types`
4. Update holiday: `PUT /leaves/holidays/:id`
5. Update leave type: `PUT /leaves/types/:id`

---

## Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD)
- Employee ID must be a valid MongoDB ObjectId
- Leave requests can only be cancelled if status is 'pending'
- Only managers and HR can approve/reject leaves
- Leave balance is automatically updated when leave is approved
- Holidays affect leave balance calculations
