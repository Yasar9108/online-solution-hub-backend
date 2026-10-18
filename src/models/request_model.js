const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
    },

    phoneNumber:{
        type:String,
        required:true
    },

    place:{
        type:String,
        required:true
    },

    requestType:{
        type:String,
        required:true
    },

    paymentStatus:{
        type:String,
        enum:["Pending","Accepted","Failed"],
        default:"Pending"
    },

    requestStatus:{
        type:String,
        enum:["pending","received","in-progress","completed","cancelled"],
        default:"pending"
    },
    whatsappSentAt: { type: Date, default: null },
    whatsappAttempts: { type: Number, default: 0 },
    createdAt:{
        type:Number,
        required:true,
    },

    modifiedAt:{
        type:Number,
        required:true,
    }
})

const requestModel = mongoose.model("Request", requestSchema);

module.exports = requestModel;