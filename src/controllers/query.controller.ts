import { Request, Response, NextFunction } from 'express';
import { Query } from '../models/query.model';
import { generateId } from '../utils/uuid.utils';

// Create a new query/lead
export const createQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientName, email, phone, message, propertyInterest, source } = req.body;

    // Validate required fields
    if (!clientName || !email || !phone || !message || !propertyInterest || !source) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: clientName, email, phone, message, propertyInterest, source',
        },
      });
      return;
    }

    // Generate unique query ID
    const queryId = `QRY-${generateId().substring(0, 8).toUpperCase()}`;

    // Create new query
    const query = await Query.create({
      queryId,
      clientName,
      email,
      phone,
      message,
      propertyInterest,
      source,
      status: 'New',
    });

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      data: {
        queryId: query.queryId,
        clientName: query.clientName,
        email: query.email,
        phone: query.phone,
        message: query.message,
        propertyInterest: query.propertyInterest,
        source: query.source,
        status: query.status,
        createdAt: query.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all queries (admin only)
export const getAllQueries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const queries = await Query.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Query.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: queries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get query by ID
export const getQueryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = await Query.findOne({ queryId: id });

    if (!query) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Query not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: query,
    });
  } catch (error) {
    next(error);
  }
};

// Update query status
export const updateQueryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const query = await Query.findOneAndUpdate(
      { queryId: id },
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!query) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Query not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Query updated successfully',
      data: query,
    });
  } catch (error) {
    next(error);
  }
};

// Delete query
export const deleteQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = await Query.findOneAndDelete({ queryId: id });

    if (!query) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Query not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
