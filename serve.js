const http = require('http');
const fs = require('fs');
const WebApp = require('./webapp');
const timeStamp = require('./time.js').timeStamp;
const PORT = 8080;

let toS = o=>JSON.stringify(o,null,2);
let registered_users = [{userName:'debarun'}];

let app = WebApp.create();
let allComments;

let logRequest = (req,res)=>{
  let text = ['------------------------------',
    `${timeStamp()}`,
    `${req.method} ${req.url}`,
    `HEADERS=> ${toS(req.headers)}`,
    `COOKIES=> ${toS(req.cookies)}`,
    `BODY=> ${toS(req.body)}`,''].join('\n');
  fs.appendFile('request.log',text,()=>{});
  console.log(`${req.method} ${req.url}`);
}

let getAllComments = function(){
  let data = fs.readFileSync('./data/comments.json','utf8');
  allComments = JSON.parse(data);
}

let loadUser = (req,res)=>{
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    console.log('Registering User');
    req.user = user;
    console.log(req.user);
  }
};

let header = {
  html: 'text/html',
  txt: 'text/plain',
  css: 'text/css',
  gif: 'image/gif',
  jpg: 'image/jpg',
  js: 'application/javascript',
  pdf: 'application/pdf'
}

let getContentHeader = function(filepath){
  let extension = filepath.split('.')[2];
  return header[extension]||header.txt;
}

let parseData = function(comment) {
  let date = new Date();
  comment.Date = date.toDateString()+' '+date.toLocaleTimeString();
  allComments.unshift(comment);
  let commentsJSON = JSON.stringify(allComments, null, 2);
  fs.writeFileSync('./data/comments.json', commentsJSON, 'utf8');
}

let generateCommentHTML = function(){
  let html = `<div class="user_comments">`;
  allComments.forEach(function(comment) {
    let fields = Object.keys(comment);
    for (let count = 0; count < fields.length; count++) {
      let currentField = fields[count];
      html += `<b>${currentField}:</b>${comment[currentField]}<br>`;
    }
    html += `<br>`;
  });
  return html;
}

let handleRequest = function(statusCode,res,dataToWrite){
  res.statusCode = statusCode;
  res.write(dataToWrite);
  res.end();
}

let determineContentForUser = function(req,data){
  if(!req.user){
    html = `<a href="/login">Log In</a>`;
    data = data.replace('<h2>','<h2>'+html);
    data = data.replace('<div class="submit_comment">','<div class="submit_comment" style="display:none">');
  }else{
    data = data.replace('<h2>',`<h2>USER: ${req.user.userName}`);
  }
  return data;
}

let serveFile = function(req,res){
  let url = './public'+req.url;
  if(fs.existsSync(url)){
    let data = fs.readFileSync(url);
    res.setHeader('Content-Type',getContentHeader(url));
    handleRequest(200,res,data);
    return;
  }
  handleRequest(404,res,'File Not Found!');
}

let redirectLoggedInUserToGuestbook = (req,res)=>{
  if(req.url=='/login' && req.user)
    res.redirect('/guestbook.html');
}

app.use(logRequest);
app.use(loadUser);
app.use(redirectLoggedInUserToGuestbook);

app.get('/',(req,res)=>{
  res.redirect('/index.html');
});

app.get('/guestbook.html',(req,res)=>{
  let url = './public'+req.url;
  let data = fs.readFileSync(url);
  let html = generateCommentHTML();
  data = data.toString('utf8').replace(`<div class="user_comments">`,html);
  data = determineContentForUser(req,data);
  res.setHeader('Content-Type','text/html');
  handleRequest(200,res,data);
});

app.post('/login',(req,res)=>{
  let user = registered_users.find(u=>u.userName==req.body.userName);
  if(!user) {
    res.setHeader('Set-Cookie',`logInFailed=true`);
    res.redirect('/login');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  res.redirect('/guestbook.html');
});

app.get('/login',(req,res)=>{
  if(req.user) {
    res.redirect('/guestbook.html');
    return;
  }
  res.setHeader('Content-type','text/html');
  res.write('Log In First for Comment<br><form method="POST"> <input name="userName"><input type="submit"></form>');
  res.end();
});

app.post('/comment',(req,res)=>{
  if(!req.user) {
    res.redirect('/login');
    return;
  }
  parseData(req.body);
  res.redirect('/guestbook.html');
});

app.get('/logout',(req,res)=>{
  res.setHeader('Set-Cookie',[`loginFailed=false,Expires=${new Date(1).toUTCString()}`,`sessionid=0,Expires=${new Date(1).toUTCString()}`]);
  delete req.user.sessionid;
  res.redirect('/index.html');
});

app.postProcess(serveFile);

getAllComments();

let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
