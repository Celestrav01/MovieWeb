// Function to check availability of selected seats for a movie
import Show from "../models/Show.js"
import Booking from '../models/Booking.js'
import stripe from 'stripe'
import { inngest } from "../Inngest/index.js"

const checkSeatAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId)
        if (!showData) return false;

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;

    } catch (error) {
        console.log(error.message);
        return false;
    }
}

export const createbooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { showId, selectedSeats } = req.body;
        const { origin } = req.headers;

        console.log(`🎫 Creating booking for user ${userId}, show ${showId}, seats: ${selectedSeats}`);

        // check if seat is available for selected show
        const isAvailable = await checkSeatAvailability(showId, selectedSeats)

        if (!isAvailable) {
            return res.json({ success: false, message: "Selected seats are not available." })
        }

        // Get show details
        const showData = await Show.findById(showId).populate('movie');

        // Create a new Booking 
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        })

        console.log(`📝 Booking created: ${booking._id}, Amount: ${booking.amount}`);

        // Mark seats as occupied
        selectedSeats.map((seat) => {
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');
        await showData.save();

        console.log(`💺 Seats marked as occupied: ${selectedSeats.join(', ')}`);

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // creating line items for stripe 
        const line_items = [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: showData.movie.title
                },
                unit_amount: Math.floor(booking.amount) * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, //Expires in 30 minutes
        })

        booking.paymentlink = session.url
        await booking.save()

        console.log(`🔗 Stripe session created: ${session.url}`);
        console.log(`💰 Payment required for booking: ${booking._id}`);

        // Run inngest Scheduler function to check payment status after 10 minutes
        await inngest.send({
            name: "app/checkpayment",
            data: {
                bookingId: booking._id.toString()
            }
        })

        console.log(`⏰ Inngest payment check scheduled for booking: ${booking._id}`);

        res.json({ success: true, url: session.url })

    } catch (error) {
        console.log("❌ Booking creation error:", error.message);
        res.json({ success: false, message: error.message })
    }
}

export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({ success: true, occupiedSeats })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}