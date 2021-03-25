
const nodemailer = require('nodemailer');

class SmtpSender {

  constructor(options) {
    this._transporter = nodemailer.createTransport(options);
  }

  send(to, mail) {
    mail.to = to;
    mail.from = mail.from?.text || mail.from;
    return this._transporter.sendMail(mail);
  }

}

module.exports = SmtpSender;
