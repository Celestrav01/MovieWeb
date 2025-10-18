// import nodemailer from 'nodemailer'

// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 587,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// }); 

// const sendEmail = async ({ to,subject,body})=>{
     
//     const response = await transporter.sendMail({
//         from: process.env.SENDER_EMAIL,
//         to,
//         subject,
//         html:body,
//     })
//     return response;
// }

// export default sendEmail;

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}); 

const sendEmail = async ({ to, subject, body }) => {
    try {
        // 🟢 ADD THESE LOGS AT THE BEGINNING
        console.log("🔍 NODEMAILER DEBUG:");
        console.log("   SENDER_EMAIL from env:", process.env.SENDER_EMAIL);
        console.log("   Recipient (to):", to);
        console.log("   Subject:", subject);
        console.log("   SMTP User:", process.env.SMTP_USER);

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: to,
            subject: subject,
            html: body,
        };

        console.log("   Mail options prepared:", {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const response = await transporter.sendMail(mailOptions);
        
        // 🟢 LOG THE RESPONSE
        console.log("✅ Nodemailer sent successfully:");
        console.log("   Message ID:", response.messageId);
        console.log("   Response:", response.response);
        
        return response;

    } catch (error) {
        // 🟢 LOG ERRORS
        console.error("❌ Nodemailer failed:");
        console.error("   Error:", error.message);
        console.error("   Stack:", error.stack);
        throw error;
    }
}

export default sendEmail;