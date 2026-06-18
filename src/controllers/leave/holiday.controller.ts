import { Request, Response, NextFunction } from 'express';
import { Holiday } from '../../models/holiday.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class HolidayController {
  getAllHolidays = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { year, type } = req.query;
      
      const filter: any = {};
      if (year) filter.year = Number(year);
      if (type) filter.type = type;

      const holidays = await Holiday.find(filter).sort({ date: 1 });

      res.status(200).json({
        success: true,
        data: holidays,
        message: 'Holidays retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getHolidayById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const holiday = await Holiday.findById(id);

      if (!holiday) {
        throw new AppError('Holiday not found', 404, 'HOLIDAY_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: holiday,
        message: 'Holiday retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createHoliday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { name, date, type, year } = req.body;

      const holiday = await Holiday.create({
        name,
        date: new Date(date),
        type,
        year: year || new Date(date).getFullYear(),
      });

      res.status(201).json({
        success: true,
        data: holiday,
        message: 'Holiday created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateHoliday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { name, date, type, year } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (date) {
        updateData.date = new Date(date);
        updateData.year = year || new Date(date).getFullYear();
      }
      if (type) updateData.type = type;
      if (year) updateData.year = year;

      const holiday = await Holiday.findByIdAndUpdate(id, updateData, { new: true });

      if (!holiday) {
        throw new AppError('Holiday not found', 404, 'HOLIDAY_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: holiday,
        message: 'Holiday updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteHoliday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const holiday = await Holiday.findByIdAndDelete(id);

      if (!holiday) {
        throw new AppError('Holiday not found', 404, 'HOLIDAY_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: holiday,
        message: 'Holiday deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
