const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: "santoshfulgame71@gmail.com",
    pass: "fwptfoiykkzpcnlz",
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(to,subject,text) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: 'santoshfulgame71@gmail.com', // sender address
    to,
    subject,
    text,
  });

}


module.exports = {sendMail}

