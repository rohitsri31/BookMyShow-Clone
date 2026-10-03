import cinemas from '../data/cinemas.json';

export const getCinemas = (city) => cinemas.filter(cinema => cinema.city === city);

export function getSevenDates(start = new Date()) {
  const today = new Date(start);
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      date,
      key: localDateKey(date),
      weekday: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: date.toLocaleDateString('en-IN', { day: '2-digit' }),
      month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    };
  });
}

export function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getCinemaShowtimes(cinema, date, movieId = 'movie') {
  const times = [
    { label: '10:10 AM', hour: 10, minute: 10 },
    { label: '1:40 PM', hour: 13, minute: 40 },
    { label: '5:15 PM', hour: 17, minute: 15 },
    { label: '8:45 PM', hour: 20, minute: 45 },
  ];
  const dateKey = localDateKey(date);
  return times.map((time, index) => {
    const start = new Date(date);
    start.setHours(time.hour, time.minute, 0, 0);
    if (start < new Date()) return null;
    const seed = cinema.id.length + date.getDate() + index;
    const status = seed % 9 === 0 ? 'sold' : seed % 5 === 0 ? 'filling' : 'available';
    const base = 160 + ((cinema.id.length * 11 + index * 43) % 180);
    return {
      id: `${cinema.id}_${dateKey}_${String(time.hour).padStart(2, '0')}${time.minute}_${movieId}`,
      time: time.label,
      start: start.toISOString(),
      status,
      formats: cinema.formats,
      categories: [
        { name: 'Silver', price: Math.max(120, base - 70) },
        { name: 'Gold', price: base },
        { name: 'Platinum', price: base + 100 },
      ],
    };
  }).filter(Boolean);
}

export function readStoredBooking() {
  try { return JSON.parse(localStorage.getItem('showtime-current-booking')) || null; } catch { return null; }
}
export function storeBooking(booking) {
  if (booking) localStorage.setItem('showtime-current-booking', JSON.stringify(booking));
  else localStorage.removeItem('showtime-current-booking');
}
export function readBookings() {
  try { return JSON.parse(localStorage.getItem('showtime-bookings')) || []; } catch { return []; }
}
export function storeBookings(bookings) { localStorage.setItem('showtime-bookings', JSON.stringify(bookings)); }

