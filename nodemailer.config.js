const nodemailer = require('nodemailer')
require('dotenv').config()
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2;

const OAuth2_client = new OAuth2(process.env.clientId, process.env.clientSecret);
OAuth2_client.setCredentials({ refresh_token: process.env.refreshToken })

const user = process.env.user;
const accessToken = OAuth2_client.getAccessToken();

const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: 'OAuth2',
        user: user,
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret,
        refreshToken: process.env.refreshToken,
        accessToken: accessToken
    }
});

module.exports.registered = (name, email, role) => {
    transport.sendMail({
        from: user,
        to: email,
        subject: `Registered as ${role}`,
        html: `<h2>Hello ${name}</h2>
        <p>Your email has been registered as ${role} in M.Tech Viva Portal. You can now login to your account.</p>
        <br>
        <h5>Regards</h5>`
        
    }).catch(err => console.log(err));
}

module.exports.deleted = (name, email) => {
    transport.sendMail({
        from: user,
        to: email,
        subject: `Account Deleted`,
        html: `<h2>Hello ${name}</h2>
        <p>Your email has been removed from M.Tech Viva Portal. You cannot login to your account now. Contact Admin if this is a mistake.</p>
        <br>
        <h5>Regards</h5>`
        
    }).catch(err => console.log(err));
}

module.exports.updated = (name, email) => {
    transport.sendMail({
        from: user,
        to: email,
        subject: `Account Update`,
        html: `<h2>Hello ${name}</h2>
        <p>Your account has been updated. You can login to your account and check if details are now correct or not. Contact Admin if there is still a mistake.</p>
        <br>
        <h5>Regards</h5>`
        
    }).catch(err => console.log(err));
}

module.exports.supervisorReq = (name, email, prof) => {
    transport.sendMail({
        from: user,
        to: email,
        subject: `Regarding Viva for ${name}`,
        html: `<h2>Hello ${prof}</h2>
        <p>${name} has chosen you as his supervisor for his M.Tech. thesis evaluation. Please assign ${name} timings, venue/online link and examiners for the evaluation.</p>
        <br>
        <h5>Regards</h5>`
        
    }).catch(err => console.log(err));
}

module.exports.supChange = (name, email) => {
    transport.sendMail({
        from: user,
        to: email,
        subject: `Supervisor Change`,
        html: `<h2>Hello There</h2>
        <p>You are no longer the supervisor of ${name}. Contact Admin if this is a mistake.</p>
        <br>
        <h5>Regards</h5>`
        
    }).catch(err => console.log(err));
}

module.exports.studEvalTiming = (name, email, prof, date, time, venue) => {
    if(venue.indexOf('.com')===-1 && venue.indexOf('.in')===-1) {
        transport.sendMail({
            from: user,
            to: email,
            subject: `Evaluation date and timing`,
            html: `<h2>Hello ${name}</h2>
            <p>Your evaluation will start from at ${date} on ${time} in ${venue}.</p>
            <p>Please stick to the timing.</p>
            <p>Ignore the previous conversations (if any).</p>
            <br>
            <h5>Regards</h5>
            <h5>${prof}</h5>`
        })
    }
    else {
        transport.sendMail({
            from: user,
            to: email,
            subject: `Evaluation date and timing`,
            html: `<h2>Hello ${name}</h2>
            <p>Your evaluation will start from at ${date} on ${time} online at <a href=${venue}>Exam Link</a>.</p>
            <p>Please stick to the timing.</p>
            <p>Ignore the previous conversations (if any).</p>
            <br>
            <h5>Regards</h5>
            <h5>${prof}</h5>`
        })
    }
}

module.exports.Examiner = (name, email, email1, prof, date, time, venue, internal, external) => {
    if(venue.indexOf('.com')===-1 && venue.indexOf('.in')===-1) {
        transport.sendMail({
            from: user,
            to:`${email}, ${email1}`,
            subject: 'Internal Examiner of M.Tech Viva',
            html: `<h2>Hello There</h2>
            <p>${prof} has chosen you in the viva committee for ${name}. The internal examiner ${internal} and external examiner is ${external} as external examiner. The viva is at ${date} on ${time} in ${venue}.</p>
            <br>
            <h5>Regards</h5>`
        })
    }
    else {
        transport.sendMail({
            from: user,
            to:`${email}, ${email1}`,
            subject: 'Internal Examiner of M.Tech Viva',
            html: `<h2>Hello There</h2>
            <p>${prof} has chosen you in the viva committee for ${name}. The internal examiner ${internal} and external examiner is ${external} as external examiner. The viva is at ${date} on ${time} online at <a href=${venue}>Exam Link</a>.</p>
            <br>
            <h5>Regards</h5>`
        })
    }
}

module.exports.ExaminerNew = (name, email, email1, prof, internal, external) => {
    transport.sendMail({
        from: user,
        to:`${email}, ${email1}`,
        subject: 'Internal Examiner of M.Tech Viva',
        html: `<h2>Hello There</h2>
        <p>${prof} has chosen you in the viva committee for ${name}. The internal examiner ${internal} and external examiner is ${external} as external examiner. Rest of the details remain same.</p>
        <br>
        <h5>Regards</h5>`
    })
}

module.exports.newExamSchedule = (name, email, email1, email2, prof, internal, external, date, time , venue) => {
    transport.sendMail({
        from: user,
        to:`${email}, ${email1}, ${email2}`,
        subject: 'Internal Examiner of M.Tech Viva',
        html: `<h2>Hello There</h2>
        <p>The new schedule for the viva of ${name} will be </p>
        <br>
        <h5>Regards</h5>`
    })
}