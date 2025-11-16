// api/booking/[id].js - Booking endpoints by ID (GET, PUT, DELETE)
const connectDB = require('../../lib/db');
const Booking = require('../../models/Booking');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    // GET single booking
    if (req.method === 'GET') {
      const booking = await Booking.findOne({ bookingId: id });
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      return res.json(booking);
    }

    // PUT update booking
    if (req.method === 'PUT') {
      const booking = await Booking.findOne({ bookingId: id });
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Update fields (preserve bookingId and documents unless explicitly changed)
      const updateData = { ...req.body };
      
      // Convert date strings to Date objects if present
      if (updateData.checkin) updateData.checkin = new Date(updateData.checkin);
      if (updateData.checkout) updateData.checkout = new Date(updateData.checkout);
      
      // Preserve bookingId and documents if not in update
      if (!updateData.bookingId) updateData.bookingId = id;
      if (!updateData.documents) updateData.documents = booking.documents || [];

      Object.assign(booking, updateData);
      await booking.save();

      return res.json({ success: true, booking });
    }

    // DELETE booking
    if (req.method === 'DELETE') {
      const booking = await Booking.findOneAndDelete({ bookingId: id });
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      return res.json({ success: true, message: 'Booking deleted', booking });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Booking operation error:', err);
    res.status(500).json({ error: 'Failed to process booking operation' });
  }
};

