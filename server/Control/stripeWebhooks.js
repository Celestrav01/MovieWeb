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
        console.log("Stripe Webhook Verification Succeeded."); // 🟢 NEW LOG: To prove we passed verification
    } catch (error) {
        // 🟢 CRITICAL LOG: This failure is why you see no console output.
        console.error(`Webhook Signature Error: ${error.message}. Check your raw body parser in server.js or your STRIPE_WEBHOOK_SECRET.`);
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                // ... (omitted code for finding session and updating booking)

                // Send Confirmation Email
                await inngest.send({
                    name: "app/show.booked",
                    data: {bookingId}
                })
                
                console.log(`Inngest event 'app/show.booked' triggered for Booking ID: ${bookingId}`);

                break;
            }
                
        
            default:
            console.log('unhandeled event type:', event.type)
        }
        response.json({received : true})
    } catch (err) {
        console.log("Webhook processing error",err);
        response.status(500).send("Internal server error");
    }

}