const http = require('http');
const fs = require('fs');
const WebApp = require('./webapp');

const PORT = 8000;

let registered_users = [{userName:'debarun'}];

let app = new WebApp();
let allComments;

let getAllComments = function(){
  fs.readFile('./data/comments.json',(err,data) =>{
    if(err){
      fs.writeFile('./data/comments.json','[\n]',(err) => {});
      allComments = [];
      return;
    }
    allComments = JSON.parse(data);
  });
}

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
  debugger;
  res.end();
}

let serveFile = function(req,res){
  let url = './public'+req.url;
  fs.readFile(url,(err,data) => {
    if(err){
      handleRequest(404,res,'Not Found');
      return;
    }
    res.setHeader('Content-Type',getContentHeader(url));
    handleRequest(200,res,data);
  });
}

app.get('/',(req,res)=>{
  res.redirect('/index.html');
});

app.get('/index.html',(req,res)=>{
  serveFile(req,res);
});

app.get('/abeliophyllum.html',(req,res)=>{
  serveFile(req,res);
});

app.get('/ageratum.html',(req,res)=>{
  serveFile(req,res);
});

app.get('/designs/index.css',(req,res)=>{
  serveFile(req,res);
});

app.get('/scripts/index.js',(req,res)=>{
  serveFile(req,res);
});

app.get('/img/freshorigins.jpg',(req,res)=>{
  serveFile(req,res);
});

app.get('/img/animated-flower-image-0021.gif',(req,res)=>{
  serveFile(req,res);
});

app.get('/designs/abeliophyllum.css',(req,res)=>{
  serveFile(req,res);
});

app.get('/img/pbase-Abeliophyllum.jpg',(req,res)=>{
  serveFile(req,res);
});

app.get('/designs/ageratum.css',(req,res)=>{
  serveFile(req,res);
});

app.get('/img/pbase-agerantum.jpg',(req,res)=>{
  serveFile(req,res);
});

app.get('/designs/guestbook.css',(req,res)=>{
  serveFile(req,res);
});

app.get('/docs/Ageratum.pdf',(req,res)=>{
  serveFile(req,res);
});

app.get('/docs/Abeliophyllum.pdf',(req,res)=>{
  serveFile(req,res);
});

app.get('/guestbook.html',(req,res)=>{
  let url = './public'+req.url;
  fs.readFile(url,(err,data) => {
    if(err){
      handleRequest(404,res,'Not Found');
      return;
    }
    let html = generateCommentHTML();
    data = data.toString('utf8').replace(`<div class="user_comments">`,html);
    res.setHeader('Content-Type','text/html');
    handleRequest(200,res,data);
  });
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
  res.redirect('/guestbook.html');
});

app.post('/login',(req,res)=>{
  let user = registered_users.find(u=>u.userName==req.body.userName);
  if(!user) {
    res.redirect('/login');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  res.redirect('/guestbook.html');
});

app.get('/logout',(req,res)=>{
  if(!req.user) {
    res.redirect('/login');
    return;
  }
  res.setHeader('Set-Cookie','');
  delete req.user.sessionid;
  res.redirect('/login');
});


app.use((req,res)=>{
  if(req.url=='/comment'&& req.user) parseData(req.body);
});

app.use((req,res)=>{
  let sessionid = req.Cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
});


let server = http.createServer((req,res)=>app.main(req,res));
server.listen(PORT);
getAllComments();
console.log(`Listening on ${PORT}`);
