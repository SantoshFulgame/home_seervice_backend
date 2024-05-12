const mongoose=require('mongoose');

const dotenv = require("dotenv").config();

const username = encodeURIComponent(process.env.MONGODB_USERNAME);
const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
const dbName = "HomeService"; // Replace with your database name

const mongoDBURI = `mongodb+srv://${username}:${password}@santosh.yn2aanz.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);

const mongodb=async ()=>{
      await mongoose.connect(mongoDBURI,{useNewUrlParser:true},(err,res)=>{

        if(err){
            console.log(err.message);
        }else{
            console.log('connected to db');
            const fetched_data= mongoose.connection.db.collection('products');
            fetched_data.find({}).toArray((err,data)=>{
                   if(err) console.log(err);
                   else{
                    global.userD=data;
                   
                   } 
            })
        }

      })

}

module.exports=mongodb;