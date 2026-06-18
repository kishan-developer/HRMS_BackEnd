import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import AuditLog from '../models/audit-log.model';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { AppError } from '../middleware/error.middleware';

// Get all users with filters
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      role,
      search,
    } = req.query;

    const query: any = {};

    // Validate pagination parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    if (pageNum < 1) {
      throw new AppError('Page number must be greater than 0', 400, 'INVALID_PAGE');
    }
    if (limitNum < 1 || limitNum > 100) {
      throw new AppError('Limit must be between 1 and 100', 400, 'INVALID_LIMIT');
    }

    // Apply filters if provided
    if (status !== undefined) {
      const isActive = status === 'active';
      if (status !== 'active' && status !== 'inactive') {
        throw new AppError('Invalid status value. Must be "active" or "inactive"', 400, 'INVALID_STATUS');
      }
      query.isActive = isActive;
    }
    if (role) {
      const validRoles = ['superadmin', 'hr_manager', 'accounts', 'employee', 'support'];
      if (!validRoles.includes(role as string)) {
        throw new AppError('Invalid role value', 400, 'INVALID_ROLE');
      }
      query.role = role;
    }
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.json({
      success: true,
      message: `Successfully retrieved ${users.length} users`,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      throw new AppError('Valid user ID is required', 400, 'INVALID_USER_ID');
    }

    const user = await User.findById(id).lean();

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Create new user
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { employeeId, email, password, role, firstName, lastName, department, designation, companyId } = req.body;
    const userId = (req as any).user?.id;

    // Validate required fields
    if (!email) {
      throw new AppError('Email is required', 400, 'MISSING_EMAIL');
    }
    if (!password) {
      throw new AppError('Password is required', 400, 'MISSING_PASSWORD');
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'INVALID_PASSWORD_LENGTH');
    }
    if (!role) {
      throw new AppError('Role is required', 400, 'MISSING_ROLE');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400, 'INVALID_EMAIL_FORMAT');
    }

    // Validate role
    const validRoles = ['superadmin', 'hr_manager', 'accounts', 'employee', 'support'];
    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400, 'INVALID_ROLE');
    }

    // Auto-generate employeeId if not provided
    const finalEmployeeId = employeeId || `EMP${Date.now()}`;

    // Check if user already exists for this employee
    if (finalEmployeeId) {
      const existingUser = await User.findOne({ employeeId: finalEmployeeId });
      if (existingUser) {
        throw new AppError(`User already exists for employee ID ${finalEmployeeId}`, 400, 'USER_ALREADY_EXISTS_FOR_EMPLOYEE');
      }
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new AppError(`User with email ${email} already exists`, 400, 'EMAIL_ALREADY_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with employee ID
    const user = new User({
      id: uuidv4(),
      employeeId: finalEmployeeId,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      firstName: firstName || '',
      lastName: lastName || '',
      department: department || '',
      designation: designation || '',
      companyId: companyId || '',
    });

    await user.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'create',
      module: 'users',
      entityType: 'User',
      entityId: user.id,
      description: `Created new user with email ${email} and employeeId ${finalEmployeeId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      message: `User created successfully with email ${email}`,
    });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = (req as any).user?.id;
    console.log('Update user request data:', { id, data , userId});

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    const user = await User.findById(id);
    console.log('User found for update:', user);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    // Prevent changing email to one that already exists
    if (data.email && data.email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  
      if (!emailRegex.test(data.email)) {
        throw new AppError('Invalid email format', 400, 'INVALID_EMAIL_FORMAT');
      }
      const existingEmail = await User.findOne({ email: data.email });
      if (existingEmail) {
        throw new AppError(`User with email ${data.email} already exists`, 400, 'EMAIL_ALREADY_EXISTS');
      }
    }

    // Validate role if being changed
    if (data.role) {
      const validRoles = ['superadmin', 'hr_manager', 'accounts', 'employee', 'support'];
      if (!validRoles.includes(data.role)) {
        throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400, 'INVALID_ROLE');
      }
    }

    Object.assign(user, data);
    await user.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'users',
      entityType: 'User',
      entityId: user.id,
      description: `Updated user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { changes: data },
    });

    return res.json({
      success: true,
      data: {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      message: `User ${user.email} updated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile (for employee self-update)
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Users can only update their own profile
    if (userId !== id) {
      throw new AppError('You can only update your own profile', 403, 'FORBIDDEN');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    // Allowed fields for self-update
    const allowedFields = [
      // Personal Information
      'firstName',
      'lastName',
      'middleName',
      'displayName',
      'phone',
      'dateOfBirth',
      'gender',
      'maritalStatus',
      'bloodGroup',
      'nationality',
      'religion',
      'fatherName',
      'motherName',
      'spouseName',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelation',
      'panNumber',
      'aadharNumber',
      'passportNumber',
      
      // Contact Information
      'mobile',
      'alternativeMobile',
      'currentAddress',
      'permanentAddress',
      'city',
      'state',
      'country',
      'zipCode',
      'permanentCity',
      'permanentState',
      'permanentCountry',
      'permanentZipCode',
      
      // Work Information
      'designation',
      'department',
      'departmentId',
      'branch',
      'employmentType',
      'workType',
      'employeeStatus',
      'company',
      'photoUrl',
      'roleId',
      'shiftId',
      'reportingManagerId',
      'teamLeadId',
      'workLocation',
      'probationEndDate',
      'contractEndDate',
      'salary',
      'salaryCurrency',
      'bankName',
      'bankAccountNumber',
      'bankIfscCode',
      'pfNumber',
      'esiNumber',
      'uanNumber',
      
      // Education
      'highestQualification',
      'collegeName',
      'passingYear',
      'education',
      
      // Skills & Languages
      'skills',
      'languages',
      'experience',
    ];

    // Filter only allowed fields
    const updateData: any = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Check if email is being changed and if it already exists
    if (req.body.email && req.body.email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        throw new AppError('Invalid email format', 400, 'INVALID_EMAIL_FORMAT');
      }
      const existingEmail = await User.findOne({ email: req.body.email });
      if (existingEmail) {
        throw new AppError(`User with email ${req.body.email} already exists`, 400, 'EMAIL_ALREADY_EXISTS');
      }
      updateData.email = req.body.email;
    }

    Object.assign(user, updateData);
    await user.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'users',
      entityType: 'User',
      entityId: user.id,
      description: `Updated profile for user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { changes: updateData },
    });

    return res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Reset user password
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (!newPassword) {
      throw new AppError('New password is required', 400, 'MISSING_NEW_PASSWORD');
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'INVALID_PASSWORD_LENGTH');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'password_change',
      module: 'users',
      entityType: 'User',
      entityId: user.id,
      description: `Reset password for user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Activate user
export const activateUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    if (user.isActive) {
      return res.json({
        success: true,
        message: `User ${user.email} is already active`,
      });
    }

    user.isActive = true;
    await user.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'users',
      entityType: 'User',
      entityId: user.id,
      description: `Activated user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: `User ${user.email} activated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate user
export const deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return res.json({
        success: true,
        message: `User ${user.email} is already inactive`,
      });
    }

    user.isActive = false;
    await user.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'users',
      entityType: 'User',
      entityId: user.id,
      description: `Deactivated user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: `User ${user.email} deactivated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Assign role
export const assignRole = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const userId = (req as any).user?.id;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (!role) {
      throw new AppError('Role is required', 400, 'MISSING_ROLE');
    }

    const validRoles = ['superadmin', 'hr_manager', 'accounts', 'employee', 'support'];
    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400, 'INVALID_ROLE');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    if (user.role === role) {
      return res.json({
        success: true,
        message: `User ${user.email} already has role ${role}`,
      });
    }

    user.role = role;
    await user.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'role_change',
      module: 'users',
      entityType: 'User',
      entityId: user.id,
      description: `Changed role for user ${user.email} to ${role}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: `Role ${role} assigned to user ${user.email} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (soft delete)
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    // Prevent deleting super admin
    if (user.role === 'superadmin') {
      throw new AppError('Cannot delete super admin user', 403, 'CANNOT_DELETE_SUPER_ADMIN');
    }

    // Prevent deleting yourself
    if (userId === id) {
      throw new AppError('Cannot delete your own account', 403, 'CANNOT_DELETE_SELF');
    }

    await User.findByIdAndDelete(id);

    // Log the action
    await AuditLog.create({
      userId,
      action: 'delete',
      module: 'users',
      entityType: 'User',
      entityId: id,
      description: `Deleted user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: `User ${user.email} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, PDF, Word, and image files are allowed.'));
    }
  },
});

// Upload document for user profile
export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (userId !== id) {
      throw new AppError('You can only upload documents to your own profile', 403, 'FORBIDDEN');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    // For now, store file as base64 (in production, use S3 or cloud storage)
    const fileBase64 = req.file.buffer.toString('base64');
    const fileUrl = `data:${req.file.mimetype};base64,${fileBase64}`;

    const document = {
      name: req.file.originalname,
      url: fileUrl,
      type: req.file.mimetype,
      category: 'other' as const,
      size: req.file.size,
      uploadedAt: new Date(),
      isVerified: false,
    };

    if (!user.documents) {
      user.documents = [];
    }

    user.documents.push(document);
    await user.save();

    return res.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete document from user profile
export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { documentName } = req.body;
    const userId = (req as any).userId;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (userId !== id) {
      throw new AppError('You can only delete documents from your own profile', 403, 'FORBIDDEN');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'USER_NOT_FOUND');
    }

    if (!user.documents || user.documents.length === 0) {
      throw new AppError('No documents found', 404, 'NO_DOCUMENTS');
    }

    user.documents = user.documents.filter(doc => doc.name !== documentName);
    await user.save();

    return res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Bulk upload users from CSV/Excel
export const bulkUploadUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded. Please select a CSV or Excel file', 400, 'NO_FILE');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError('File size exceeds 5MB limit', 400, 'FILE_TOO_LARGE');
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedTypes.includes(file.mimetype) && !file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      throw new AppError('Invalid file type. Only CSV and Excel files are allowed', 400, 'INVALID_FILE_TYPE');
    }

    let employees: any[] = [];

    // Parse CSV or Excel file
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      try {
        const results: any[] = [];
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);

        await new Promise((resolve, reject) => {
          bufferStream
            .pipe(csv())
            .on('data', (data: any) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
        });

        employees = results;
      } catch (parseError: any) {
        throw new AppError(`Failed to parse CSV file: ${parseError.message}`, 400, 'CSV_PARSE_ERROR');
      }
    } else {
      try {
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new AppError('Excel file has no sheets', 400, 'EMPTY_EXCEL_FILE');
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        employees = xlsx.utils.sheet_to_json(worksheet);
      } catch (parseError: any) {
        throw new AppError(`Failed to parse Excel file: ${parseError.message}`, 400, 'EXCEL_PARSE_ERROR');
      }
    }

    if (employees.length === 0) {
      throw new AppError('No data found in the file. Please ensure the file contains employee data', 400, 'EMPTY_FILE');
    }

    if (employees.length > 1000) {
      throw new AppError('Maximum 1000 records allowed per bulk upload', 400, 'TOO_MANY_RECORDS');
    }

    const results: {
      success: Array<{ email: string; employeeId?: string; role: string }>;
      failed: Array<{ row: any; error: string }>;
    } = {
      success: [],
      failed: [],
    };

    const validRoles = ['superadmin', 'hr_manager', 'accounts', 'employee', 'support'];

    // Process each employee
    for (const emp of employees) {
      try {
        const email = emp.email || emp.Email || emp.EMAIL;
        const employeeId = emp.employeeId || emp.EmployeeId || emp.EMPLOYEE_ID || emp['Employee ID'];
        const role = emp.role || emp.Role || emp.ROLE || 'employee';
        const firstName = emp.firstName || emp.FirstName || emp.FIRST_NAME || emp['First Name'] || '';
        const lastName = emp.lastName || emp.LastName || emp.LAST_NAME || emp['Last Name'] || '';
        const department = emp.department || emp.Department || emp.DEPARTMENT || '';
        const designation = emp.designation || emp.Designation || emp.DESIGNATION || '';
        const password = emp.password || emp.Password || emp.PASSWORD || 'Password@123';

        if (!email) {
          results.failed.push({
            row: emp,
            error: 'Email is required',
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed.push({
            row: emp,
            error: 'Invalid email format',
          });
          continue;
        }

        // Validate role
        if (!validRoles.includes(role)) {
          results.failed.push({
            row: emp,
            error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.failed.push({
            row: emp,
            error: `User with email ${email} already exists`,
          });
          continue;
        }

        // Check if employeeId already exists
        if (employeeId) {
          const existingUser = await User.findOne({ employeeId });
          if (existingUser) {
            results.failed.push({
              row: emp,
              error: `Employee ID ${employeeId} already exists`,
            });
            continue;
          }
        }

        // Validate password length
        if (password.length < 8) {
          results.failed.push({
            row: emp,
            error: 'Password must be at least 8 characters long',
          });
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
          id: uuidv4(),
          email,
          password: hashedPassword,
          role: role || 'employee',
          isActive: true,
          employeeId: employeeId || undefined,
          firstName,
          lastName,
          department,
          designation,
        });

        await user.save();

        results.success.push({
          email,
          employeeId,
          role,
        });
      } catch (error: any) {
        results.failed.push({
          row: emp,
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    // Log the action
    await AuditLog.create({
      userId,
      action: 'bulk_upload',
      module: 'users',
      entityType: 'User',
      description: `Bulk uploaded ${results.success.length} users, ${results.failed.length} failed`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        successCount: results.success.length,
        failedCount: results.failed.length,
      },
    });

    const statusCode = results.failed.length === 0 ? 201 : 200;
    const message = results.failed.length === 0 
      ? `Successfully uploaded ${results.success.length} users` 
      : `Bulk upload completed. ${results.success.length} users created, ${results.failed.length} failed`;

    return res.status(statusCode).json({
      success: true,
      message,
      data: results,
    });
  } catch (error: any) {
    next(error);
  }
};

export { upload };
