const nodemailer = require('nodemailer')
const config = require('./config')

const user = config.user
const pass = config.password

const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: user,
        pass: pass,
    },
});

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

module.exports.studEvalTiming = (name, email, prof, date, time, venue) => {
    if(venue.indexOf('.com')===-1 && venue.indexOf('.in')===-1) {
        transport.sendMail({
            from: user,
            to: email,
            subject: `Evaluation date and timing`,
            html: `<h2>Hello ${name}</h2>
            <p>Your evaluation will start from at ${date} on ${time} in ${venue}.</p>
            <p>Please stick to the timing.</p>
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
            <br>
            <h5>Regards</h5>
            <h5>${prof}</h5>`
        })
    }
}

module.exports.internalExaminer = (name, email, prof, date, time, venue, internal, external) => {
    if(venue.indexOf('.com')===-1 && venue.indexOf('.in')===-1) {
        transport.sendMail({
            from: user,
            to:email,
            subject: 'Internal Examiner of M.Tech Viva',
            html: `<h2>Hello ${internal}</h2>
            <p>${prof} has chosen you in the viva committee for ${name} as the internal examiner and ${external} as external examiner. The viva is at ${date} on ${time} in ${venue}.</p>
            <br>
            <h5>Regards</h5>`
        })
    }
    else {
        transport.sendMail({
            from: user,
            to:email,
            subject: 'Internal Examiner of M.Tech Viva',
            html: `<h2>Hello ${internal}</h2>
            <p>${prof} has chosen you in the viva committee for ${name} as the internal examiner and ${external} as external examiner. The viva is at ${date} on ${time} online at <a href=${venue}>Exam Link</a>.</p>
            <br>
            <h5>Regards</h5>`
        })
    }
}

module.exports.externalExaminer = (name, email, prof, date, time, venue, internal, external) => {
    if(venue.indexOf('.com')===-1 && venue.indexOf('.in')===-1) {
        transport.sendMail({
            from: user,
            to:email,
            subject: 'External Examiner of M.Tech Viva',
            html: `<h2>Hello ${external}</h2>
            <p>${prof} has chosen you in the viva committee for ${name} as the external examiner and ${internal} as internal examiner. The viva is at ${date} on ${time} at ${venue}.</p>
            <br>
            <h5>Regards</h5>`
        })
    }
    else {
        transport.sendMail({
            from: user,
            to:email,
            subject: 'External Examiner of M.Tech Viva',
            html: `<h2>Hello ${external}</h2>
            <p>${prof} has chosen you in the viva committee for ${name} as the external examiner and ${internal} as internal examiner. The viva is at ${date} on ${time} online at <a href=${venue}>Exam Link</a>.</p>
            <br>
            <h5>Regards</h5>`
        })
    }
}