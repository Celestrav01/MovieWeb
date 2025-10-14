import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}); 

const sendEmail = async ({ to,subject,body})=>{
    try {
        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html:body,
        })
        return response
    } catch (error) {
        // 🟢 NEW CODE: Log the detailed email sending error to help debugging 
        console.error("Nodemailer Error: Failed to send email.", error);
        // Throwing the error will allow Inngest to correctly identify the failure and retry
        throw error; 
    }
}

export default sendEmail;