const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt=require('jsonwebtoken')
const Student = require('./models/student')
const Prof=require('./models/professor')
const Admin=require('./models/admin')
const csv = require('csvtojson')
const nodemailer = require('./nodemailer.config')
const fs=require('fs');
const { parse } = require('json2csv')
const { type } = require('express/lib/response')
require('dotenv').config()

const DB = process.env.DB
mongoose.connect(DB, {
	useNewUrlParser: true, 
	useUnifiedTopology: true
}).then(() => {
	console.log(`DB connection successful`);
}).catch((err) => console.log(err));

const JWT_SECRET=process.env.JWT_SECRET;

const app = express()
app.use(bodyParser.json())

//routes
app.use('/', express.static(path.join(__dirname, 'static')))
app.use('/studLogin', express.static(path.join(__dirname, 'static/student/studLogin.html')))
app.use('/profLogin', express.static(path.join(__dirname, 'static/prof/profLogin.html')))
app.use('/stud', express.static(path.join(__dirname, 'static/student/stud.html')))
app.use('/forgetStud', express.static(path.join(__dirname, 'static/student/forget-stud.html')))
app.use('/profs', express.static(path.join(__dirname, 'static/prof/prof.html')))
app.use('/forgetFaculty', express.static(path.join(__dirname, 'static/prof/forget-prof.html')))
app.use('/studProfile', express.static(path.join(__dirname, 'static/student/studProfile.html')))
app.use('/adminLogin', express.static(path.join(__dirname, 'static/adminLogin.html')))
app.use('/forgetAdmin', express.static(path.join(__dirname, 'static/forget-admin.html')))
app.use('/admin', express.static(path.join(__dirname, 'static/admin.html')))
app.use('/verify/:user/:code', express.static(path.join(__dirname, 'static/passwordchange.html')))
app.use('/addUsers', express.static(path.join(__dirname, 'static/addUser/adduser.html')))
app.use('/addstud', express.static(path.join(__dirname, 'static/addUser/addStud.html')))
app.use('/addfaculty', express.static(path.join(__dirname, 'static/addUser/addProf.html')))
app.use('/addadmin', express.static(path.join(__dirname, 'static/addUser/addAdmin.html')))
app.use('/updateUsers', express.static(path.join(__dirname, 'static/updateUser/updateUser.html')))
app.use('/updateStud', express.static(path.join(__dirname, 'static/updateUser/updateStud.html')))
app.use('/updateFaculty', express.static(path.join(__dirname, 'static/updateUser/updateFaculty.html')))
app.use('/updateMyInfo', express.static(path.join(__dirname, 'static/updateUser/updateInfo.html')))
app.use('/updateStudInfo', express.static(path.join(__dirname, 'static/updateUser/updateStudInfo.html')))
app.use('/expUserInfo', express.static(path.join(__dirname, 'static/expUserInfo.html')))
app.use('/delUsers', express.static(path.join(__dirname, 'static/delUser/delUser.html')))
app.use('/delStud', express.static(path.join(__dirname, 'static/delUser/delStud.html')))
app.use('/delFaculty', express.static(path.join(__dirname, 'static/delUser/delFaculty.html')))
app.use('/logout', express.static(path.join(__dirname, 'static/logout.html')))

function generateCode(len) 
{
	const val= "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
	var code=""
	for(var i=0; i<len; i++)
	{
		code+=val[Math.floor(Math.random() * val.length )];
	}
	return code;
}

