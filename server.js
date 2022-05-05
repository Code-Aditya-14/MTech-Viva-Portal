const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt=require('jsonwebtoken')
const Student = require('./models/student')
const Prof=require('./models/professor')
const csv = require('csvtojson')
const config=require('./config')
const nodemailer = require('./nodemailer.config')
const { user } = require('./config')

mongoose.connect('mongodb://localhost:27017/innovation-lab')

const JWT_SECRET=config.JWT_SECRET;

const app = express()
app.use('/', express.static(path.join(__dirname, 'static')))
app.use(bodyParser.json())

app.use('/studLogin', express.static(path.join(__dirname, 'static/studLogin.html')))
app.use('/profLogin', express.static(path.join(__dirname, 'static/profLogin.html')))
app.use('/stud', express.static(path.join(__dirname, 'static/stud.html')))
app.use('/prof', express.static(path.join(__dirname, 'static/prof.html')))
// app.use('/register', express.static(path.join(__dirname, 'static/register.html')))


app.post('/api/register', async (req, res) => {
    const { name, email, password: plainTextPassword, password: cpassword , rollNo, department } = req.body

	if (!name || typeof name !== 'string') {
		return res.json({ status: 'error', idx: '0', error: 'Invalid name' })
	}

    if (!email || typeof email !== 'string') {
		return res.json({ status: 'error', idx: '1', error: 'Invalid email' })
	}

    if (!rollNo || typeof rollNo !== 'string') {
		return res.json({ status: 'error', idx: '1', error: 'Invalid email' })
	}

    if (!department || typeof department !== 'string') {
		return res.json({ status: 'error', idx: '1', error: 'Invalid email' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', idx: '2', error: 'Invalid password' })
	}

    if(req.body.password!==req.body.cpassword)
    {
        return res.json({status: 'failed', idx: '3', error: 'password and confirm password did not match'})
    }

	if (plainTextPassword.length < 6) {
		return res.json({
			status: 'error',
			idx: '2',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	const password = await bcrypt.hash(plainTextPassword, 10)
    try {
        const response = await Student.create({
            name,
            email, 
            password,
            department,
            rollNo
        })
		console.log('User created successfully: ', response)
		// nodemailer.confirmationEmail(response.name, response.email, response.code);
		return res.json({status: 'ok', message: 'Registered successfully'})
    } catch (error) {
        if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 'error', idx : '1', error: 'Email already in use' })
		}
		else {
            console.log(error)
			return res.json({ status: 'error', idx : '4', error: 'An unknown error occured' })
		}
    }
})

app.post('/api/login', async (req, res) => {
	const { email, password } = req.body
	const user = await Student.findOne({ email }).lean()
	if(!email || typeof email !== 'string')
	{
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
	}
	if(!password || typeof password !== 'string')
	{
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
	}
	if (!user) {
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' })
	}
	
	if (await bcrypt.compare(password, user.password)) {
		// the email, password combination is successful
		
		const token = jwt.sign(
			{
				id: user._id,
				email: user.email,
				name: user.name,
				rollNo: user.rollNo,
				department: user.department
			},
			JWT_SECRET,
			{
			  expiresIn: 3600,
			},
		)
		console.log(token)
		return res.json({ status: 'ok', data: token })
	}
	res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
})

app.post('/api/login1', async (req, res) => {
	const { email, password } = req.body
	const user = await Prof.findOne({ email }).lean()
	if(!email || typeof email !== 'string')
	{
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
	}
	if(!password || typeof password !== 'string')
	{
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
	}
	if (!user) {
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
	}
	
	if (password===user.password) {
		// the email, password combination is successful
		
		const token = jwt.sign(
			{
				id: user._id,
				email: user.email,
				name: user.Name,
				department: user.department
			},
			JWT_SECRET,
			{
			  expiresIn: 3600,
			},
		)
		console.log(token);
		return res.json({ status: 'ok', data: token })
		
	}
	res.json({ status: 'error', idx: '1', error: 'Invalid email/password' })
})

app.post('/api/details', async (req, res) => {
	const { email, Supervisor, title } = req.body;
	const user=await Student.findOne({ email: email }).lean();
	if (!Supervisor || typeof Supervisor !== 'string') {
		return res.json({ status: 'failed', idx: '6', error: 'Select your supervisor' })
	}
	if(!title || typeof title !=='string')
	{
		return res.json({ status: 'failed', idx: '5', error: 'Invalid thesis title' })
	}
	if(!user)
	{
		return res.json({ status: 'failed', error: 'An error occured' });
	}
	const name=user.name;
	const rollNo=user.rollNo;
	try {
		await Student.updateOne({ 
			email 
		},
		{
			$set: {
				supervisor: Supervisor,
				title: title
			}
		});
		await Prof.updateOne(
			{ email: Supervisor },
			{
				$addToSet: {
					studN: name,
					studR: rollNo,
					studE: email
				} 
			}
		);
		const user1 = await Prof.findOne({ email: Supervisor }).lean();
		if(!user1) 
		{
			console.log('professor not found');
			return res.json({ status: 'failed', idx: '6', error: 'Invalid professor' })
		}
		nodemailer.supervisorReq(name, Supervisor, user1.Name);
		console.log(user1, Supervisor);
		res.json({ status : 'ok' })
	} catch (err) {
		res.json({ status : 'failed', error : 'An unknown error occured' });
	}
})

app.post('/api/reval', async (req, res) => {
	const token = req.body.token
	try {
		const user = jwt.verify(token, JWT_SECRET);
		const user1=await Student.findOne({ email: user.email }).lean();
		if(user1.supervisor) {
			const user2=await Prof.findOne({ email: user1.supervisor }).lean();
			res.json({ status: 'ok', name: user.name, email: user.email, dep: user.department, rollNo: user.rollNo, updated: user1.updated, supervisor: user1.supervisor, title: user1.title, profName: user2.Name });
		}
		else {
			res.json({ status: 'ok', name: user.name, email: user.email, dep: user.department, rollNo: user.rollNo, updated: user1.updated });
		}
	} catch {
		res.json({ status: 'error', error: 'An unknown error occured' })
	}
})

app.post('/api/reval1', async (req, res) => {
	const token = req.body.token
	try {
		const user = jwt.verify(token, JWT_SECRET)
		const dbuser=await Prof.findOne({ email: user.email }).lean();
		res.json({ status: 'ok', name: dbuser.Name, email: user.email, dep: user.department,  studN: dbuser.studN, studE: dbuser.studE, studR: dbuser.studR});
	} catch {
		res.json({ status: 'error', error: 'An unknown error occured' })
	}
})

app.post('/api/getStud', async (req, res) => {
	const email=req.body.email;
	if(!email || typeof email !== 'string')
	{
		return res.json({ status: 'failed', idx: '7', error: 'Select a student' });
	}
	try {
		const user = await Student.findOne({ email });
		if(!user) {
			return res.json({ status: 'failed', error: 'An unknown error occured' });
		}
		res.json({ status: 'ok', rollNo: user.rollNo, title: user.title });
	} catch {
		res.json({ status: 'failed', error: 'An unknown error occured' })
	}
})

app.post('/api/viva', async (req, res) => {
	const { roll, sup, internal, exter, timing, link } = req.body;
	if(!roll || typeof roll !== 'string')
	{
		return res.json({ status: 'failed', idx:'8', error: 'Invalid Roll No.' });
	}
	if(!internal || typeof internal !== 'string')
	{
		return res.json({ status: 'failed', idx: '10', error: 'Invalid internal examiner' });
	}
	if(!exter || typeof exter !== 'string')
	{
		return res.json({ status: 'failed', idx: '11', error: 'Invalid external examiner' });
	}
	const date1 = new Date(timing);
	const date2 = new Date();
	const exactDate = timing.substring(0, 10);
	const exactTime = timing.substring(11);
	if(!timing || date1<=date2)
	{
		return res.json({ status: 'failed', idx: '3', error: 'Invalid time for examination' });
	}
	if(!link || typeof link !== 'string')
	{
		return res.json({ status: 'failed', idx: '4', error: 'Invalid venue for examination' })
	}
	console.log(date1);
	try {
		const rese=await Student.updateOne(
			{
				rollNo: roll
			},
			{
				$set: {
					updated: true,
					internal: internal,
					external: exter,
					dateTime: timing,
					venue: link
				}
			}
		);
		if(rese.acknowledged === true) {
			const studentUser = await Student.findOne({ rollNo: roll });
			const profUser = await Prof.findOne({ email: sup });
			const intprof = await Prof.findOne({ email: internal });
			const extprof = await Prof.findOne({ email: exter });
			if(!studentUser || !profUser || !intprof || !extprof) {
				return res.json({ status: 'failed', error: 'Something went wrong' });
			}
			nodemailer.studEvalTiming(studentUser.name, sup, profUser.Name, exactDate, exactTime, link);
			nodemailer.internalExaminer(studentUser.name, internal, profUser.Name, exactDate, exactTime, link, intprof.Name, extprof.Name);
			nodemailer.externalExaminer(studentUser.name, exter, profUser.Name, exactDate, exactTime, link, intprof.Name, extprof.Name);
			return res.json({ status : 'ok' })
		} else {
			res.json({ status: 'failed', error: 'An error occured' });
		}
			
	} catch (error) {
		res.json({ status: 'failed', error: 'An error occured' })
	}
});

app.post('/api/ProfDetails', async (req, res) => {
	try {
		const profsDet = await csv().fromFile('./static/Fac1.csv');
		res.json({ status : 'ok', details : profsDet });
	} catch(error) {
		res.json({ status : 'failed', error : error });
	}
});

var port=process.env.PORT || 3000

app.listen(port, ()=> {
    console.log(`server at ${port}`)
})