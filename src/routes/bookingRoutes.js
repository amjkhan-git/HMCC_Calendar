const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');
const { requireAdmin, optionalAdmin } = require('../middleware/adminAuth');
const {
  createBookingValidation,
  adminUpdateBookingValidation,
  paymentStatusValidation,
  dateParamValidation,
  idParamValidation,
  searchValidation,
  loginValidation,
  approvalValidation
} = require('../middleware/validators');
const config = require('../config');

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/v1/calendar
 * @desc    Get all Ramadan calendar dates with booking status
 * @access  Public
 */
router.get('/calendar', async (req, res, next) => {
  try {
    const dates = await bookingService.getAllDates();
    res.json({
      success: true,
      data: dates,
      meta: {
        total: dates.length,
        year: 2026,
        hijri_year: 1447,
        payment_link: config.paymentLink,
        zelle_info: config.zelleInfo,
        pricing: config.pricing
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/calendar/stats
 * @desc    Get calendar statistics
 * @access  Public
 */
router.get('/calendar/stats', async (req, res, next) => {
  try {
    const stats = await bookingService.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/pricing
 * @desc    Get pricing information
 * @access  Public
 */
router.get('/pricing', (req, res) => {
  res.json({
    success: true,
    data: {
      payment_link: config.paymentLink,
      zelle_info: config.zelleInfo,
      pricing: config.pricing,
      guest_capacity: {
        weekday: config.weekdayGuests,
        weekend: config.weekendGuests
      }
    }
  });
});

/**
 * @route   GET /api/v1/bookings
 * @desc    Get all bookings (only booked dates)
 * @access  Public
 */
router.get('/bookings', searchValidation, async (req, res, next) => {
  try {
    let dates;
    
    if (req.query.q) {
      dates = await bookingService.searchBookings(req.query.q);
    } else {
      const allDates = await bookingService.getAllDates();
      dates = allDates.filter(d => ['booked', 'pending_approval'].includes(d.booking_status));
    }

    // Remove sensitive info for public view
    const publicDates = dates.map(d => ({
      id: d.id,
      date: d.date,
      hijri_date: d.hijri_date,
      hijri_day: d.hijri_day,
      day_of_week: d.day_of_week,
      sponsor_name: d.sponsor_name,
      sponsor_organization: d.sponsor_organization,
      food_vendor_name: d.food_vendor_name,
      expected_guests: d.expected_guests,
      booking_status: d.booking_status,
      approval_status: d.approval_status,
      payment_status: d.payment_status,
      is_special_night: d.is_special_night,
      special_night_info: d.special_night_info,
      pricing_tier: d.pricing_tier,
      total_amount: d.total_amount
    }));

    res.json({
      success: true,
      data: publicDates,
      meta: {
        total: publicDates.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking by ID
 * @access  Public (limited info) / Admin (full info)
 */
router.get('/bookings/:id', idParamValidation, optionalAdmin, async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Full info for admin, limited for public
    const response = {
      id: booking.id,
      date: booking.date,
      hijri_date: booking.hijri_date,
      hijri_day: booking.hijri_day,
      day_of_week: booking.day_of_week,
      sponsor_name: booking.sponsor_name,
      sponsor_organization: booking.sponsor_organization,
      food_vendor_name: booking.food_vendor_name,
      expected_guests: booking.expected_guests,
      booking_status: booking.booking_status,
      approval_status: booking.approval_status,
      payment_status: booking.payment_status,
      is_special_night: booking.is_special_night,
      special_night_info: booking.special_night_info,
      pricing_tier: booking.pricing_tier,
      food_amount: booking.food_amount,
      cleaning_amount: booking.cleaning_amount,
      total_amount: booking.total_amount,
      pricing_description: booking.pricing_description,
      created_at: booking.created_at,
      updated_at: booking.updated_at
    };

    // Include full info for admin
    if (req.admin) {
      response.sponsor_email = booking.sponsor_email;
      response.sponsor_phone = booking.sponsor_phone;
      response.food_vendor_contact_name = booking.food_vendor_contact_name;
      response.food_vendor_phone = booking.food_vendor_phone;
      response.special_notes = booking.special_notes;
      response.payment_method = booking.payment_method;
      response.check_number = booking.check_number;
      response.mohid_reference = booking.mohid_reference;
      response.amount_paid = booking.amount_paid;
      response.balance = booking.balance;
      response.admin_comment = booking.admin_comment;
      response.approved_by = booking.approved_by;
      response.approved_at = booking.approved_at;
    }

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/bookings/date/:date
 * @desc    Get booking by date
 * @access  Public
 */
router.get('/bookings/date/:date', dateParamValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingByDate(req.params.date);
    
    if (!booking) {
      throw new AppError('Date not found in calendar', 404);
    }

    res.json({
      success: true,
      data: {
        id: booking.id,
        date: booking.date,
        hijri_date: booking.hijri_date,
        hijri_day: booking.hijri_day,
        day_of_week: booking.day_of_week,
        sponsor_name: booking.sponsor_name,
        sponsor_organization: booking.sponsor_organization,
        food_vendor_name: booking.food_vendor_name,
        expected_guests: booking.expected_guests,
        booking_status: booking.booking_status,
        approval_status: booking.approval_status,
        payment_status: booking.payment_status,
        is_special_night: booking.is_special_night,
        special_night_info: booking.special_night_info,
        pricing_tier: booking.pricing_tier,
        food_amount: booking.food_amount,
        cleaning_amount: booking.cleaning_amount,
        total_amount: booking.total_amount,
        pricing_description: booking.pricing_description
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/bookings/date/:date
 * @desc    Create a new booking (sponsor a date) - Creates as pending approval
 * @access  Public
 */
router.post('/bookings/date/:date', dateParamValidation, createBookingValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.params.date, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully. Your sponsorship is pending approval by HMCC admin.',
      data: {
        id: booking.id,
        date: booking.date,
        hijri_date: booking.hijri_date,
        sponsor_name: booking.sponsor_name,
        booking_status: booking.booking_status,
        approval_status: booking.approval_status,
        total_amount: booking.total_amount,
        pricing_description: booking.pricing_description,
        payment_link: config.paymentLink,
        zelle_info: config.zelleInfo
      }
    });
  } catch (error) {
    if (error.message.includes('already booked') || error.message.includes('blocked') || error.message.includes('pending')) {
      error.statusCode = 409;
    }
    next(error);
  }
});

// ==================== ADMIN AUTH ROUTES ====================

/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/admin/login', loginValidation, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!authService.authenticate(username, password)) {
      throw new AppError('Invalid username or password', 401);
    }

    const token = authService.generateToken(username);
    await authService.createSession(username, token);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        username,
        expires_in: config.jwtExpiresIn
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/admin/logout
 * @desc    Admin logout
 * @access  Admin
 */
router.post('/admin/logout', requireAdmin, async (req, res, next) => {
  try {
    const token = req.headers.authorization.substring(7);
    await authService.invalidateSession(token);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/me
 * @desc    Get current admin info
 * @access  Admin
 */
router.get('/admin/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: req.admin
  });
});

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/v1/admin/pending
 * @desc    Get all pending approvals
 * @access  Admin
 */
router.get('/admin/pending', requireAdmin, async (req, res, next) => {
  try {
    const pending = await bookingService.getPendingApprovals();
    res.json({
      success: true,
      data: pending,
      meta: {
        total: pending.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/admin/bookings/:id/approve
 * @desc    Approve a booking
 * @access  Admin
 */
router.post('/admin/bookings/:id/approve', requireAdmin, idParamValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.approveBooking(req.params.id, req.admin.username);
    
    res.json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/admin/bookings/:id/reject
 * @desc    Reject a booking
 * @access  Admin
 */
router.post('/admin/bookings/:id/reject', requireAdmin, idParamValidation, approvalValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.rejectBooking(
      req.params.id, 
      req.admin.username,
      req.body.rejection_reason
    );
    
    res.json({
      success: true,
      message: 'Booking rejected and date is now available',
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/admin/bookings/:id
 * @desc    Admin update a booking
 * @access  Admin
 */
router.put('/admin/bookings/:id', requireAdmin, idParamValidation, adminUpdateBookingValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.adminUpdateBooking(
      req.params.id,
      req.body,
      req.admin.username
    );
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/admin/bookings/:id/payment
 * @desc    Update payment status
 * @access  Admin
 */
router.patch('/admin/bookings/:id/payment', requireAdmin, idParamValidation, paymentStatusValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.updatePaymentStatus(
      req.params.id,
      req.body,
      req.admin.username
    );
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        id: booking.id,
        date: booking.date,
        payment_status: booking.payment_status,
        amount_paid: booking.amount_paid,
        balance: booking.balance,
        payment_date: booking.payment_date
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/admin/bookings/:id
 * @desc    Cancel a booking (reset to available)
 * @access  Admin
 */
router.delete('/admin/bookings/:id', requireAdmin, idParamValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.admin.username);
    
    res.json({
      success: true,
      message: 'Booking cancelled and date is now available',
      data: {
        id: booking.id,
        date: booking.date,
        booking_status: booking.booking_status
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/admin/dates/:id/block
 * @desc    Block/Unblock a date
 * @access  Admin
 */
router.patch('/admin/dates/:id/block', requireAdmin, idParamValidation, async (req, res, next) => {
  try {
    const blocked = req.body.blocked === true;
    const booking = await bookingService.setDateBlockStatus(req.params.id, blocked, req.admin.username);
    
    res.json({
      success: true,
      message: `Date ${blocked ? 'blocked' : 'unblocked'} successfully`,
      data: {
        id: booking.id,
        date: booking.date,
        booking_status: booking.booking_status
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/bookings/:id/audit
 * @desc    Get audit log for a booking
 * @access  Admin
 */
router.get('/admin/bookings/:id/audit', requireAdmin, idParamValidation, async (req, res, next) => {
  try {
    const logs = await bookingService.getAuditLog(req.params.id);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

// ==================== EXPORT ROUTES ====================

/**
 * @route   GET /api/v1/admin/export/json
 * @desc    Export all bookings as JSON
 * @access  Admin
 */
router.get('/admin/export/json', requireAdmin, async (req, res, next) => {
  try {
    const bookings = await bookingService.getAllBookingsForExport();
    
    res.json({
      success: true,
      data: bookings,
      meta: {
        exported_at: new Date().toISOString(),
        exported_by: req.admin.username,
        total: bookings.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/export/csv
 * @desc    Export all bookings as CSV
 * @access  Admin
 */
router.get('/admin/export/csv', requireAdmin, async (req, res, next) => {
  try {
    const bookings = await bookingService.getAllBookingsForExport();
    
    // CSV headers matching the requirement
    const headers = [
      'Calendar Date',
      'Ramadan Date',
      'Day of Week',
      'Sponsor Names',
      'Contact Number',
      'Contact Email',
      'Organization',
      'Food Amount',
      'Cleaning Amount',
      'Total Cost',
      'Paid (Y/N/P)',
      'Amount Paid',
      'Balance',
      'Food Vendor Name',
      'Food Vendor Contact Name',
      'Food Vendor Number',
      'Method of Payment',
      'Check Number',
      'Reference',
      'Comment',
      'Booking Status',
      'Approval Status'
    ];

    // Convert payment status to Y/N/P
    const paymentStatusMap = {
      'completed': 'Y',
      'pending': 'N',
      'partial': 'P',
      'cancelled': 'N',
      'refunded': 'N'
    };

    // Convert payment method
    const paymentMethodMap = {
      'check': 'Ch',
      'credit_card': 'CC',
      'cash': 'Cash',
      'zelle': 'Zelle',
      'paypal': 'PayPal'
    };

    const rows = bookings.map(b => [
      b.date,
      b.hijri_date,
      b.day_of_week,
      b.sponsor_name || '',
      b.sponsor_phone || '',
      b.sponsor_email || '',
      b.sponsor_organization || '',
      b.food_amount || '',
      b.cleaning_amount || '',
      b.total_amount || '',
      paymentStatusMap[b.payment_status] || 'N',
      b.amount_paid || 0,
      b.balance || '',
      b.food_vendor_name || '',
      b.food_vendor_contact_name || '',
      b.food_vendor_phone || '',
      paymentMethodMap[b.payment_method] || '',
      b.check_number || '',
      b.mohid_reference || '',
      b.admin_comment || b.special_notes || '',
      b.booking_status || '',
      b.approval_status || ''
    ]);

    // Build CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=hmcc-ramadan-bookings-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/export/excel
 * @desc    Export all bookings as Excel
 * @access  Admin
 */
router.get('/admin/export/excel', requireAdmin, async (req, res, next) => {
  try {
    const ExcelJS = require('exceljs');
    const bookings = await bookingService.getAllBookingsForExport();
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HMCC Ramadan Calendar';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Ramadan 2026 Sponsorships');

    // Define columns
    worksheet.columns = [
      { header: 'Calendar Date', key: 'date', width: 15 },
      { header: 'Ramadan Date', key: 'hijri_date', width: 18 },
      { header: 'Day of Week', key: 'day_of_week', width: 12 },
      { header: 'Sponsor Names', key: 'sponsor_name', width: 25 },
      { header: 'Contact Number', key: 'sponsor_phone', width: 18 },
      { header: 'Contact Email', key: 'sponsor_email', width: 25 },
      { header: 'Organization', key: 'sponsor_organization', width: 20 },
      { header: 'Food Amount', key: 'food_amount', width: 12 },
      { header: 'Cleaning Amount', key: 'cleaning_amount', width: 15 },
      { header: 'Total Cost', key: 'total_amount', width: 12 },
      { header: 'Paid (Y/N/P)', key: 'paid_status', width: 12 },
      { header: 'Amount Paid', key: 'amount_paid', width: 12 },
      { header: 'Balance', key: 'balance', width: 12 },
      { header: 'Food Vendor Name', key: 'food_vendor_name', width: 20 },
      { header: 'Food Vendor Contact Name', key: 'food_vendor_contact_name', width: 22 },
      { header: 'Food Vendor Number', key: 'food_vendor_phone', width: 18 },
      { header: 'Method of Payment', key: 'payment_method', width: 18 },
      { header: 'Check Number', key: 'check_number', width: 15 },
      { header: 'Reference', key: 'mohid_reference', width: 18 },
      { header: 'Comment', key: 'comment', width: 30 },
      { header: 'Booking Status', key: 'booking_status', width: 15 },
      { header: 'Approval Status', key: 'approval_status', width: 15 }
    ];

    // Style header row - HMCC Blue/Teal color
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0d6efd' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Convert payment status to Y/N/P
    const paymentStatusMap = {
      'completed': 'Y',
      'pending': 'N',
      'partial': 'P',
      'cancelled': 'N',
      'refunded': 'N'
    };

    // Convert payment method
    const paymentMethodMap = {
      'check': 'Ch',
      'credit_card': 'CC',
      'cash': 'Cash',
      'zelle': 'Zelle',
      'paypal': 'PayPal'
    };

    // Add data rows
    bookings.forEach(b => {
      worksheet.addRow({
        date: b.date,
        hijri_date: b.hijri_date,
        day_of_week: b.day_of_week,
        sponsor_name: b.sponsor_name || '',
        sponsor_phone: b.sponsor_phone || '',
        sponsor_email: b.sponsor_email || '',
        sponsor_organization: b.sponsor_organization || '',
        food_amount: b.food_amount || '',
        cleaning_amount: b.cleaning_amount || '',
        total_amount: b.total_amount || '',
        paid_status: paymentStatusMap[b.payment_status] || 'N',
        amount_paid: b.amount_paid || 0,
        balance: b.balance || '',
        food_vendor_name: b.food_vendor_name || '',
        food_vendor_contact_name: b.food_vendor_contact_name || '',
        food_vendor_phone: b.food_vendor_phone || '',
        payment_method: paymentMethodMap[b.payment_method] || '',
        check_number: b.check_number || '',
        mohid_reference: b.mohid_reference || '',
        comment: b.admin_comment || b.special_notes || '',
        booking_status: b.booking_status || '',
        approval_status: b.approval_status || ''
      });
    });

    // Format currency columns
    ['food_amount', 'cleaning_amount', 'total_amount', 'amount_paid', 'balance'].forEach(col => {
      worksheet.getColumn(col).numFmt = '$#,##0.00';
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=hmcc-ramadan-bookings-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/export/pdf
 * @desc    Export all bookings as PDF
 * @access  Admin
 */
router.get('/admin/export/pdf', requireAdmin, async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const bookings = await bookingService.getAllBookingsForExport();
    
    const doc = new PDFDocument({ 
      layout: 'landscape',
      size: 'A4',
      margin: 30
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=hmcc-ramadan-bookings-${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text('HMCC Ramadan Iftar Sponsorship Report 2026', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Summary
    const stats = await bookingService.getStatistics();
    doc.fontSize(12).font('Helvetica-Bold').text('Summary:');
    doc.fontSize(10).font('Helvetica')
      .text(`Total Dates: ${stats.total_dates} | Booked: ${stats.booked_dates} | Available: ${stats.available_dates} | Pending: ${stats.pending_dates}`)
      .text(`Total Expected: $${stats.total_expected?.toLocaleString() || 0} | Total Collected: $${stats.total_collected?.toLocaleString() || 0}`);
    doc.moveDown();

    // Table header
    const startX = 30;
    let y = doc.y;
    const rowHeight = 20;
    
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Date', startX, y, { width: 60 });
    doc.text('Hijri', startX + 60, y, { width: 80 });
    doc.text('Sponsor', startX + 140, y, { width: 100 });
    doc.text('Phone', startX + 240, y, { width: 80 });
    doc.text('Total', startX + 320, y, { width: 50 });
    doc.text('Paid', startX + 370, y, { width: 30 });
    doc.text('Vendor', startX + 400, y, { width: 100 });
    doc.text('Status', startX + 500, y, { width: 60 });

    y += rowHeight;
    doc.moveTo(startX, y - 5).lineTo(startX + 560, y - 5).stroke();

    // Data rows
    doc.fontSize(7).font('Helvetica');
    
    const paymentStatusMap = { 'completed': 'Y', 'pending': 'N', 'partial': 'P' };

    for (const b of bookings) {
      if (y > 550) {
        doc.addPage();
        y = 50;
      }

      doc.text(b.date || '', startX, y, { width: 60 });
      doc.text(b.hijri_date || '', startX + 60, y, { width: 80 });
      doc.text((b.sponsor_name || '').substring(0, 20), startX + 140, y, { width: 100 });
      doc.text(b.sponsor_phone || '', startX + 240, y, { width: 80 });
      doc.text(`$${b.total_amount || 0}`, startX + 320, y, { width: 50 });
      doc.text(paymentStatusMap[b.payment_status] || 'N', startX + 370, y, { width: 30 });
      doc.text((b.food_vendor_name || '').substring(0, 20), startX + 400, y, { width: 100 });
      doc.text(b.booking_status || '', startX + 500, y, { width: 60 });

      y += rowHeight;
    }

    doc.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