//api
//register
app.post('/api/register', async (req, res) => {
    const { name, email, rollNo, department, prog, Name, type } = req.body

	if (!name || typeof name !== 'string') {
		return res.json({ status: 'error', idx: '1', error: 'Invalid name' })
	}

    if (!email || typeof email !== 'string') {
		return res.json({ status: 'error', idx: '4', error: 'Invalid email' })
	}

    if (!rollNo || typeof rollNo !== 'string') {
		return res.json({ status: 'error', idx: '2', error: 'Invalid Roll No.' })
	}

	if(!prog || typeof prog !== 'string') {
		return res.json({ status: 'error', idx: '2', error: 'Invalid Program' })
	}

    if (!department || typeof department !== 'string') {
		return res.json({ status: 'error', idx: '3', error: 'Invalid Department' })
	}

	const plainTextPassword = generateCode(8);

	if(!type || typeof type !== 'string') {
		return res.json({ status: 'error', idx: '6', error: 'Invalid Request' })
	}

	if (plainTextPassword.length < 6) {
		return res.json({
			status: 'error',
			idx: '5',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}
	var role;
	const password = await bcrypt.hash(plainTextPassword, 10)
    try {
		if(type === '1') {
			role='Student'
			const response = await Student.create({
				name,
				email, 
				password,
				department,
				rollNo
			})
			console.log('User created successfully: ', response)
		}
		else if(type === '2') {
			role = 'Faculty'
			const response = await Prof.create({
				Name,
				email, 
				password,
				department,
				prog
			})
			console.log('User created successfully: ', response)
		}
		else if(type === '3') {
			role = 'Admin'
			const response = await Admin.create({
				Name,
				email, 
				password
			})
			console.log('User created successfully: ', response)
		}
		else {
			return res.json({ status: 'failed', idx: '6', error: 'Invalid request' })
		}
		nodemailer.registered(Name, email, role, plainTextPassword)
		return res.json({status: 'ok', message: 'Registered successfully'})
    } catch (error) {
        if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 'error', idx : '4', error: 'Email already in use' })
		}
		else {
            console.log(error)
			return res.json({ status: 'error', idx : '6', error: 'An unknown error occured' })
		}
    }
})

//login
app.post('/api/login', async (req, res) => {
	const { email, password, type } = req.body
	if(!email || typeof email !== 'string')
	{
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
	}
	if(!password || typeof password !== 'string')
	{
		return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
	}
	if(type === '1')
	{
		const user = await Student.findOne({ email }).lean()
		if (!user) {
			return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' })
		}
	
		if (await bcrypt.compare(password, user.password)) {
		// the email, password combination is successful
		
			const token = jwt.sign(
				{
					id: user._id,
					email: user.email,
					name: user.name
				},
				JWT_SECRET,
				{
					expiresIn: 3600,
				},
			)
			console.log(token)
			return res.json({ status: 'ok', data: token })
		}
	}
	if(type === '2')
	{
		const user = await Prof.findOne({ email }).lean()
		if (!user) {
			return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' })
		}
	
		if (await bcrypt.compare(password, user.password)) {
		// the email, password combination is successful
		
			const token = jwt.sign(
				{
					id: user._id,
					email: user.email,
					name: user.Name
				},
				JWT_SECRET,
				{
				expiresIn: 3600,
				},
			)
			console.log(token)
			return res.json({ status: 'ok', data: token })
		}
	}
	if(type === '3')
	{
		const user = await Admin.findOne({ email }).lean()
		if (!user) {
			return res.json({ status: 'error', idx: '1', error: 'Invalid email/password' })
		}
	
		if (await bcrypt.compare(password, user.password)) {
		// the email, password combination is successful
		
			const token = jwt.sign(
				{
					id: user._id,
					email: user.email,
					name: user.Name
				},
				JWT_SECRET,
				{
					expiresIn: 3600,
				},
			)
			console.log(token)
			return res.json({ status: 'ok', data: token })
		}
	}
	else {
		return res.json({ status: 'failed', error: 'Invalid Request'})
	}
	res.json({ status: 'error', idx: '1', error: 'Invalid email/password' });
})

