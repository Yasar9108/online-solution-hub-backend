const mongoose = require("mongoose");
require("dotenv").config();


function connectDb(){
    mongoose.connect(process.env.MONGOOSE_KEY).then(()=>{
        console.log("Database connected successfully")
    }).catch((err)=>{
        console.log("Database connection failed")
    })
}

module.exports = connectDb;