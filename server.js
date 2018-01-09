const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const PORT = 8000;

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

let parseData = function(parameters) {
  let comment = querystring.parse(parameters);
  let date = new Date();
  comment.Date = date.toLocaleString();
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

let handleComment = function(req,res){
  req.on('data',function(parameters){
    parseData(parameters.toString());
  });
  res.writeHead(302,{'Location':'/guestbook.html'});
}

let handleGuestBook = function(req,data){
  if(req.url=='/guestbook.html'){
    let html = generateCommentHTML();
    data = data.toString('utf8').replace(`<div class="user_comments">`,html);
  }
  return data;
}

let onRequest = function(req,res){
  let url = './public'+req.url;
  if(req.url=='/'){
    url+='index.html';
  }

  if(req.url=='/comment'){
    handleComment(req,res);
  }

  fs.readFile(url,(err,data) => {
    if(err){
      handleRequest(404,res,'Not Found');
      return;
    }
    data = handleGuestBook(req,data);
    res.setHeader('Content-Type',getContentHeader(url));
    handleRequest(200,res,data);
  });
  console.log(`[${new Date().toLocaleString()}] "${req.method} ${req.url}" ${res.statusCode} -`);
}

const server = http.createServer(onRequest);
server.listen(PORT);
getAllComments();
console.log(`Listening at ${PORT}\n`);
