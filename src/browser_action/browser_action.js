document.getElementById('login').onclick = function() {
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;

  chrome.extension.sendMessage({
    type: 'login',
    username: username,
    password: password
  }, function(response) {
    alert('Success');
  })
}

