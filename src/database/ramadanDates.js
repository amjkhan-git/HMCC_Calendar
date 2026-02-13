/**
 * Ramadan 2026 (1447 AH) Calendar Dates for HMCC
 * 
 * Ramadan 1447 begins on February 18, 2026 (1 Ramadan 1447)
 * and ends on March 18, 2026 (30 Ramadan 1447) - Last Iftar
 * March 20, 2026 is Eid ul Fitr (1 Shawwal 1447)
 * 
 * Feb 19-21: Blocked (mosque arrangements)
 * Feb 22: HMCC Sponsored
 * Feb 23+: Open for booking
 * 
 * Guest capacity: 150 Weekday, 200 Weekend (adjust as needed)
 * Last 10 nights: March 10-19 (20-29 Ramadan)
 */

const config = require('../config');

const ramadanDates = [
  // Ramadan starts Feb 18 (1 Ramadan)
  { date: '2026-02-18', hijri_day: 1, hijri_date: '1 Ramadan 1447', day_of_week: 'Wednesday', initial_status: 'blocked' },
  { date: '2026-02-19', hijri_day: 2, hijri_date: '2 Ramadan 1447', day_of_week: 'Thursday', initial_status: 'blocked' },
  { date: '2026-02-20', hijri_day: 3, hijri_date: '3 Ramadan 1447', day_of_week: 'Friday', initial_status: 'blocked' },
  { date: '2026-02-21', hijri_day: 4, hijri_date: '4 Ramadan 1447', day_of_week: 'Saturday', initial_status: 'hmcc_sponsored' },
  { date: '2026-02-22', hijri_day: 5, hijri_date: '5 Ramadan 1447', day_of_week: 'Sunday', initial_status: 'available' },
  { date: '2026-02-23', hijri_day: 6, hijri_date: '6 Ramadan 1447', day_of_week: 'Monday', initial_status: 'available' },
  { date: '2026-02-24', hijri_day: 7, hijri_date: '7 Ramadan 1447', day_of_week: 'Tuesday', initial_status: 'available' },
  { date: '2026-02-25', hijri_day: 8, hijri_date: '8 Ramadan 1447', day_of_week: 'Wednesday', initial_status: 'available' },
  { date: '2026-02-26', hijri_day: 9, hijri_date: '9 Ramadan 1447', day_of_week: 'Thursday', initial_status: 'available' },
  { date: '2026-02-27', hijri_day: 10, hijri_date: '10 Ramadan 1447', day_of_week: 'Friday', initial_status: 'available' },
  { date: '2026-02-28', hijri_day: 11, hijri_date: '11 Ramadan 1447', day_of_week: 'Saturday', initial_status: 'available' },
  { date: '2026-03-01', hijri_day: 12, hijri_date: '12 Ramadan 1447', day_of_week: 'Sunday', initial_status: 'available' },
  { date: '2026-03-02', hijri_day: 13, hijri_date: '13 Ramadan 1447', day_of_week: 'Monday', initial_status: 'available' },
  { date: '2026-03-03', hijri_day: 14, hijri_date: '14 Ramadan 1447', day_of_week: 'Tuesday', initial_status: 'available' },
  { date: '2026-03-04', hijri_day: 15, hijri_date: '15 Ramadan 1447', day_of_week: 'Wednesday', initial_status: 'available' },
  { date: '2026-03-05', hijri_day: 16, hijri_date: '16 Ramadan 1447', day_of_week: 'Thursday', initial_status: 'available' },
  { date: '2026-03-06', hijri_day: 17, hijri_date: '17 Ramadan 1447', day_of_week: 'Friday', initial_status: 'available' },
  { date: '2026-03-07', hijri_day: 18, hijri_date: '18 Ramadan 1447', day_of_week: 'Saturday', initial_status: 'available' },
  { date: '2026-03-08', hijri_day: 19, hijri_date: '19 Ramadan 1447', day_of_week: 'Sunday', initial_status: 'available' },
  { date: '2026-03-09', hijri_day: 20, hijri_date: '20 Ramadan 1447', day_of_week: 'Monday', initial_status: 'available' },
  { date: '2026-03-10', hijri_day: 21, hijri_date: '21 Ramadan 1447', day_of_week: 'Tuesday', initial_status: 'available' },
  { date: '2026-03-11', hijri_day: 22, hijri_date: '22 Ramadan 1447', day_of_week: 'Wednesday', initial_status: 'available' },
  { date: '2026-03-12', hijri_day: 23, hijri_date: '23 Ramadan 1447', day_of_week: 'Thursday', initial_status: 'available' },
  { date: '2026-03-13', hijri_day: 24, hijri_date: '24 Ramadan 1447', day_of_week: 'Friday', initial_status: 'available' },
  { date: '2026-03-14', hijri_day: 25, hijri_date: '25 Ramadan 1447', day_of_week: 'Saturday', initial_status: 'available' },
  { date: '2026-03-15', hijri_day: 26, hijri_date: '26 Ramadan 1447', day_of_week: 'Sunday', initial_status: 'available' },
  { date: '2026-03-16', hijri_day: 27, hijri_date: '27 Ramadan 1447', day_of_week: 'Monday', initial_status: 'available' },
  { date: '2026-03-17', hijri_day: 28, hijri_date: '28 Ramadan 1447', day_of_week: 'Tuesday', initial_status: 'available' },
  { date: '2026-03-18', hijri_day: 29, hijri_date: '29 Ramadan 1447', day_of_week: 'Wednesday', initial_status: 'available' },
  { date: '2026-03-19', hijri_day: 30, hijri_date: '30 Ramadan 1447', day_of_week: 'Thursday', initial_status: 'available' },
  // Eid ul Fitr (1 Shawwal 1447)
  { date: '2026-03-20', hijri_day: '', hijri_date: '1 Shawwal 1447 - Eid ul Fitr', day_of_week: 'Friday', initial_status: 'eid' }
];

