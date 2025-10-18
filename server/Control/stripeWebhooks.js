import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../Inngest/index.js";

export const stripeWebhooks = async (request, response) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const { bookingId } = session.metadata;
                const customerEmail = session.customer_details?.email;
                const customerName = session.customer_details?.name; // 🟢 KEEP CUSTOMER NAME

                await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentlink: ""
                });

                await inngest.send({
                    name: "app/show.booked",
                    data: { 
                        bookingId,
                        customerEmail,
                        customerName // 🟢 KEEP CUSTOMER NAME
                    }
                });
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                });

                const session = sessionList.data[0];
                const { bookingId } = session.metadata;
                const customerEmail = session.customer_details?.email;
                const customerName = session.customer_details?.name; // 🟢 KEEP CUSTOMER NAME

                await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentlink: ""
                });

                await inngest.send({
                    name: "app/show.booked",
                    data: { 
                        bookingId,
                        customerEmail,
                        customerName // 🟢 KEEP CUSTOMER NAME
                    }
                });
                break;
            }
                
            default:
                console.log('unhandled event type:', event.type);
        }
        response.json({ received: true });
    } catch (err) {
        console.log("Webhook processing error", err);
        response.status(500).send("Internal server error");
    }
};