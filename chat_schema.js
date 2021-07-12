var mongoose  = require('mongoose');
const DB_URL = 'mongodb+srv://sun_user_23:sun_user_23@cluster0.cu4zq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log("Database initialize from chat_schema"))
.catch((err)=>console.log("Error occur while initialize...."));

var  c_schema = mongoose.Schema({
    sender_id:{type:mongoose.Types.ObjectId,ref:"register"},
    receiver_id:{type:mongoose.Types.ObjectId,ref:"register"}
});
module.exports = mongoose.model('chat',c_schema);