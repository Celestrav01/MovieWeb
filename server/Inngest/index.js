import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";
import Movie from "../models/Movie.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
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
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 60 * 1000);
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
            populate : {path: "movie", model: "Movie"}
        }).populate('user');

        const showDate = new Date(booking.show.showDateTime).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
        });
        const showTime = new Date(booking.show.showDateTime).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
        });

        await sendEmail({
            to: booking.user.email,
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

// Inngest function to send reminders
const sendShowReminders = inngest.createFunction(
    {id:"send-show-reminders"},
    {cron: "0 * /8 * * *"},
    async({step})=>{
        const now =new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);  
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

        // prepare reminer tasks
        const reminderTasks = await step.run("prepare-reminder-tasks", async ()=>{
            const shows = await Show.find({
                showTime: {$gte :windowStart, $lte: in8Hours},
            }).populate('movie');

            const tasks = [];

            for(const show of shows){
                if(!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new Set(Object.values(show.occupiedSeats))];
                if(userIds.length === 0) continue;

                const users = (await User.find({_id: {$in: userIds}})).select("name email");

                for(const user of users){
                    tasks.push({
                        userEmail : user.enail,
                        userName : user.name,
                        movieTitle : show.movie.title,
                        showTime : show.showTime,
                    })
                }
            }
            return tasks;
        })

        if(reminderTasks.length === 0){
            return {sent: 0, message : "No reminders to send."}
        }

        // Send reminder emails
        const results =  await step.run('send-all-reminders',async ()=>{
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail({
                    to: task.userEmail,
                    subject: `Reminder: your movie "${task.movieTitle}" starts soon!`,
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
                }))
            )
        })

        const sent = results.filter(r => r.status === "fulfilled").length;
        const failed = results.length  - sent;

        return  {
            sent,
            failed,
            message: `Sent ${sent} reminders(s), ${failed} failed.`
        }

    }


)

const sendNewMovieEmail = inngest.createFunction(
    { id: 'send-new-movie-notification' },
    { event: 'app/show.added' },
    async ({ event }) => {
        const { movieId,movieTitle } = event.data;
        const users = await User.find({});
        const movie = await Movie.findById(movieId);

        if(!movie) return "No movie found";

        for (const user of users) { 
            const userEmail = user.email;
            const userName = user.name;

            const subject = `🎬 New Show Added: ${movieTitle}`;
            const body = `<div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="background-color: #7b2cbf; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Hi ${userName},</h1>
            </div>

            <div style="padding: 24px; color: #333;">
                <h2 style="margin-top: 0;">"${movieTitle}" is Now Available on QuickShow!</h2>
                <p><strong>Release Date:</strong> ${movie.release_date}</p>
                <p><strong>Genre:</strong> ${movie.genres.map((genre) => genre).join(', ')}</p>
                <p>${movie.description}</p>

                <img src="${movie.primaryImage}" alt="${movieTitle  } Poster" style="width: 100%; max-height: 350px; object-fit: cover; border-radius: 4px; margin-top: 16px;" />

                <div style="margin-top: 20px; text-align: center;">
                <a href="https://quickshow-ecru.vercel.app/movies/${movieId}" style="background-color: #7b2cbf; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">🎟️ Book Your Tickets</a>
                </div>
            </div>

            <div style="background-color: #f5f5f5; color: #777; padding: 16px; text-align: center; font-size: 14px;">
                <p style="margin: 0;">Thanks for staying with QuickShow!<br>We bring the cinema to your fingertips.</p>
                <p style="margin: 4px 0 0;">📍 Visit us: <a href="https://quickshow-ecru.vercel.app" style="color: #7b2cbf; text-decoration: none;">QuickShow</a></p>
            </div>
            </div>`

            await sendEmail({
                to : userEmail,
                subject,
                body,
            })
        }
        return {message : 'Notification sent'}
    }
)


export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail,
    sendShowReminders,sendNewMovieEmail
];