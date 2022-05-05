const mongoose = require('mongoose')

const ProfSchema = new mongoose.Schema(
    {
        Name : {
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
        prog : {
            type: String, 
			required: true 
        },
        department : {
            type: String,
            required: true
        },
        studN : {
            type : [String]
        },
        studE : {
            type : [String]
        },
        studR : {
            type : [String]
        }
    }, 
    {
        collection: 'professors'
    }
)

const model = mongoose.model('ProfSchema', ProfSchema)
module.exports = model