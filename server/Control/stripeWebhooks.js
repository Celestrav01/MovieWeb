// import stripe from "stripe";
// import Booking from "../models/Booking.js";
// import { inngest } from "../Inngest/index.js";


// export const stripeWebhooks = async (request, response)=>{
//     const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
//     const sig = request.headers["stripe-signature"];

//     let event;

//     try {
//         event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
//     } catch (error) {
//         return response.status(400).send(`Webhook Error: ${error.message}`);
//     }

//     try {
//         switch (event.type) {
//             case "payment_intent.succeeded": {
//                 const paymentIntent = event.data.object;
//                 const sessionList = await stripeInstance.checkout.sessions.list({
//                     payment_intent: paymentIntent.id
//                 })

//                 const session = sessionList.data[0];
//                 const {bookingId} = session.metadata;

//                 await Booking.findByIdAndUpdate(bookingId, {
//                     isPaid : true,
//                     paymentlink: ""
//                 })

//                 // Send Confirmation Email
//                 await inngest.send({
//                     name: "app/show.booked",
//                     data: {bookingId}
//                 })

//                 break;
//             }
                
        
//             default:
//             console.log('unhandeled event type:', event.type)
//         }
//         response.json({received : true})
//     } catch (err) {
//         console.log("Webhook processing error",err);
//         response.status(500).send("Internal server error");
//     }

// }
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
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                
                // 🟢 ADD LOGGING HERE
                console.log("🔍 STRIPE WEBHOOK DEBUG - payment_intent.succeeded:");
                console.log("   Payment Intent ID:", paymentIntent.id);
                
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                })

                const session = sessionList.data[0];
                
                // 🟢 ADD MORE LOGGING HERE
                console.log("   Session found:", session?.id);
                console.log("   Session metadata:", session?.metadata);
                
                const { bookingId } = session.metadata;
                const customerEmail = session.customer_details?.email;
                
                // 🟢 ADD CRITICAL LOGGING HERE
                console.log("   Booking ID from metadata:", bookingId);
                console.log("   Customer Email from Stripe:", customerEmail);
                console.log("   Full customer_details:", session.customer_details);

                await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentlink: ""
                })

                // 🟢 LOG WHAT WE'RE SENDING TO INNGEST
                console.log("📧 Sending to Inngest with data:", { 
                    bookingId, 
                    customerEmail 
                });

                // Send Confirmation Email
                await inngest.send({
                    name: "app/show.booked",
                    data: { 
                        bookingId,
                        customerEmail  // 🟢 Make sure this is included
                    }
                })

                console.log("✅ Webhook processing completed for booking:", bookingId);
                break;
            }
                
            default:
            console.log('unhandeled event type:', event.type)
        }
        response.json({ received: true })
    } catch (err) {
        console.log("Webhook processing error", err);
        response.status(500).send("Internal server error");
    }
}