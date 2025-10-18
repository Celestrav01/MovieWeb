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

        // 🟢 PARALLEL EXECUTION: Check availability and get show data simultaneously
        const [isAvailable, showData] = await Promise.all([
            checkSeatAvailability(showId, selectedSeats),
            Show.findById(showId).populate('movie')
        ]);

        if (!isAvailable) {
            return res.json({ success: false, message: "Selected seats are not available." });
        }

        // 🟢 CREATE BOOKING AND UPDATE SHOW IN PARALLEL
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        });

        // Update occupied seats
        const seatUpdates = selectedSeats.map((seat) => {
            showData.occupiedSeats[seat] = userId;
        });
        
        showData.markModified('occupiedSeats');
        
        // 🟢 DON'T WAIT FOR SHOW SAVE TO COMPLETE BEFORE CREATING STRIPE SESSION
        const showSavePromise = showData.save();

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const line_items = [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: showData.movie.title
                },
                unit_amount: Math.floor(booking.amount) * 100
            },
            quantity: 1
        }];

        // 🟢 CREATE STRIPE SESSION IMMEDIATELY
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            customer_email: booking.user.email,
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        // 🟢 UPDATE BOOKING WITH PAYMENT LINK
        booking.paymentlink = session.url;
        const bookingSavePromise = booking.save();

        // 🟢 WAIT FOR BOTH SAVES TO COMPLETE IN BACKGROUND
        Promise.all([showSavePromise, bookingSavePromise]).catch(console.error);

        // 🟢 SCHEDULE PAYMENT CHECK (DON'T WAIT FOR IT)
        inngest.send({
            name: "app/checkpayment",
            data: {
                bookingId: booking._id.toString()
            }
        }).catch(console.error);

        // 🟢 IMMEDIATE RESPONSE WITH STRIPE URL
        res.json({ success: true, url: session.url });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const showData = await Show.findById(showId);
        const occupiedSeats = Object.keys(showData.occupiedSeats);
        res.json({ success: true, occupiedSeats });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}