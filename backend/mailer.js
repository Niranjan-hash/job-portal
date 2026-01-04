const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config()
const cleanpaswword = process.env.EMAIL_PASSWORD.replace(/\s+/g,"")
const transporter = nodemailer.createTransport({
    
    service:"gmail",
    auth:{
           user:process.env.EMAIL,
           pass:process.env.EMAIL_PASSWORD||cleanpaswword
    }
    
})
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer error:", error);
  } else {
    console.log("✅ Mail server is ready");
  }
});

module.exports = transporter;
