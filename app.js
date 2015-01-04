//require express module

//enabling CORS functionality (cross-origin resource sharing)
var cors = require('cors');

//setting the variable for the path
var path = require('path');



var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    //creating the socket funcionality
        //socket.io listens to any http server object
    io = require('socket.io').listen(server);
    //object to handle the users
    users = {};




//here we add to the path of all the static content
app.use(express.static(path.join(__dirname, '/public')));

server.listen(3000);

 app.use(cors());   //tell the app to use CORS


//create a route
    //parameters req -> request, res -> response
app.get('/', function(req, res){
    res.sendFile(__dirname + '/chat.html');
});

//to receive the event on the server side
//place the socket funcionality in the server side

io.sockets.on('connection', function(socket){
    //callback is used because we are sending data back to the client throug this function
    socket.on('new user', function(data, callback){
       //checking if the new username is already in our array
        if(data in users){
            callback(false); //this means that the username is in the array
        } else {
            callback(true);
            socket.nickname = data; //storing the nickname in the socket
            users[socket.nickname] = socket;
            updatesNicknames();
        }
    });

    function updatesNicknames(){
        io.sockets.emit('usernames', Object.keys(users));//for all the users update their list of nicknames
    }

    //send message function
    socket.on('send message', function(data, callback){
        var msg = data.trim(); //in case of empty spaces before de signal for private message and this becomes the message
        if(msg.substr(0,3) === '/p '){ //if the user types "/w "
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            if(ind !== -1){
                var name = msg.substring(0, ind);//the name where the whisper goes to
                var msg = msg.substring(ind +1);//the message of the whisper
                if(name in users){
                    users[name].emit('whisper', {msg: msg, nick: socket.nickname});
                    console.log('Whisper!');
                } else{
                    callback("Error! Enter a valid user!");
                }

            } else {
               callback("Error! Please enter a message for you to whisper!")
            }

        } else {
            //the message should go to all the users
            io.sockets.emit('new message', {msg: msg, nick: socket.nickname});//by adding the nickname variable to the socket makes it easy to call it if necessary
            //sends the message to all the users beside the one who send it
            //socket.broadcast.emit('new message', data);
        }

   });


    //eliminate users when they leave the chat
    socket.on('disconnect', function(data){
        if(!socket.nickname) return; //if the user goes to the login page and leaves without entering an username
        delete users[socket.nickname]; //removes user
        updatesNicknames(); //function to update nicknames
    });
});
