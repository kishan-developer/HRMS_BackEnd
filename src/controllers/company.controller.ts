import { Request, Response, NextFunction } from 'express';
import Company from '../models/company.model';
import { User } from '../models/user.model';
import AuditLog from '../models/audit-log.model';
import { v4 as uuidv4 } from 'uuid';

// Get all companies with filters
export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      subscriptionStatus,
      subscriptionPlan,
      search,
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (subscriptionStatus) query.subscriptionStatus = subscriptionStatus;
    if (subscriptionPlan) query.subscriptionPlan = subscriptionPlan;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [companies, total] = await Promise.all([
      Company.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Company.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        companies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Get company statistics
export const getCompanyStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalCompanies, activeCompanies, trialCompanies, expiredCompanies] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'active' }),
      Company.countDocuments({ subscriptionStatus: 'trial' }),
      Company.countDocuments({ subscriptionStatus: 'expired' }),
    ]);

    const subscriptionStats = await Company.aggregate([
      {
        $group: {
          _id: '$subscriptionPlan',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = await Company.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        trialCompanies,
        expiredCompanies,
        subscriptionStats,
        statusStats,
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Get company by ID
export const getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }

    // Get employee count for this company
    const employeeCount = await User.countDocuments({ companyId: id, role: 'employee' });

    return res.json({
      success: true,
      data: {
        ...company,
        employeeCount,
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Create new company
export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const userId = (req as any).user?.id;

    // Check if company code already exists
    const existingCode = await Company.findOne({ code: data.code });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COMPANY_CODE_EXISTS',
          message: 'Company code already exists',
        },
      });
    }

    // Check if email already exists
    const existingEmail = await Company.findOne({ email: data.email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COMPANY_EMAIL_EXISTS',
          message: 'Company email already exists',
        },
      });
    }

    const company = new Company({
      id: uuidv4(),
      ...data,
    });

    await company.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'create',
      module: 'companies',
      entityType: 'Company',
      entityId: company.id,
      description: `Created new company: ${company.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: company,
      message: 'Company created successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Update company
export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = (req as any).user?.id;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }

    // Check if email is being changed and if it already exists
    if (data.email && data.email !== company.email) {
      const existingEmail = await Company.findOne({ email: data.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'COMPANY_EMAIL_EXISTS',
            message: 'Company email already exists',
          },
        });
      }
    }

    Object.assign(company, data);
    await company.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'companies',
      entityType: 'Company',
      entityId: company.id,
      description: `Updated company: ${company.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { changes: data },
    });

    return res.json({
      success: true,
      data: company,
      message: 'Company updated successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Update company status
export const updateCompanyStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.id;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }

    company.status = status;
    await company.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'companies',
      entityType: 'Company',
      entityId: company.id,
      description: `Updated company status to ${status}: ${company.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: company,
      message: 'Company status updated successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Assign company admin
export const assignCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const userId = (req as any).user?.id;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }

    // Verify admin user exists
    const adminUser = await User.findOne({ employeeId: adminId });
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Admin user not found',
        },
      });
    }

    company.adminId = adminId;
    await company.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'companies',
      entityType: 'Company',
      entityId: company.id,
      description: `Assigned admin ${adminUser.firstName} ${adminUser.lastName} to company: ${company.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: company,
      message: 'Company admin assigned successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Delete company (soft delete)
export const deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }

    // Check if company has employees
    const employeeCount = await User.countDocuments({ companyId: id, role: 'employee' });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COMPANY_HAS_EMPLOYEES',
          message: 'Cannot delete company with active employees',
        },
      });
    }

    await Company.findByIdAndDelete(id);

    // Log the action
    await AuditLog.create({
      userId,
      action: 'delete',
      module: 'companies',
      entityType: 'Company',
      entityId: id,
      description: `Deleted company: ${company.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Get company settings
export const getCompanySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }

    return res.json({
      success: true,
      data: company.settings || {},
      message: 'Company settings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update company settings
export const updateCompanySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;
    const userId = (req as any).user?.id;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }

    company.settings = { ...company.settings, ...settings };
    await company.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'companies',
      entityType: 'Company',
      entityId: company.id,
      description: `Updated company settings: ${company.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { settings },
    });

    return res.json({
      success: true,
      data: company.settings,
      message: 'Company settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
