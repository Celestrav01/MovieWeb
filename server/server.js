
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv/config';
// import connectDB from './configs/db.js';
// import { clerkMiddleware } from '@clerk/express'
// import { serve } from "inngest/express";
// import { inngest, functions } from "./Inngest/index.js"
// import showRouter from './routes/showRoutes.js';
// import bookingRouter from './routes/bookingRoutes.js';
// import adminRouter from './routes/adminRoutes.js';
// import userRouter from './routes/userRoutes.js';
// import { stripeWebhooks } from './Control/stripeWebhooks.js';

// const app = express();
// const port = 3000;
// await connectDB();
// //  Stripe webhook routes
// app.use('/api/stripe',express.raw({type: 'application/json'}), stripeWebhooks)
  
// //Middleware 
// app.use(express.json());
// app.use(cors());
// app.use(clerkMiddleware())

// //Routes
// app.get('/', (req,res) => {res.send('Server is live!')});
// app.use("/api/inngest", serve({ client: inngest, functions }));
// app.use('/api/show', showRouter)
// app.use('/api/booking', bookingRouter)
// app.use('/api/admin', adminRouter)
// app.use('/api/user',userRouter)


// app.listen(port, () => {
//     console.log(`Server listening at http://localhost:${port}`);
// })


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./Inngest/index.js"
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './Control/stripeWebhooks.js';
import sendEmail from './configs/nodeMailer.js'; // 🟢 ADD THIS IMPORT

const app = express();
const port = 3000;
await connectDB();

// Stripe webhook routes
app.use('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)

// Middleware 
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())

// 🟢 ADD TEST ENDPOINT HERE (before other routes)
app.post('/test-email-direct', async (req, res) => {
    try {
        const { testEmail } = req.body;
        
        console.log("🧪 TEST EMAIL REQUEST RECEIVED:");
        console.log("   Test email parameter:", testEmail);

        if (!testEmail) {
            return res.json({ 
                success: false, 
                message: "testEmail parameter is required" 
            });
        }

        await sendEmail({
            to: testEmail,
            subject: 'TEST: QuickShow Email System',
            body: '<h1>Test Email from QuickShow</h1><p>This is a direct test of our email system.</p><p>If you receive this, the email system is working correctly!</p>'
        });
        
        res.json({ 
            success: true, 
            message: 'Test email sent successfully',
            recipient: testEmail,
            sender: process.env.SENDER_EMAIL
        });
    } catch (error) {
        console.error('❌ Test email failed:', error);
        res.json({ 
            success: false, 
            message: error.message,
            recipient: testEmail,
            sender: process.env.SENDER_EMAIL
        });
    }
});

// Routes
app.get('/', (req, res) => { res.send('Server is live!') });
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
})