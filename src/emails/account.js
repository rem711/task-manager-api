const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    // sgMail.send({
    //    to: email,
    //    from: 'contact@remi-courvoisier.fr',
    //    subject: 'Thanks for joining in!',
    //    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    // });
    console.log(`Welcome to the app, ${name}. Let me know how you get along with the app.`);
}

const sendCancelationEmail = (email, name) => {
    // sgMail.send({
    //     to: email,
    //     from: 'contact@remi-courvoisier.fr',
    //     subject: 'We\'re gonna miss you!',
    //     text: `Could we change something to get you back ${name}?`
    //  });
    console.log(`Could we change something to get you back ${name}?`);
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}
