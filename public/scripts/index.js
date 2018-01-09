const hideImage = function(){
  let image = document.getElementById('animation');
  image.style.visibility = 'hidden';
  let show = function(){
    image.style.visibility = 'visible';
  }
  setTimeout(show,1000);
}
