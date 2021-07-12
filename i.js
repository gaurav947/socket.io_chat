var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var chat_s = require('./chat_schema.js')
var mongoose = require('mongoose')
var register = require('./register_schema');
var cors = require('cors');
app.use(cors());
var message = require('./m_schema.js');
io.on('connection',function(socket){
   console.log("Activated");
   socket.on('join', function (req) {
      socket.join(req.sender_id);
      io.sockets.in(req.sender_id).emit("join" , { status: 1 , message: "Sucessfully Joined."});
   });
   socket.on('intialize_chat',function(req){
      chat_s.aggregate([

         {
            $match: 
            {               
                  $or:[
                     {sender_id:mongoose.Types.ObjectId(req.sender_id),receiver_id:mongoose.Types.ObjectId(req.receiver_id)},
                     {sender_id:mongoose.Types.ObjectId(req.receiver_id),receiver_id:mongoose.Types.ObjectId(req.sender_id)}
                   ]
            }
      },
         {
            $lookup:{
               from:"registers",
               localField:"sender_id",
               foreignField:"_id",
               as:"sender"
            }
         },
         {
            $unwind:{
               path:"$sender"
            }
         },
         {
            $lookup:{
               from:"registers",
               localField:"receiver_id",
               foreignField:"_id",
               as:"receiver"
            }
         },
         {
            $unwind:{
               path:"$receiver"
            }
         },
         {
            $addFields:{
               name_sender:"$sender.name",
               image_sender:"$sender.image"
            }
         },
         {
            $addFields:{
               name_receiver:"$receiver.name",
               image_receiver:"$receiver.image"
            }
         },
         {
            $project:{
               sender:0,
               receiver:0
            }
         }
      ],function(err,result){
         console.log('result aggregate',result);
         if(result && result.length)
         {
            console.log(result);
            io.sockets.in(req.sender_id).emit("intialize_chat" , { status: 1 ,data:result,message: "Sucessfully Joined."});
            // io.sockets.in(req.receiver_id).emit('intialize_chat',{status:1, data:r,message: "chat initialized"});
            //io.sockets.in(req.sender_id).emit('intialize_chat',{status:1, data:r,message: "chat initialized"});
            socket.to(req.sender_id).emit("intialize_chat",{status:1, data:result,message: "Connection established!!"})
            io.to(req.sender_id).emit('intialize_chat',{status:1, data:result,message: "Connection established!!"});
            io.to(req.receiver_id).emit('intialize_chat',{status:1, data:result,message: "Connection established!!"});
         }
         else if(err)
         {
            io.socket.in(req.receiver_id).emit('intialize_chat',{data:'',error:'error'});
            io.socket.in(req.sender_id).emit('intialize_chat',{data:'',error:'error'})
         }
         else
         {
            var data = {
               sender_id:req.sender_id,
               receiver_id:req.receiver_id
            }
            chat_s.create(data,function(err,result){
               if(result)
               {
                     console.log("chat_id not same");
                     socket.emit("intialize_chat", {status:1, data:result,message: "chat initialized"});
                     io.sockets.in(req.receiver_id).emit('intialize_chat',{status:1, data:result,message: "Connection established!!"});
                     io.sockets.in(req.sender_id).emit('intialize_chat',{status:1, data:result,message: "Connection established!!"});        
                     socket.to(req.sender_id).emit("intialize_chat",{status:1, data:result,message: "Connection established!!"})
                     io.to(req.sender_id).emit('intialize_chat',{status:1, data:result,message: "Connection established!!"});
                     io.to(req.receiver_id).emit('intialize_chat',{status:1, data:result,message: "Connection established!!"});
                  }
               if(err)
               {
                  io.socket.in(req.receiver_id).emit('intialize_chat',{data:'',error:'error'});
                  io.socket.in(req.sender_id).emit('intialize_chat',{data:'',error:'error'});
               } 
            });
         }
      })
   })
   socket.on('send_message',function(req){
      message.create(req,function(err,res){
         if(res)
         {
            message.findOne({chat_id:req.chat_id}).sort([['date', -1]]).exec(function(err, result){
               if(result)
               {
                  socket.broadcast.emit("send_message", "world_new");
                  socket.broadcast.to(req.sender_id).emit("send_message",{status:1, data:result,message: "working sender"});
                  socket.broadcast.to(req.receiver_id).emit("send_message",{status:1, data:result,message: "working receiver"});
               }
               if(err)
               {
                  io.sockets.in(req.sender_id).emit('send_message',{status:1, data:result,message: "Connection established!!"});
                  io.sockets.in(req.receiver_id).emit('send_message',{status:1, data:err,message: "Connection established!!"});
               }
            })
         }
         else
         {
            socket.emit('send_message', {status: 0, message: "Error while sending message",error:err});
         }
      })
   })
   socket.on('Getall_message',function(info){
      message.find({"chat_id":info.chat_id},function(err,result){
         if(result)
         {
            socket.emit("Getall_message",{description:result});
         }
         else
         {
            socket.emit("Getall_message",{description:"Got an error"});
         }
      });
   });
   socket.on('Getall_chat',function(info){
      console.log("sender_id=",info.sender_id)
      var i = mongoose.Types.ObjectId(info.sender_id);
      chat_s.aggregate([
            {
               $match: { $expr:{ $or: [{$eq:["$sender_id",i]}, { $eq:["$receiver_id",i] }] }}
            },
            {
               $lookup:{
                  from:"registers",
                  localField:"sender_id",
                  foreignField:"_id",
                  as:"sender"
               }
            },
            {
               $unwind:{
                  path:"$sender"
               }
            },
            {
               $lookup:{
                  from:"registers",
                  localField:"receiver_id",
                  foreignField:"_id",
                  as:"receiver"
              }
            },
            {
            $unwind:{
               path:"$receiver"
               }
            },
            {
               $addFields:{
                  name_sender:"$sender.name",
                  image_sender:"$sender.image"
               }
            },
            {
               $addFields:{
                  name_receiver:"$receiver.name",
                  image_receiver:"$receiver.image"
               }
            },
            {
               $project:{
                  sender:0,
                  receiver:0
               }
            }
         ],function(err,result){
         if(result)
         {
            console.log("getall_chat",result);
            socket.emit("Getall_chat",{description:result});
            socket.to(info.sender_id).emit("Getall_chat",{status:1, data:result,message: "from getall chat established!!"})
            io.to(info.sender_id).emit('Getall_chat',{status:1, data:result,message: "from getall chat established!!"});
         }
         else
         {
            socket.emit("Getall_chat",{description:"Got an error"});
         }
      });
   });
});
const PORT = process.env.PORT || 5000
http.listen(PORT,function(){
   console.log("Activated 5000 ports")
});