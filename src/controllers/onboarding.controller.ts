import { Request, Response, NextFunction } from 'express';
import { JoiningForm } from '../models/joining-form.model';
import { EmployeeDraft } from '../models/employee-draft.model';
import { AppError } from '../middleware/error.middleware';

// Generate unique token
const generateToken = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Generate reference ID like EMP-2026-00125
const generateReferenceId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${year}-${random}`;
};

// Create joining link
export const createJoiningLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeName, email, departmentId, joiningDate } = req.body;
    const createdBy = (req as any).user?.userId;

    if (!createdBy) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Generate unique token
    let token = '';
    let tokenExists = true;
    let attempts = 0;

    while (tokenExists && attempts < 10) {
      token = generateToken();
      const existing = await JoiningForm.findOne({ token });
      if (!existing) {
        tokenExists = false;
      }
      attempts++;
    }

    if (tokenExists) {
      throw new AppError('Failed to generate unique token', 500, 'TOKEN_GENERATION_FAILED');
    }

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const joiningForm = await JoiningForm.create({
      token,
      employeeName,
      email,
      departmentId,
      joiningDate: new Date(joiningDate),
      status: 'pending',
      expiresAt,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: 'Joining link generated successfully',
      data: {
        id: joiningForm._id,
        token: joiningForm.token,
        joiningUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/joining/${joiningForm.token}`,
        employeeName: joiningForm.employeeName,
        email: joiningForm.email,
        departmentId: joiningForm.departmentId,
        joiningDate: joiningForm.joiningDate,
        expiresAt: joiningForm.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all joining links
export const getJoiningLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, departmentId, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (departmentId) filter.departmentId = departmentId;

    const skip = (Number(page) - 1) * Number(limit);

    const joiningForms = await JoiningForm.find(filter)
      .populate('departmentId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await JoiningForm.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        joiningForms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get joining link by ID
export const getJoiningLinkById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const joiningForm = await JoiningForm.findById(id)
      .populate('departmentId', 'name')
      .populate('createdBy', 'name email');

    if (!joiningForm) {
      throw new AppError('Joining link not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: joiningForm,
    });
  } catch (error) {
    next(error);
  }
};

// Validate joining token (public route)
export const validateJoiningToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const joiningForm = await JoiningForm.findOne({ token })
      .populate('departmentId', 'name');

    if (!joiningForm) {
      throw new AppError('Invalid joining link', 404, 'INVALID_TOKEN');
    }

    if (joiningForm.status === 'submitted') {
      throw new AppError('This joining link has already been used', 400, 'ALREADY_SUBMITTED');
    }

    if (joiningForm.status === 'expired' || joiningForm.expiresAt < new Date()) {
      // Update status to expired if not already
      if (joiningForm.status !== 'expired') {
        await JoiningForm.findByIdAndUpdate(joiningForm._id, { status: 'expired' });
      }
      throw new AppError('This joining link has expired', 400, 'LINK_EXPIRED');
    }

    res.status(200).json({
      success: true,
      data: {
        token: joiningForm.token,
        employeeName: joiningForm.employeeName,
        email: joiningForm.email,
        department: joiningForm.departmentId,
        joiningDate: joiningForm.joiningDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Submit joining form (public route)
export const submitJoiningForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { employeeData, uploadedDocuments } = req.body;

    // Validate joining form
    const joiningForm = await JoiningForm.findOne({ token });
    if (!joiningForm) {
      throw new AppError('Invalid joining link', 404, 'INVALID_TOKEN');
    }

    if (joiningForm.status === 'submitted') {
      throw new AppError('This joining link has already been used', 400, 'ALREADY_SUBMITTED');
    }

    if (joiningForm.status === 'expired' || joiningForm.expiresAt < new Date()) {
      throw new AppError('This joining link has expired', 400, 'LINK_EXPIRED');
    }

    // Generate reference ID
    const referenceId = generateReferenceId();

    // Create employee draft
    await EmployeeDraft.create({
      joiningFormId: joiningForm._id,
      employeeData,
      uploadedDocuments: uploadedDocuments || {},
      status: 'submitted',
      referenceId,
    });

    // Update joining form status
    await JoiningForm.findByIdAndUpdate(joiningForm._id, {
      status: 'submitted',
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Joining form submitted successfully',
      data: {
        referenceId,
        joiningUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/joining/success?ref=${referenceId}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate joining link
export const deactivateJoiningLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const joiningForm = await JoiningForm.findByIdAndUpdate(
      id,
      { status: 'expired' },
      { new: true }
    );

    if (!joiningForm) {
      throw new AppError('Joining link not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      message: 'Joining link deactivated successfully',
      data: joiningForm,
    });
  } catch (error) {
    next(error);
  }
};

// Resend joining link email
export const resendJoiningLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const joiningForm = await JoiningForm.findById(id);

    if (!joiningForm) {
      throw new AppError('Joining link not found', 404, 'NOT_FOUND');
    }

    if (joiningForm.status === 'submitted') {
      throw new AppError('This joining link has already been used', 400, 'ALREADY_SUBMITTED');
    }

    if (joiningForm.status === 'expired') {
      throw new AppError('This joining link has expired', 400, 'LINK_EXPIRED');
    }

    // TODO: Send email with joining link
    const joiningUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/joining/${joiningForm.token}`;
    console.log('Resending joining link email to:', joiningForm.email, 'URL:', joiningUrl);

    res.status(200).json({
      success: true,
      message: 'Joining link email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get all submissions
export const getJoiningSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, departmentId, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (departmentId) filter['employeeData.departmentId'] = departmentId;

    const skip = (Number(page) - 1) * Number(limit);

    const submissions = await EmployeeDraft.find(filter)
      .populate('joiningFormId')
      .populate('employeeData.departmentId', 'name')
      .populate('employeeData.reportingManager', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await EmployeeDraft.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get submission by ID
export const getSubmissionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const submission = await EmployeeDraft.findById(id)
      .populate('joiningFormId')
      .populate('employeeData.departmentId', 'name')
      .populate('employeeData.reportingManager', 'name email');

    if (!submission) {
      throw new AppError('Submission not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};
