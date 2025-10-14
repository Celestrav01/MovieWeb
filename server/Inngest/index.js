import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            name: first_name + ' ' + last_name,
            email: email_addresses[0].email_address,
            image: image_url
        }
        await User.create(userData)
    } 
); 

const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data
      
        await User.findByIdAndDelete(id)
    } 
); 

const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
        const userData = {
            _id: id,
            name: first_name + ' ' + last_name,
            email: email_addresses[0].email_address,
            image: image_url
        }
        await User.findByIdAndUpdate(id, userData);
    }
)

const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {id: 'release-seats-delete-booking'},
    {event : "app/checkpayment"},
    async({ event,step })=>{
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('Wait-for-10-minutes',tenMinutesLater)

        await step.run('check-payment-status', async ()=>{
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId)

            if(!booking.isPaid){
                const show = await Show.findById(booking.show);
                booking.bookedSeats.forEach((seat)=>{
                    delete show.occupiedSeats[seat]
                });
                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)

const sendBookingConfirmationEmail = inngest.createFunction (
    {id:"send-booking-confirmation-email"},
    {event: "app/show.booked"},
    async ({event,step})=>{
        const {bookingId} = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path : 'show',
            populate : {path: "movie", model: "movie"}
        }).populate('user');

        const showDate = new Date(booking.show.showDateTime).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
        });
        const showTime = new Date(booking.show.showDateTime).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
        });

        await sendEmail({
            to : booking.user.email,
            subject: `Payment Confirmation: "${booking.show.movie.title}" booked`,
            body: ` <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #7b2cbf; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🎟️ QuickShow Booking Confirmed!</h1>
          </div>

          <div style="padding: 24px; font-size: 16px; color: #333;">
            <h2 style="margin-top: 0;">Hi ${booking.user.name},</h2>
            <p>Your booking for <strong style="color: #7b2cbf;">"${booking.show.movie.title}"</strong> is confirmed.</p>

            <p>
              <strong>Date:</strong> ${showDate}<br>
              <strong>Time:</strong> ${showTime}
            </p>
            <p><strong>Booking ID:</strong> <span style="color: #7b2cbf;">${booking._id}</span></p>
            <p><strong>Seats:</strong> ${booking.bookedSeats?.join(', ') || 'N/A'}</p>

            <p>🎬 Enjoy the show and don’t forget to grab your popcorn!</p>
          </div>`
        })
    }
)

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,sendBookingConfirmationEmail
];