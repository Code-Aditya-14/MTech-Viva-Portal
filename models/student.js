const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema(
    {
        name : {
            type: String,
            required: true
        },
        email: {
			type: String,
			required: true,
			unique: true
		},
        password: { 
			type: String, 
			required: true 
		},
        rollNo : {
            type: String,
            required: true,
            unique: true
        },
        department : {
            type: String,
            required: true
        },
        supervisor : {
            type: String 
        },
        title : {
            type : String 
        },
        internal : {
            type: String 
        },
        external : {
            type : String 
        },
        dateTime : {
            type : Date
        },
        venue : {
            type : String 
        }, 
        updated : {
            type : Boolean,
            default : false
        }
    },
    {
        collection : 'students'
    }
)

const model = mongoose.model('StudentSchema', StudentSchema)
module.exports = model