//forget password
//send email
app.post('/api/forget', async (req, res) => {
	const code = generateCode(20);
	const { email, type } = req.body
	try {
		if(type === '1')
		{
			const user1=await Student.findOne({ email })
			if(!user1)
			{
				return res.json({ status: 'failed', idx:'4', error: 'Invalid User' })
			}
			const result = await Student.updateOne(
				{ email },
				{
					$set: {
						code
					}
				}
			)
			if(result.acknowledged === true)
			{
				nodemailer.forgetPass(email, 'Stu', code)
				return res.json({ status : 'ok', msg: 'Mail send to the user' })
			}
			else
			{
				res.json({ status: 'failed', idx: '4', error: 'Invalid User' })
			}
		}
		else if(type === '2')
		{
			const user1=await Prof.findOne({ email })
			if(!user1)
			{
				return res.json({ status: 'failed', idx:'4', error: 'Invalid User' })
			}
			const result = await Prof.updateOne(
				{ email },
				{
					$set: {
						code
					}
				}
			)
			if(result.acknowledged === true)
			{
				nodemailer.forgetPass(email, 'Fac', code)
				return res.json({ status : 'ok', msg: 'Mail send to the user' })
			}
			else
			{
				res.json({ status: 'failed', idx:'4', error: 'Invalid User' })
			}
		}
		if(type === '3')
		{
			const user1=await Admin.findOne({ email })
			if(!user1)
			{
				return res.json({ status: 'failed', idx:'4', error: 'Invalid User' })
			}
			const result = await Admin.updateOne(
				{ email },
				{
					$set: {
						code
					}
				}
			)
			console.log(result)
			if(result.acknowledged === true)
			{
				nodemailer.forgetPass(email, 'Adm', code)
				return res.json({ status : 'ok', msg: 'Mail send to the user' })
			}
			else
			{
				res.json({ status: 'failed', idx:'4', error: 'Invalid User' })
			}
		}	
		else
		{
			res.json({ status: 'failed', error : 'Invalid Request' })
		}
	} catch (error) {
		res.json({ status: 'failed', error : 'Invalid Request' })
	}
})

app.post('/api/validate/:user/:code', async (req, res) => {
	const code = req.params.code
	const user = req.params.user
	try {
		if(user==='Stu')
		{
			const user1 = await Student.findOne({ code })
			if(user1)
			{
				return res.json({ status: 'ok' })
			}
		} 
		else if(user==='Fac')
		{
			const user1 = await Prof.findOne({ code })
			if(user1)
			{
				return res.json({ status: 'ok' })
			}
		} 
		else if(user==='Adm')
		{
			const user1 = await Admin.findOne({ code })
			if(user1)
			{
				return res.json({ status: 'ok' })
			}
		} 
		res.json({ status: 'failed', error: 'Invalid link for password change' })
	} catch {
		res.json({ status: 'failed', error: 'An unknown error occured' })
	}
})

//change password
app.post('/api/recoverpass/:user/:code', async (req, res) => {
	const code = req.params.code
	const user = req.params.user
	console.log(req.body)
	const { password: plainTextPassword, cpassword: cpassword } = req.body
	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', idx: '4', error: 'Invalid password format' })
	}

	if (plainTextPassword.length < 6) {
		return res.json({
			status: 'error',
			idx: '4',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	if(plainTextPassword!==cpassword)
	{
		return res.json({
			status: 'failed', 
			idx: '5',
			error: 'password and confirm password did not match'
		})
	}
	try {
		const password = await bcrypt.hash(plainTextPassword, 10)
		if(user==='Stu')
		{
			const result = await Student.updateOne(
				{ code }, 
				{
					$set: {
						code: '',
						password: password
					}
				}
			)
			if(result.acknowledged === true)
			{
				return res.json({ status: 'ok' })
			}
		}
		if(user==='Fac')
		{
			const result = await Prof.updateOne(
				{ code }, 
				{
					$set: {
						code: '',
						password: password
					}
				}
			)
			if(result.acknowledged === true)
			{
				return res.json({ status: 'ok' })
			}
		}
		if(user==='Adm')
		{
			const result = await Prof.updateOne(
				{ code }, 
				{
					$set: {
						code: '',
						password: password
					}
				}
			)
			if(result.acknowledged === true)
			{
				return res.json({ status: 'ok' })
			}
		}
		res.json({ status: 'failed', error: 'Invalid Link for password change' })
	} catch (error) {
		res.json({ status: 'failed', error: 'An unknown error occured' })
	}
})

//validate
app.post('/api/reval', async (req, res) => {
	const token = req.body.token
	const type = req.body.type
	try {
		if(type === '1') {
			const user = jwt.verify(token, JWT_SECRET);
			const user1=await Student.findOne({ email: user.email }).lean();
			if(user1.supervisor && user1.updated===false) {
				const user2=await Prof.findOne({ email: user1.supervisor }).lean();
				return res.json({ status: 'ok', name: user.name, email: user.email, dep: user1.department, rollNo: user1.rollNo, updated: user1.updated, supervisor: user1.supervisor, title: user1.title, profName: user2.Name });
			}
			else if(user1.updated===true)
			{
				const user2=await Prof.findOne({ email: user1.supervisor }).lean();
				return res.json({ status: 'ok', name: user.name, email: user.email, dep: user1.department, rollNo: user1.rollNo, updated: user1.updated, supervisor: user1.supervisor, title: user1.title, profName: user2.Name, timing: user1.dateTime, venue: user1.venue });
			}
			else {
				return res.json({ status: 'ok', name: user.name, email: user.email, dep: user1.department, rollNo: user1.rollNo, updated: user1.updated });
			}
		}
		else if(type === '2')
		{
			const user = jwt.verify(token, JWT_SECRET)
			const dbuser=await Prof.findOne({ email: user.email }).lean();
			console.log(dbuser)
			return res.json({ status: 'ok', name: dbuser.Name, email: user.email, dep: dbuser.department,  studN: dbuser.studN, studE: dbuser.studE, studR: dbuser.studR});
		}
		else if(type === '3')
		{
			const user = jwt.verify(token, JWT_SECRET)
			return res.json({ status: 'ok', name: user.Name, email: user.email});
		}
		else 
		{
			res.json({ status: 'failed', error : 'Invalid Request' })
		}
	} catch {
		res.json({ status: 'error', error: 'Invalid attempt to access the page' })
	}
})

// professor
app.post('/api/ProfDetails', async (req, res) => {
	try {
		const profsDet = await Prof.find({});
		res.json({ status : 'ok', details : profsDet });
	} catch(error) {
		res.json({ status : 'failed', error : error });
	}
});

// stud page
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
				$push: {
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
			return res.json({ status: 'failed', idx: '6', error: 'Please Select valid Supervisor' })
		}
		// nodemailer.supervisorReq(name, Supervisor, user1.Name);
		console.log(user1, Supervisor);
		res.json({ status : 'ok' })
	} catch (err) {
		res.json({ status : 'failed', error : 'An unknown error occured' });
	}
})

