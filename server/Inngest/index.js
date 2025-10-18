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

// 🟢 CRITICAL FIX: Improved payment check function
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: 'release-seats-delete-booking' },
    { event: "app/checkpayment" },
    async ({ event, step }) => {
        const bookingId = event.data.bookingId;
        
        console.log(`⏰ Payment check scheduled for booking: ${bookingId}`);
        
        // Wait 10 minutes
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('Wait-for-10-minutes', tenMinutesLater);

        await step.run('check-payment-status', async () => {
            console.log(`🔍 Checking payment status for booking: ${bookingId}`);
            
            const booking = await Booking.findById(bookingId);
            
            if (!booking) {
                console.log(`❌ Booking ${bookingId} not found, no action taken`);
                return;
            }
            
            // 🟢 CRITICAL: Only proceed if booking exists AND is not paid
            if (!booking.isPaid) {
                console.log(`💸 Payment not received for booking ${bookingId}, releasing seats`);
                
                const show = await Show.findById(booking.show);
                if (show) {
                    // Release the occupied seats
                    booking.bookedSeats.forEach((seat) => {
                        delete show.occupiedSeats[seat];
                    });
                    show.markModified('occupiedSeats');
                    await show.save();
                    console.log(`🔄 Released seats for booking ${bookingId}: ${booking.bookedSeats.join(', ')}`);
                }
                
                await Booking.findByIdAndDelete(bookingId);
                console.log(`🗑️ Booking ${bookingId} deleted due to non-payment`);
            } else {
                console.log(`✅ Booking ${bookingId} is already paid, no action needed`);
            }
        });
    }
);

const sendBookingConfirmationEmail = inngest.createFunction(
    { id: "send-booking-confirmation-email" },
    { event: "app/show.booked" },
    async ({ event, step }) => {
        const { bookingId } = event.data;
        
        console.log(`📨 Processing booking confirmation email for: ${bookingId}`);

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: { path: "movie", model: "Movie" }
        }).populate('user');

        if (!booking) {
            console.log(`❌ Booking ${bookingId} not found for email confirmation`);
            return;
        }

        const showDate = new Date(booking.show.showDateTime).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
        });
        const showTime = new Date(booking.show.showDateTime).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
        });

        try {
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

            <p>🎬 Enjoy the show and don't forget to grab your popcorn!</p>
          </div>`
            });
            console.log(`✅ Booking confirmation email sent for booking: ${bookingId}`);
        } catch (emailError) {
            console.error(`❌ Failed to send email for booking ${bookingId}:`, emailError);
        }
    }
);

// Inngest function to send reminders
const sendShowReminders = inngest.createFunction(
    { id: "send-show-reminders" },
    { cron: "0 */8 * * *" }, // Fixed cron syntax
    async ({ step }) => {
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

        // Prepare reminder tasks
        const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
            const shows = await Show.find({
                showDateTime: { $gte: windowStart, $lte: in8Hours }, // Fixed field name
            }).populate('movie');

            const tasks = [];

            for (const show of shows) {
                if (!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new Set(Object.values(show.occupiedSeats))];
                if (userIds.length === 0) continue;

                const users = await User.find({ _id: { $in: userIds } }).select("name email");

                for (const user of users) {
                    tasks.push({
                        userEmail: user.email, // Fixed typo: user.enail → user.email
                        userName: user.name,
                        movieTitle: show.movie.title,
                        showTime: show.showDateTime, // Fixed field name
                    })
                }
            }
            return tasks;
        })

        if (reminderTasks.length === 0) {
            return { sent: 0, message: "No reminders to send." }
        }

        // Send reminder emails
        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail({
                    to: task.userEmail,
                    subject: `Reminder: your movie "${task.movieTitle}" starts soon!`,
                    body: ` <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #7b2cbf; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⏰ Show Reminder!</h1>
          </div>

          <div style="padding: 24px; font-size: 16px; color: #333;">
            <h2 style="margin-top: 0;">Hi ${task.userName},</h2>
            <p>Just a friendly reminder that your movie <strong style="color: #7b2cbf;">"${task.movieTitle}"</strong> starts soon!</p>

            <p>
              <strong>Show Time:</strong> ${new Date(task.showTime).toLocaleString()}
            </p>

            <p>🎬 Don't forget to grab your popcorn and enjoy the show!</p>
          </div>`
                }))
            )
        })

        const sent = results.filter(r => r.status === "fulfilled").length;
        const failed = results.length - sent;

        return {
            sent,
            failed,
            message: `Sent ${sent} reminder(s), ${failed} failed.`
        }
    }
);

const sendNewMovieEmail = inngest.createFunction(
    { id: 'send-new-movie-notification' },
    { event: 'app/show.added' },
    async ({ event }) => {
        const { movieTitle } = event.data;
        const users = await User.find({});

        if (!users.length) return "No users found";

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
                <p>Book your tickets now and enjoy the latest movie experience!</p>

                <div style="margin-top: 20px; text-align: center;">
                <a href="https://quickshow-ecru.vercel.app/movies" style="background-color: #7b2cbf; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">🎟️ Book Your Tickets</a>
                </div>
            </div>

            <div style="background-color: #f5f5f5; color: #777; padding: 16px; text-align: center; font-size: 14px;">
                <p style="margin: 0;">Thanks for staying with QuickShow!<br>We bring the cinema to your fingertips.</p>
                <p style="margin: 4px 0 0;">📍 Visit us: <a href="https://quickshow-ecru.vercel.app" style="color: #7b2cbf; text-decoration: none;">QuickShow</a></p>
            </div>
            </div>`

            await sendEmail({
                to: userEmail,
                subject,
                body,
            })
        }
        return { message: 'Notification sent' }
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail,
    sendShowReminders,
    sendNewMovieEmail
];