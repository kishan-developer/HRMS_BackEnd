import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/error.middleware';
import NewJoining from '../../models/newjoining.model';

export const submitNewJoining = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      formId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      postalCode,
      country,
      department,
      designation,
      joiningDate,
      employeeType,
      salary,
      bankName,
      accountNumber,
      ifscCode,
      education,
      previousExperience,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      bloodGroup,
      medicalConditions,
      allergies,
      maritalStatus,
      spouseName,
      spousePhone,
      spouseOccupation,
      children,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'address', 'city', 'state', 'postalCode', 'country',
      'department', 'designation', 'joiningDate', 'employeeType',
      'bankName', 'accountNumber', 'ifscCode',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw new AppError(`Missing required field: ${field}`, 400, 'MISSING_FIELD');
      }
    }

    // Create new joining submission
    const newJoining = await NewJoining.create({
      formId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      postalCode,
      country,
      department,
      designation,
      joiningDate,
      employeeType,
      salary,
      bankName,
      accountNumber,
      ifscCode,
      education,
      previousExperience,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      bloodGroup,
      medicalConditions,
      allergies,
      maritalStatus,
      spouseName,
      spousePhone,
      spouseOccupation,
      children,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      status: 'pending',
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Employee data submitted successfully',
      data: {
        id: newJoining._id,
        formId: newJoining.formId,
        status: newJoining.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNewJoiningSubmissions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await NewJoining.find().sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

export const getNewJoiningById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const submission = await NewJoining.findById(id);

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

export const updateNewJoiningStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const submission = await NewJoining.findByIdAndUpdate(
      id,
      { status, reviewedAt: new Date() },
      { new: true }
    );

    if (!submission) {
      throw new AppError('Submission not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};
