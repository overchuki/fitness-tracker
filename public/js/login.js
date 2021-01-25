var mainForm = document.getElementById('mainForm');

var loginUsername = document.getElementById('logInUsername');
var loginPassword = document.getElementById('logInPassword');

var userError = document.getElementById('user-error');
var passError = document.getElementById('pass-error');

mainForm.addEventListener('submit', function(e){
    e.preventDefault();
    
    var url = "./login";
    
    var data = {};
    data['username'] = loginUsername.value.trim();
    data['password'] = loginPassword.value.trim();
    
    sendData(url,data)
        .then(res => {
            if(res['errors']){
                console.log(res);
                var errors = res['errors'];
                userError.innerHTML = errors['username'];
                passError.innerHTML = errors['password'];
            }else if(res['userId']){
                window.location.href = './';
            }else{
                console.log('Unexpected response: ', res);
            }
        })
        .catch(err => {
            console.log(err);
        });
});

async function sendData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}