//prof page
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
		res.json({ status: 'ok', rollNo: user.rollNo, title: user.title, isUpdated : user.updated });
	} catch {
		res.json({ status: 'failed', error: 'An unknown error occured' })
	}
});

// navbar prof
app.get('/expProf', async (req, res) => {
	Prof.find({}, {_id: 0}, (err, post) => {
	
		const fields = ['Name', 'Date', 'Time(in GMT)', 'Venue'];
		const opts = { fields };
		var data = [];
		for(var i=0; i<post.length; i++)
		{
			var len=post[i].Timing.length;
			if(post[i].Timing.length==0)
			{
				data.push({
					'Name' : post[i].Name,
					'Date': 'N/A',
					'Time(in GMT)': 'N/A',
					'Venue': 'N/A'
				})
			}
			else
			{
				for(var j=0; j<len; j++)
				{
					const date = (post[i].Timing[j]).substring(0, 10);
					const time = (post[i].Timing[j]).substring(11);
					if(j===0) {
						data.push({
							'Name' : post[i].Name,
							'Date': date,
							'Time(in GMT)' : time,
							'Venue' : post[i].Venue[j]
						})
					}
					else {
						data.push({
							'Name' : '',
							'Date': date,
							'Time(in GMT)' : time,
							'Venue' : post[i].Venue[j]
						})
					}
				}
			}
		}
		console.log(data);
		try {
			const csv =parse(data, opts);
			fs.writeFile('allProf.csv', csv, function(err) {
				if(err) throw err;
				console.log("Success");
				res.download('./allProf.csv');
			})
		} catch (error) {
			console.log(error);
		}
	});
})

