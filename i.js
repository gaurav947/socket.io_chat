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
      register.findOne({"_id":req.sender_id},function(err,result){
         if(result){
            socket.join(req.sender_id);
            io.sockets.in(req.sender_id).emit("join" , { status: 1 , message: "Sucessfully Joined."});
         }
         if(err)
         {
            io.sockets.in(req.sender_id).emit("join" , { status: 1 ,error:err,message: "Error while joining..Please check it is valid ID!!"});
         }
      })
      
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
         if(result && result.length)
         {
            console.log(result);  
            io.to(req.sender_id).emit('intialize_chat',{status:1, data:result,message: "Connection already established!!"});
         }
         else if(err)
         {
            console.log("first err=>",err);
            io.to(req.sender_id).emit('intialize_chat',{status:0, error:err,message: "Error while connection establishment!!"});
         }
         else
         {
            console.log("else");
            var data = {
               sender_id:req.sender_id,
               receiver_id:req.receiver_id
            }
         register.find({
               '_id': { $in: [
                   mongoose.Types.ObjectId(req.sender_id),
                   mongoose.Types.ObjectId(req.receiver_id), 
               ]}
         }, function(err1, docs){
            if(docs.length>1)
            {
               console.log("docs=>",docs.length);
               chat_s.create(data,function(er,result1){
                  console.log("result1 =>",result1);
                  if(result1)
                  {
                     console.log(result1);
                     chat_s.aggregate([
                        {
                           $match: 
                           {               
                              $or:[
                                 {sender_id:mongoose.Types.ObjectId(result1.sender_id),receiver_id:mongoose.Types.ObjectId(result1.receiver_id)},
                                 {sender_id:mongoose.Types.ObjectId(result1.receiver_id),receiver_id:mongoose.Types.ObjectId(result1.sender_id)}
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
                     ],function(e,r){
                        if(r)
                        {
                           console.log("user_Data=>",r)
                           io.to(req.sender_id).emit('intialize_chat',{status:1, data:r,message: "New Connection established!!"});
                        }
                        if(e)
                        {
                           io.to(req.sender_id).emit('intialize_chat',{status:0, Error:e,message: "Error while new connection establishment"});
                        }
                     });
   
                  }
                  if(er)
                  {
                     console.log("error=>",er);
                     io.to(req.sender_id).emit('intialize_chat',{status:0, Error:er,message: "Error while Creating  connection establishment"});
                  } 
               });
               }
            else if(docs.length==1||docs.length==0)
            {
               io.to(req.sender_id).emit('intialize_chat',{status:0,message: "users is not valid"});

            }
            if(err1)
            {
               io.to(req.sender_id).emit('intialize_chat',{status:0, Error:err1,message: "Error while finding users"});
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