// Last 10 nights of Ramadan (20-29 Ramadan) - Special pricing
const lastTenNights = [
  '2026-03-10', '2026-03-12', '2026-03-14', '2026-03-16', '2026-03-18'
];

// Special nights in Ramadan (Laylat al-Qadr possibilities)
const specialNights = {
  '2026-03-10': { name: '21st Night', description: 'Possible Laylat al-Qadr' },
  '2026-03-12': { name: '23rd Night', description: 'Possible Laylat al-Qadr' },
  '2026-03-14': { name: '25th Night', description: 'Possible Laylat al-Qadr' },
  '2026-03-16': { name: '27th Night', description: 'Most Likely Laylat al-Qadr' },
  '2026-03-18': { name: '29th Night', description: 'Possible Laylat al-Qadr' }
};

// Helper function to check if a date is in the last 10 nights
function isLastTenNights(date) {
  return lastTenNights.includes(date);
}

// Helper function to check if a date is a weekend (Fri/Sat/Sun)
function isWeekend(dayOfWeek) {
  return ['Friday', 'Saturday', 'Sunday'].includes(dayOfWeek);
}

// Get pricing for a specific date (uses config values)
function getPricing(date, dayOfWeek) {
  if (isLastTenNights(date)) {
    // Last 10 nights pricing
    return {
      food_amount: config.pricing.lastTenNights.food,
      cleaning_amount: config.pricing.lastTenNights.cleaning,
      total: config.pricing.lastTenNights.total,
      tier: 'last10nights',
      description: config.pricing.lastTenNights.description
    };
  } else if (isWeekend(dayOfWeek)) {
    // Weekend pricing
    return {
      food_amount: config.pricing.weekend.food,
      cleaning_amount: config.pricing.weekend.cleaning,
      total: config.pricing.weekend.total,
      tier: 'weekend',
      description: config.pricing.weekend.description
    };
  } else {
    // Weekday pricing
    return {
      food_amount: config.pricing.weekday.food,
      cleaning_amount: config.pricing.weekday.cleaning,
      total: config.pricing.weekday.total,
      tier: 'weekday',
      description: config.pricing.weekday.description
    };
  }
}

// Get expected guests based on day (uses config values)
function getExpectedGuests(dayOfWeek) {
  return isWeekend(dayOfWeek) ? config.weekendGuests : config.weekdayGuests;
}

module.exports = {
  ramadanDates,
  specialNights,
  lastTenNights,
  isLastTenNights,
  isWeekend,
  getPricing,
  getExpectedGuests
};