app.post('/api/expSin', async (req, res) => {
	const email = req.body.email;
	Prof.findOne({ email: email }, {_id: 0}, (err, post) => {
		console.log(post);
		const fields = ['Name', 'Date', 'Time(in GMT)', 'Venue'];
		const opts = { fields };
		var data = [];
		if(!post)
		{
			return res.json({ status : 'failed' });
		}
		for(var i=0; i<post.Timing.length; i++)
		{
			const date = (post.Timing[i]).substring(0, 10);
			const time = (post.Timing[i]).substring(11);
			if(i===0) {
				data.push({
					'Name': post.Name,
					'Date': date,
					'Time(in GMT)': time,
					'Venue': post.Venue[i]
				})
			}
			else {
				data.push({
					'Name': '',
					'Date': date,
					'Time(in GMT)': time,
					'Venue': post.Venue[i]
				})
			}
		}
		if(post.Timing.length===0)
		{
			data.push({
				'Name': post.Name,
				'Date': 'N/A',
				'Time': 'N/A',
				'Venue': 'N/A'
			})
		}
		try {
			const csv =parse(data, opts);
			fs.writeFile('detail.csv', csv, function(err) {
				if(err) throw err;
				console.log("Success");
				res.json({ status: 'ok' })
			})
		} catch (error) {
			return res.json({ status: 'failed' })
			console.log(error);
		}
	});
})

app.get('/mySchedule', async (req, res) => {
	try {
		res.download('./detail.csv');
	} catch (err) {
		res.json({ status: 'failed' });
	}
})

