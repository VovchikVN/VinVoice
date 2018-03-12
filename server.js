let express = require('express');
let path = require('path');
let app = express();
let bodyParser = require('body-parser');
let fs = require('fs');
let mongoClient = require("mongodb").MongoClient;
let objectId = require("mongodb").ObjectID;
let Cookies = require( "cookies" );
let session = require('express-session');

var server = require('http').createServer(app);

var io = require('socket.io')(server);

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

app.use(session({
  secret: '2C44-4D44-WppQ38S',
  resave: true,
  saveUninitialized: true
}));

var url = "mongodb://localhost:27017/test";


// Authentication and Authorization Middleware
const auth = function(req, res, next) {
  if ( req.session && req.session.login)
    return next();
  else {
    return res.render('error');
  }

};

app.use(bodyParser.urlencoded({ extended: true }))

app.set('views', __dirname + '/template');
app.set('view engine', 'ejs');

app.use((req, res, next)=>{
	next();
});

app.use('/',express.static(path.join(__dirname, 'public')));


app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});



app.get('/adduser', function (req, res) {
  res.render('adduser',{
    title: 'Add user'
  });
});



app.get('/adduser', function (req, res) {
  res.render('adduser',{
  	title: 'Add user'
  });
});



app.get('/user/edit/:id', function (req, res) {

	var id = new objectId(req.params.id);
  mongoClient.connect(url, function(err, db){
    db.collection("users").findOne({_id: id}, function(err, user){
     
     console.log(user);
     if(err) return res.status(400).send();
     
     db.close();

     res.render('edituser',{
      title: 'Edit user',
      user,
    });
   });
  });
  
});


app.get('/user/delete/:id', function (req, res) {

	var id = new objectId(req.params.id);
  mongoClient.connect(url, function(err, db){
    db.collection("users").findOneAndDelete({_id: id}, function(err, result){
     
      if(err) return res.status(400).send();
      
            //var user = result.value;
            //res.send(user);
            db.close();
            res.redirect('/users');
          });
  });
});

app.post('/user/deleteajax/:id', function (req, res) {

	var id = new objectId(req.params.id);
  mongoClient.connect(url, function(err, db){
    db.collection("users").findOneAndDelete({_id: id}, function(err, result){
     
      if(err) return res.status(400).send();
      
      
      db.close();
      let result1 = {
       resalt: true
     };
     res.send(200, JSON.stringify(result1));
   });
  });
});

app.post('/user/edit/:id', function (req, res) {
 console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
 if(!req.body) return res.sendStatus(400);
 var id = new objectId(req.params.id);
 const {name, login, pass} = req.body;
 
 mongoClient.connect(url, function(err, db){
  db.collection("users").findOneAndUpdate({_id: id}, { $set: {name, login, pass}},
   {returnOriginal: false },function(err, result){
     
     console.log("result = ", result);
     if(err) return res.status(400).send();
     
     var user = result.value;
     db.close();
     res.redirect('/users');
   });
});

});


app.get('/users',auth, function (req, res) {
  


  mongoClient.connect(url, function(err, db){
    db.collection("users").find({}).toArray(function(err, users){
      res.render('allUser',{
        title: 'All user',
        data: users,
      });
      db.close();
    });
  });

});

app.get('/', function (req, res) {

  let login = req.session.login;
  let name = req.session.name;

  res.render('index',{
    login,
    name
  });
});

app.get('/chatt', function (req, res) {
 const name = req.session.user && req.session.user.login ? req.session.user.login : '';
 res.render('chatt',{
  name ,
});
 console.log(name);
});

app.post('/adduser', function (req, res) {

  

  if(!req.body) return res.sendStatus(400);
  
  const {name, login, pass} = req.body;
  var user = {name, login, pass};
  
  mongoClient.connect(url, function(err, db){
    db.collection("users").insertOne(user, function(err, result){
     
      if(err) return res.status(400).send();

      db.close();
      res.redirect('/');
    });
  });

});

app.post('/admin', function (req, res) {
  const {login, pass} = req.body;
  console.log(req.body);


  if(!req.body) return res.sendStatus(400);

  mongoClient.connect(url, function(err, db){
    db.collection("users").findOne({login, pass}, function(err, user){
     
      console.log(user);
      if(err) return res.status(400).send();
      
      if(user){
        var cookies = new Cookies( req, res); 
        req.session.login = user.login;
        req.session.name = user.name;
        req.session.admin = true;
      }
      res.redirect('/');
      db.close();
      db.close();
      console.log(req.session.login)
    });
  });
});


 // SERVER PART!!!
 app.use('/', express.static(path.join(__dirname, "public")));

 app.get('/login', function (req, res) {
   res.render('login');
 });


 server.listen(3000);
