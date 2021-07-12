var mongoose = require('mongoose');
//const DB_URL = 'mongodb+srv://sun_user_23:sun_user_23@cluster0.cu4zq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect("mongodb://localhost:27017/Pass_it_on",{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log("Database Created of Pay_it_on in register_schema"))
.catch((err)=>console.log(err));

var register_schema = new mongoose.Schema({
    image:{type:String,default:"image/p2.png"},
    name:{type:String,minlength:6,required:true},
    email:{type:String,required:true,unique:true},
    college:{type:String,required:true},
    yop:{type:Number,min:2010,max:2025,required:true},
    roll_number:{type:Number,min:100000,unique:true,required:true},
    city:{type:String,required:true},
    password:{type:String,required:true},
    OTP:{type:String},
    status:{type:String,enum : [true,false]}
});
module.exports = mongoose.model("register",register_schema);