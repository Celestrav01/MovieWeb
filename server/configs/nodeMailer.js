// Updated nodeMailer.js with debugging
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
        console.log('📧 Attempting to send email:');
        console.log('   From:', process.env.SENDER_EMAIL);
        console.log('   To:', to);
        console.log('   Subject:', subject);
        
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html: body,
        };

        const response = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully:', response.messageId);
        return response;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        throw error;
    }
}

export default sendEmail;