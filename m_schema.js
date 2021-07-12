var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/Pass_it_on',{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log("Database initialized from message_schema"))
.catch((err)=>console.log("Error database from message"));

var m_s = new mongoose.Schema({
    chat_id:{type:mongoose.Types.ObjectId,ref:"chats"},
    sender_id:{type:mongoose.Types.ObjectId,ref:"register"},
    receiver_id:{type:mongoose.Types.ObjectId,ref:"register"},
    message:{type:String,required:true},
    date:{type:Date,default:Date.now}
});
module.exports = mongoose.model("message",m_s);