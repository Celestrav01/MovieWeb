import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../Inngest/index.js";


export const stripeWebhooks = async (request, response)=>{
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];

    let event;

    try {
        // This is the line that throws if the raw body or signature secret is wrong.
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
        console.log("Stripe Webhook Verification Succeeded."); // Log to confirm webhook signature passed
    } catch (error) {
        // CRITICAL LOG: This error means the signature check failed.
        console.error(`Webhook Signature Error: ${error.message}. Check your raw body parser in server.js or your STRIPE_WEBHOOK_SECRET.`);
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            // Stripe uses 'checkout.session.completed' for successful payment through Checkout Pages
            case "checkout.session.completed": 
            case "payment_intent.succeeded": {
                const session = event.data.object;
                // Extract the bookingId from the metadata saved during session creation
                const bookingId = session.metadata?.bookingId;

                if (bookingId) {
                    const booking = await Booking.findById(bookingId);
                    
                    if (booking && !booking.isPaid) {
                        // 🟢 FIX: Set isPaid to true and save the booking
                        booking.isPaid = true;
                        await booking.save();
                        console.log(`Booking ${bookingId} successfully marked as paid.`);
                        
                        // Send Confirmation Email (Inngest trigger)
                        await inngest.send({
                            name: "app/show.booked",
                            data: { bookingId: booking._id.toString() }
                        })
                        
                        console.log(`Inngest event 'app/show.booked' triggered for Booking ID: ${bookingId}`);
                    }
                }
                
                break;
            }
                
        
            default:
            console.log('unhandeled event type:', event.type)
        }
        // Send a 200 response back to Stripe
        response.json({received : true})
    } catch (err) {
        console.log("Webhook processing error",err);
        response.status(500).send("Internal server error");
    }

}
