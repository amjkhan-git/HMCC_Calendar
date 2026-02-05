const { db } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { specialNights, getPricing, getExpectedGuests, isLastTenNights } = require('../database/ramadanDates');

class BookingService {
  /**
   * Get all calendar dates with booking information
   */
  async getAllDates() {
    const result = await db.execute(`
      SELECT 
        id, date, hijri_date, hijri_day, day_of_week,
        sponsor_name, sponsor_email, sponsor_phone, sponsor_organization,
        food_vendor_name, food_vendor_contact_name, food_vendor_phone,
        booking_status, payment_status, expected_guests,
        food_amount, cleaning_amount, total_amount, pricing_tier,
        payment_method, amount_paid, balance,
        approval_status, admin_comment,
        created_at, updated_at
      FROM bookings 
      ORDER BY date ASC
    `);
    
    // Enrich with special night info
    return result.rows.map(date => ({
      ...date,
      is_special_night: !!specialNights[date.date],
      special_night_info: specialNights[date.date] || null,
      is_last_ten_nights: isLastTenNights(date.date),
      pricing_description: this.getPricingDescription(date.pricing_tier)
    }));
  }

  /**
   * Get pricing description
   */
  getPricingDescription(tier) {
    if (!tier) return null;
    return config.pricing[tier]?.description || null;
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(id) {
    const result = await db.execute({
      sql: 'SELECT * FROM bookings WHERE id = ?',
      args: [id]
    });
    
    const booking = result.rows[0];
    if (booking) {
      booking.is_special_night = !!specialNights[booking.date];
      booking.special_night_info = specialNights[booking.date] || null;
      booking.is_last_ten_nights = isLastTenNights(booking.date);
      booking.pricing_description = this.getPricingDescription(booking.pricing_tier);
    }
    return booking;
  }

  /**
   * Get a booking by date
   */
  async getBookingByDate(date) {
    const result = await db.execute({
      sql: 'SELECT * FROM bookings WHERE date = ?',
      args: [date]
    });
    
    const booking = result.rows[0];
    if (booking) {
      booking.is_special_night = !!specialNights[booking.date];
      booking.special_night_info = specialNights[booking.date] || null;
      booking.is_last_ten_nights = isLastTenNights(booking.date);
      booking.pricing_description = this.getPricingDescription(booking.pricing_tier);
    }
    return booking;
  }

  /**
   * Create a booking (sponsor a date) - Now creates with pending_approval status
   */
  async createBooking(date, bookingData) {
    const existingBooking = await this.getBookingByDate(date);
    
    if (!existingBooking) {
      throw new Error('Date not found in Ramadan calendar');
    }
    
    if (existingBooking.booking_status === 'blocked') {
      throw new Error('This date is blocked and cannot be booked');
    }
    
    if (existingBooking.booking_status === 'hmcc_sponsored') {
      throw new Error('This date is sponsored by HMCC and cannot be booked');
    }
    
    if (existingBooking.booking_status === 'booked' || existingBooking.booking_status === 'pending_approval') {
      throw new Error('This date is already booked or pending approval');
    }

    // Get pricing based on date
    const pricing = getPricing(existingBooking.date, existingBooking.day_of_week);
    const expectedGuests = getExpectedGuests(existingBooking.day_of_week);

    await db.execute({
      sql: `UPDATE bookings SET
        sponsor_name = ?,
        sponsor_email = ?,
        sponsor_phone = ?,
        sponsor_organization = ?,
        food_vendor_name = ?,
        food_vendor_contact_name = ?,
        food_vendor_phone = ?,
        expected_guests = ?,
        special_notes = ?,
        food_amount = ?,
        cleaning_amount = ?,
        total_amount = ?,
        pricing_tier = ?,
        payment_method = ?,
        booking_status = 'pending_approval',
        approval_status = 'pending',
        updated_at = datetime('now')
      WHERE date = ?`,
      args: [
        bookingData.sponsor_name,
        bookingData.sponsor_email || null,
        bookingData.sponsor_phone || null,
        bookingData.sponsor_organization || null,
        bookingData.food_vendor_name || null,
        bookingData.food_vendor_contact_name || null,
        bookingData.food_vendor_phone || null,
        bookingData.expected_guests || expectedGuests,
        bookingData.special_notes || null,
        pricing.food_amount,
        pricing.cleaning_amount,
        pricing.total,
        pricing.tier,
        bookingData.payment_method || null,
        date
      ]
    });

    // Log the action
    await this.logAudit(existingBooking.id, 'BOOKING_CREATED', null, bookingData);

    return await this.getBookingByDate(date);
  }

  /**
   * Admin: Approve a booking
   */
  async approveBooking(id, adminUsername) {
    const existingBooking = await this.getBookingById(id);
    
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    if (existingBooking.approval_status !== 'pending') {
      throw new Error('Booking is not pending approval');
    }

    await db.execute({
      sql: `UPDATE bookings SET
        booking_status = 'booked',
        approval_status = 'approved',
        approved_by = ?,
        approved_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?`,
      args: [adminUsername, id]
    });

    // Log the action
    await this.logAudit(id, 'BOOKING_APPROVED', existingBooking, { approved_by: adminUsername }, adminUsername);

    return await this.getBookingById(id);
  }

  /**
   * Admin: Reject a booking (reset to available)
   */
  async rejectBooking(id, adminUsername, rejectionReason) {
    const existingBooking = await this.getBookingById(id);
    
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    // Store sponsor info for notification before resetting
    const sponsorEmail = existingBooking.sponsor_email;
    const sponsorName = existingBooking.sponsor_name;

    await db.execute({
      sql: `UPDATE bookings SET
        sponsor_name = NULL,
        sponsor_email = NULL,
        sponsor_phone = NULL,
        sponsor_organization = NULL,
        food_vendor_name = NULL,
        food_vendor_contact_name = NULL,
        food_vendor_phone = NULL,
        special_notes = NULL,
        payment_method = NULL,
        check_number = NULL,
        mohid_reference = NULL,
        amount_paid = 0,
        balance = 0,
        payment_status = 'pending',
        payment_date = NULL,
        booking_status = 'available',
        approval_status = 'rejected',
        rejection_reason = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      args: [rejectionReason || 'Booking rejected by admin', id]
    });

    // Log the action with sponsor info
    await this.logAudit(id, 'BOOKING_REJECTED', existingBooking, { 
      rejected_by: adminUsername,
      rejection_reason: rejectionReason,
      sponsor_email: sponsorEmail,
      sponsor_name: sponsorName
    }, adminUsername);

    return await this.getBookingById(id);
  }

  /**
   * Admin: Update booking details
   */
  async adminUpdateBooking(id, bookingData, adminUsername) {
    const existingBooking = await this.getBookingById(id);
    
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const updates = [];
    const values = [];

    const allowedFields = [
      'sponsor_name', 'sponsor_email', 'sponsor_phone', 'sponsor_organization',
      'food_vendor_name', 'food_vendor_contact_name', 'food_vendor_phone',
      'expected_guests', 'special_notes', 'food_amount', 'cleaning_amount',
      'payment_method', 'check_number', 'mohid_reference', 'amount_paid',
      'payment_status', 'admin_comment'
    ];

    for (const field of allowedFields) {
      if (bookingData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(bookingData[field]);
      }
    }

    // Recalculate total and balance if amounts changed
    if (bookingData.food_amount !== undefined || bookingData.cleaning_amount !== undefined) {
      const foodAmt = bookingData.food_amount !== undefined ? bookingData.food_amount : existingBooking.food_amount;
      const cleaningAmt = bookingData.cleaning_amount !== undefined ? bookingData.cleaning_amount : existingBooking.cleaning_amount;
      const total = foodAmt + cleaningAmt;
      updates.push('total_amount = ?');
      values.push(total);
    }

    // Recalculate balance
    if (bookingData.amount_paid !== undefined) {
      const total = existingBooking.total_amount;
      const paid = bookingData.amount_paid;
      updates.push('balance = ?');
      values.push(total - paid);
    }

    if (updates.length === 0) {
      return existingBooking;
    }

    values.push(id);

    await db.execute({
      sql: `UPDATE bookings SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
      args: values
    });

    // Log the action
    await this.logAudit(id, 'BOOKING_UPDATED_BY_ADMIN', existingBooking, bookingData, adminUsername);

    return await this.getBookingById(id);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id, paymentData, adminUsername) {
    const existingBooking = await this.getBookingById(id);
    
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const validStatuses = ['pending', 'partial', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(paymentData.payment_status)) {
      throw new Error('Invalid payment status');
    }

    const updates = ['payment_status = ?'];
    const values = [paymentData.payment_status];

    if (paymentData.amount_paid !== undefined) {
      updates.push('amount_paid = ?');
      values.push(paymentData.amount_paid);
      
      // Calculate balance
      const balance = existingBooking.total_amount - paymentData.amount_paid;
      updates.push('balance = ?');
      values.push(balance);
    }

    if (paymentData.payment_method) {
      updates.push('payment_method = ?');
      values.push(paymentData.payment_method);
    }

    if (paymentData.check_number) {
      updates.push('check_number = ?');
      values.push(paymentData.check_number);
    }

    if (paymentData.mohid_reference) {
      updates.push('mohid_reference = ?');
      values.push(paymentData.mohid_reference);
    }

    // Set payment date if completed
    if (paymentData.payment_status === 'completed') {
      updates.push("payment_date = datetime('now')");
    }

    values.push(id);

    await db.execute({
      sql: `UPDATE bookings SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
      args: values
    });

    // Log the action
    await this.logAudit(id, 'PAYMENT_STATUS_UPDATED', 
      { payment_status: existingBooking.payment_status }, 
      paymentData,
      adminUsername
    );

    return await this.getBookingById(id);
  }

  /**
   * Admin: Cancel a booking (reset to available)
   */
  async cancelBooking(id, adminUsername) {
    const existingBooking = await this.getBookingById(id);
    
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    await db.execute({
      sql: `UPDATE bookings SET
        sponsor_name = NULL,
        sponsor_email = NULL,
        sponsor_phone = NULL,
        sponsor_organization = NULL,
        food_vendor_name = NULL,
        food_vendor_contact_name = NULL,
        food_vendor_phone = NULL,
        special_notes = NULL,
        payment_method = NULL,
        check_number = NULL,
        mohid_reference = NULL,
        amount_paid = 0,
        balance = 0,
        payment_status = 'pending',
        payment_date = NULL,
        booking_status = 'available',
        approval_status = NULL,
        approved_by = NULL,
        approved_at = NULL,
        rejection_reason = NULL,
        admin_comment = NULL,
        updated_at = datetime('now')
      WHERE id = ?`,
      args: [id]
    });

    // Log the action
    await this.logAudit(id, 'BOOKING_CANCELLED', existingBooking, null, adminUsername);

    return await this.getBookingById(id);
  }

  /**
   * Block/Unblock a date (admin function)
   */
  async setDateBlockStatus(id, blocked, adminUsername) {
    const existingBooking = await this.getBookingById(id);
    
    if (!existingBooking) {
      throw new Error('Date not found');
    }

    if (existingBooking.booking_status === 'booked' && blocked) {
      throw new Error('Cannot block a date that is already booked');
    }

    if (existingBooking.booking_status === 'hmcc_sponsored') {
      throw new Error('Cannot modify HMCC sponsored date');
    }

    const newStatus = blocked ? 'blocked' : 'available';

    await db.execute({
      sql: "UPDATE bookings SET booking_status = ?, updated_at = datetime('now') WHERE id = ?",
      args: [newStatus, id]
    });

    // Log the action
    await this.logAudit(id, blocked ? 'DATE_BLOCKED' : 'DATE_UNBLOCKED', 
      { booking_status: existingBooking.booking_status }, 
      { booking_status: newStatus },
      adminUsername
    );

    return await this.getBookingById(id);
  }

  /**
   * Get calendar statistics
   */
  async getStatistics() {
    const result = await db.execute(`
      SELECT 
        COUNT(*) as total_dates,
        SUM(CASE WHEN booking_status = 'available' THEN 1 ELSE 0 END) as available_dates,
        SUM(CASE WHEN booking_status = 'booked' THEN 1 ELSE 0 END) as booked_dates,
        SUM(CASE WHEN booking_status = 'pending_approval' THEN 1 ELSE 0 END) as pending_dates,
        SUM(CASE WHEN booking_status = 'blocked' THEN 1 ELSE 0 END) as blocked_dates,
        SUM(CASE WHEN booking_status = 'hmcc_sponsored' THEN 1 ELSE 0 END) as hmcc_sponsored_dates,
        SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as payments_completed,
        SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) as payments_partial,
        SUM(CASE WHEN payment_status = 'pending' AND booking_status = 'booked' THEN 1 ELSE 0 END) as payments_pending,
        SUM(CASE WHEN booking_status IN ('booked', 'pending_approval') THEN total_amount ELSE 0 END) as total_expected,
        SUM(CASE WHEN booking_status IN ('booked', 'pending_approval') THEN amount_paid ELSE 0 END) as total_collected
      FROM bookings
    `);

    return result.rows[0];
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    const result = await db.execute(`
      SELECT * FROM bookings 
      WHERE approval_status = 'pending' 
      ORDER BY date ASC
    `);
    return result.rows;
  }

  /**
   * Search bookings
   */
  async searchBookings(query) {
    const searchTerm = `%${query}%`;
    const result = await db.execute({
      sql: `SELECT * FROM bookings 
        WHERE sponsor_name LIKE ? 
          OR sponsor_email LIKE ? 
          OR sponsor_phone LIKE ?
          OR food_vendor_name LIKE ?
        ORDER BY date ASC`,
      args: [searchTerm, searchTerm, searchTerm, searchTerm]
    });

    return result.rows;
  }

  /**
   * Get all bookings for export
   */
  async getAllBookingsForExport() {
    const result = await db.execute(`
      SELECT 
        date, hijri_date, hijri_day, day_of_week,
        sponsor_name, sponsor_phone, sponsor_email, sponsor_organization,
        food_amount, cleaning_amount, total_amount,
        payment_status, amount_paid, balance,
        food_vendor_name, food_vendor_contact_name, food_vendor_phone,
        payment_method, check_number, mohid_reference,
        special_notes, admin_comment, booking_status, approval_status
      FROM bookings 
      ORDER BY date ASC
    `);
    return result.rows;
  }

  /**
   * Log audit entry
   */
  async logAudit(bookingId, action, oldValues, newValues, performedBy = null, ipAddress = null, userAgent = null) {
    await db.execute({
      sql: `INSERT INTO audit_log (booking_id, action, old_values, new_values, performed_by, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        bookingId,
        action,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        performedBy,
        ipAddress,
        userAgent
      ]
    });
  }

  /**
   * Get audit log for a booking
   */
  async getAuditLog(bookingId) {
    const result = await db.execute({
      sql: 'SELECT * FROM audit_log WHERE booking_id = ? ORDER BY created_at DESC',
      args: [bookingId]
    });
    return result.rows;
  }
}

module.exports = new BookingService();
