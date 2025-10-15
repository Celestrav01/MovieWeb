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
        const recipients = Array.isArray(to) ? to : [to];

        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: process.env.SENDER_EMAIL, 
            bcc: recipients.join(', '), 
            subject,
            html:body,
        })
        return response
    } catch (error) {
        console.error("Nodemailer Error: Failed to send email.", error);
        throw error; 
    }
}

export default sendEmail;