// prof page 
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
	const exactT = timing.substring(11, 14);
	if(!timing || date1-date2<=0)
	{
		return res.json({ status: 'failed', idx: '3', error: 'Invalid time for examination' });
	}
	if(parseInt(exactT)<9 || parseInt(exactT)>17)
	{
		return res.json({ status: 'failed', idx: '3', error: 'Timing should be between 9AM and 5PM' })
	}
	if(!link || typeof link !== 'string')
	{
		return res.json({ status: 'failed', idx: '4', error: 'Invalid venue for examination' })
	}
	console.log(timing);
	try {
		const user1=await Prof.findOne({ email: internal });
		const user2=await Prof.findOne({ email: exter });
		console.log(user1, user2);
		if(user1.Timing) 
		{
			for(var i=0; i<(user1.Timing).length; i++)
			{
				const timedif = Math.abs(user1.Timing[i]-timing);
				console.log(timedif);
				if(timedif<1000*60*60)
				{
					return res.json({ status: 'failed', idx: '10', error: 'The faculty is busy with some other exam on given time' });
				}
			}
		}
		if(user2.Timing) 
		{
			for(var i=0; i<(user2.Timing).length; i++)
			{
				const time1=new Date(user1.Timing[i]);
				const time2=new Date(timing);
				const timedif = Math.abs(time1-time2);
				console.log(timedif);
				if(timedif<1000*60*60)
				{
					return res.json({ status: 'failed', idx: '10', error: 'The faculty is busy with some other exam on given time' });
				}
			}
		}
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
		const result=await Prof.updateOne(
			{
				email: internal
			}, 
			{
				$push: {
					Timing: timing,
					Venue: link
				}
			}
		);
		const result1=await Prof.updateOne(
			{
				email: exter
			}, 
			{
				$push: {
					Timing: timing,
					Venue: link
				}
			}
		);
		if(rese.acknowledged === true && result.acknowledged===true && result1.acknowledged===true) {
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

//update student
app.post('/api/updateStud', async (req, res) => {
	var { email, name, rollNo, department, Supervisor, title, internal, external, timing, venue } = req.body
	console.log(req.body);
	if(!email || typeof email !== 'string')
	{
		return res.json({ status: 'error', idx: '4', error: 'Invalid email' });
	}
	try {
		const user = await Student.findOne({ email }).lean()
		if(!user) 
		{
			return res.json({ status: 'error', idx: '4', error: 'Invalid email' });
		}
		if(Supervisor && typeof Supervisor === 'string')
		{
			const user1 = await Prof.findOne({ email: Supervisor })
			nodemailer.supervisorReq(user.name, Supervisor, user1.Name)
		}
		if(timing)
		{
			const date1 = new Date(timing);
			const date2 = new Date();
			const exactT = timing.substring(11, 14);
			if(!timing || date1-date2<=0)
			{
				return res.json({ status: 'failed', idx: '3', error: 'Invalid time for examination' });
			}
			if(parseInt(exactT)<9 || parseInt(exactT)>17)
			{
				return res.json({ status: 'failed', idx: '3', error: 'Timing should be between 9AM and 5PM' })
			}
		}
		if(!name || typeof name !== 'string')
		{
			name=user.name
		}
		if(!rollNo || typeof rollNo !== 'string')
		{
			rollNo=user.rollNo
		}
		if(!department || typeof department !== 'string')
		{
			department=user.department
		}
		// || (Supervisor && typeof Supervisor === 'string') || (title && typeof title === 'string')
		if(!user.supervisor)
		{
			nodemailer.updated(name, email)
			const _user = await Student.updateOne(
				{ email },
				{
					$set : {
						name,
						rollNo,
						department
					}
				}
			)
			return res.json({ status: 'ok', msg: 'details updated successfully' })
		}
		if(!Supervisor || typeof Supervisor !== 'string')
		{
			Supervisor=user.supervisor
		}
		else if(user.supervisor)
		{
			nodemailer.supChange(name, email)	
			const sup=await Prof.updateOne(
				{ email: user.supervisor },
				{
					$pull: {
						studE: user.email,
						studN: user.name,
						studR: user.rollNo
					}
				}
			)
		}
		if(!title || typeof title !== 'string')
		{
			title=user.title
		}
		if(!user.internal)
		{
			const _user = await Student.updateOne(
				{ email },
				{
					$set : {
						name,
						rollNo,
						department,
						supervisor: Supervisor,
						title
					}
				}
			)	
			return res.json({ status: 'ok', msg: 'details updated successfully' })
		}
		if((internal && typeof internal === 'string') || (external && typeof external === 'string'))
		{
			const user2=await Prof.findOne({ email: Supervisor })
			const user3=await Prof.findOne({ email: internal });
			const user4=await Prof.findOne({ email: external })
			nodemailer.ExaminerNew(name, internal, external, user2.Name, user3.Name, user4.Name)
		}
		if(!internal || typeof internal !== 'string')
		{
			internal=user.internal
		}
		else if(user.internal)
		{
			const inter = await Prof.updateOne(
				{ email: user.internal },
				{
					$pull: {
						Timing: user.dateTime,
						Venue: user.venue
					}
				}
			)
		}
		if(!external || typeof external !== 'string') 
		{
			external=user.external
		}
		else if(user.internal)
		{
			const exter = await Prof.updateOne(
				{ email: user.external },
				{
					$pull: {
						Timing: user.dateTime,
						Venue: user.venue
					}
				}
			)
		}
		if(!timing) {
			timing=user.dateTime
		}
		else if(user.internal)
		{
			const inter = await Prof.updateOne(
				{ email: user.internal },
				{
					$pull: {
						Timing: user.dateTime,
						Venue: user.venue
					}
				}
			)
			const exter = await Prof.updateOne(
				{ email: user.external },
				{
					$pull: {
						Timing: user.dateTime,
						Venue: user.venue
					}
				}
			)
		}
		if(!venue || typeof venue !== 'string')
		{
			venue=user.venue
		}
		else if(user.internal)
		{
			const inter = await Prof.updateOne(
				{ email: user.internal },
				{
					$pull: {
						Timing: user.dateTime,
						Venue: user.venue
					}
				}
			)
			const exter = await Prof.updateOne(
				{ email: user.external },
				{
					$pull: {
						Timing: user.dateTime,
						Venue: user.venue
					}
				}
			)
		}
		const exactDate = timing.substring(0, 10);
		const exactTime = timing.substring(11);
		const _user = await Student.updateOne(
			{ email },
			{
				$set : {
					name,
					rollNo,
					department,
					supervisor: Supervisor,
					title,
					internal,
					external,
					dateTime: timing,
					venue
				}
			}
		)
		const user5=await Prof.findOne({ email: Supervisor })
		const user6=await Prof.findOne({ email: internal })
		const user7=await Prof.findOne({ email: external })
		nodemailer.studEvalTiming(name, email, user5.Name, exactDate, exactTime, venue);
		nodemailer.newExamSchedule(name, Supervisor, internal, external, user5.Name, user6.Name, user7.Name, exactDate, exactTime, venue)
		res.json({ status: 'ok', msg: 'details updated successfully' })
	} catch {
		res.json({ status: 'failed', error: 'An unknown error occured' })
	}
})

//update faculty and admin
app.post('/api/updateOther', async (req, res) => {
	var { email, Name, prog, password: Plainpassword, department, type } = req.body
	if(!email || typeof email !== 'string')
	{
		return res.json({ status: 'error', idx: '4', error: 'Invalid email' });
	}
	try {
		if(type === '1')
		{
			const user = await Prof.findOne({ email }).lean();
			if(!user)
			{
				return res.json({ status: 'failed', idx: '4', error: 'Invalid User' })
			}
			if(Name && typeof Name === 'string')
			{
				await Prof.updateOne(
					{ email },
					{
						$set: { Name }
					}
				)
			}
			if(prog && typeof prog === 'string')
			{
				await Prof.updateOne(
					{ email },
					{
						$set: { prog }
					}
				)
			}
			if(department && typeof department === 'string')
			{
				await Prof.updateOne(
					{ email },
					{
						$set: { department }
					}
				)
			}
			if(!Name || typeof Name !== 'string')
			{
				const user1=await Prof.findOne({ email });
				Name = user1.Name
			}
			nodemailer.updated(Name, email)
			res.json({ status: 'ok', msg: 'Details Updated Successfully' })
		}
		else if(type === '2')
		{
			const user = await Admin.findOne({ email });
			if(!user)
			{
				return res.json({ status: 'failed', error: 'An unknown error occured' })
			}
			if(Name && typeof Name === 'string')
			{
				await Admin.updateOne(
					{ email },
					{
						$set: { Name }
					}
				)
			}
			if(Plainpassword && typeof Plainpassword === 'string')
			{
				const password = await bcrypt.hash(Plainpassword, 10);
				await Admin.updateOne(
					{ email },
					{
						$set: { password }
					}
				)
			}
			res.json({ status: 'ok', msg: 'Details Updated Successfully' })
		}
	} catch {
		res.json({ status: 'failed', error : 'An Unknown error occured' })
	}
})

// export tab
app.get('/expstud', async (req, res) => {
	Student.find({}, {_id: 0}, (err, post) => {
	
		const fields = ['name', 'email', 'rollNo', 'department', 'supervisor', 'title', 'internal', 'external', 'Date', 'Time(in GMT)', 'venue'];
		const opts = { fields };
		var data = [];
		console.log(post.length)
		for(var i=0; i<post.length; i++)
		{
			if(!post[i].supervisor)
			{
				data.push({
					'name': post[i].name,
					'email': post[i].email,
					'rollNo': post[i].rollNo,
					'department': post[i].department,
					'supervisor': 'N/A',
					'title': 'N/A',
					'internal': 'N/A',
					'external': 'N/A',
					'Date': 'N/A',
					'Time(in GMT)': 'N/A',
					'venue': 'N/A'
				})
			}
			else if(!post[i].internal)
			{
				data.push({
					'name': post[i].name,
					'email': post[i].email,
					'rollNo': post[i].rollNo,
					'department': post[i].department,
					'supervisor': post[i].supervisor,
					'title': post[i].title,
					'internal': 'N/A',
					'external': 'N/A',
					'Date': 'N/A',
					'Time(in GMT)': 'N/A',
					'venue': 'N/A'
				})
			}
			else
			{
				const date = (post[i].Timing).substring(0, 10);
				const time = (post[i].Timing).substring(11);
				data.push({
					'name': post[i].name,
					'email': post[i].email,
					'rollNo': post[i].rollNo,
					'department': post[i].department,
					'supervisor': post[i].supervisor,
					'title': post[i].title,
					'internal': post[i].internal,
					'external': post[i].external,
					'Date': date,
					'Time(in GMT)': time,
					'venue': post[i].venue
				})
			}
		}
		console.log(data);
		try {
			const csv =parse(data, opts);
			fs.writeFile('allStud.csv', csv, function(err) {
				if(err) throw err;
				console.log("Success");
				res.download('./allStud.csv');
			})
		} catch (error) {
			console.log(error);
		}
	});
})

app.get('/expAllStudFac', async (req, res) => {
	Prof.find({}, {_id: 0}, (err, post) => {
	
		const fields = ['Name', 'email', 'program', 'department', 'Student Name', 'Student Email', 'Student Roll No.'];
		const opts = { fields };
		var data = [];
		for(var i=0; i<post.length; i++)
		{
			var len=post[i].studE.length;
			if(post[i].studE.length===0)
			{
				data.push({
					'Name' : post[i].Name,
					'email': post[i].email,
					'program': post[i].prog,
					'department': post[i].department,
					'Student Name': 'N/A',
					'Student Email': 'N/A',
					'Student Roll No.': 'N/A'
				})
			}
			else
			{
				for(var j=0; j<len; j++)
				{
					if(j===0) {
						data.push({
							'Name' : post[i].Name,
							'email': post[i].email,
							'program': post[i].prog,
							'department': post[i].department,
							'Student Name': post[i].studN[j],
							'Student Email': post[i].studE[j],
							'Student Roll No.': post[i].studR[j]
						})
					}
					else {
						data.push({
							'Name' : '',
							'email': '',
							'program': '',
							'department': '',
							'Student Name': post[i].studN[j],
							'Student Email': post[i].studE[j],
							'Student Roll No.': post[i].studR[j]
						})
					}
				}
			}
		}
		console.log(data);
		try {
			const csv =parse(data, opts);
			fs.writeFile('ProfStud.csv', csv, function(err) {
				if(err) throw err;
				console.log("Success");
				res.download('./ProfStud.csv');
			})
		} catch (error) {
			console.log(error);
		}
	});
})

app.get('/expFacSchedule', async (req, res) => {
	Prof.find({}, {_id: 0}, (err, post) => {
	
		const fields = ['Name', 'email', 'program', 'department', 'Date', 'Time(in GMT)', 'Venue'];
		const opts = { fields };
		var data = [];
		for(var i=0; i<post.length; i++)
		{
			var len=post[i].Timing.length;
			if(post[i].Timing.length===0)
			{
				data.push({
					'Name' : post[i].Name,
					'email': post[i].email,
					'program': post[i].prog,
					'department': post[i].department,
					'Date': 'N/A',
					'Time(in GMT)': 'N/A',
					'Venue': 'N/A'
				})
			}
			else
			{
				for(var j=0; j<len; j++)
				{
					const date = (post[i].Timing[j]).substring(0, 10);
					const time = (post[i].Timing[j]).substring(11);
					if(j===0) {
						data.push({
							'Name' : post[i].Name,
							'email': post[i].email,
							'program': post[i].prog,
							'department': post[i].department,
							'Date': date,
							'Time(in GMT)': time,
							'Venue': post[i].Venue[j]
						})
					}
					else {
						data.push({
							'Name' : '',
							'email': '',
							'program': '',
							'department': '',
							'Date': date,
							'Time(in GMT)': time,
							'Venue': post[i].Venue[j]
						})
					}
				}
			}
		}
		console.log(data);
		try {
			const csv =parse(data, opts);
			fs.writeFile('ProfSchedule.csv', csv, function(err) {
				if(err) throw err;
				console.log("Success");
				res.download('./ProfSchedule.csv');
			})
		} catch (error) {
			console.log(error);
		}
	});
})

// delete user
app.post('/api/delUser', async (req, res) => {
	const email = req.body.email
	const type = req.body.type
	var name;
	try {
		if(type === '1')
		{
			const _user = await Student.findOne({ email })
			name=_user.name
			if(!_user) {
				return res.json({ status: 'failed', idx: '4', error: 'Invalid Email' })
			}
			const user = await Student.deleteOne({ email })
		}
		else if(type === '2')
		{
			const _user = await Prof.findOne({ email })
			name=_user.Name
			if(!_user) {
				return res.json({ status: 'failed', idx: '4', error: 'Invalid Email' })
			}
			const user = await Prof.deleteOne({ email })
		}
		else if(type === '3')
		{
			const user = await Admin.find({});
			if(user.length === 1)
			{
				return res.json({ status : 'failed', idx: '1', error: 'Your account cannot be deleted as atleast one admin should be there' })
			}
			const user1=await Admin.findOne({ email });
			name = user1.Name
			const _user = await Admin.deleteOne({ email })
		}	
		nodemailer.deleted(name, email)
		res.json({ status: 'ok', msg: 'User deleted Successfully' })
	} catch (error) {
		res.json({ status: 'failed', idx: '4', error: 'Invalid Email' })
	}
})

var port=process.env.PORT || 3000

app.listen(port, ()=> {
    console.log(`Server at ${port}`)
})