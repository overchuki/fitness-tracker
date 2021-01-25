var mainForm = document.getElementById('signup-form');

var createAccUsername = document.getElementById('createUsernameIn');
var createAccEmail = document.getElementById('createEmailIn');
var createAccPassOne = document.getElementById('createPasswordIn');
var createAccPassTwo = document.getElementById('createPasswordTwoIn');

var usernameError = document.getElementById('username-error');
var emailError = document.getElementById('email-error');
var passwordError = document.getElementById('password-error');

mainForm.addEventListener('submit', function(e){
    e.preventDefault();
    
    var e = createAccEmail.value.trim();
    var url = "./signup";
    
    var data = {};
    data['username'] = createAccUsername.value.trim();
    data['password'] = createAccPassOne.value.trim();
    if(e!=""){ data['email'] = e; }
    
    sendData(url,data)
        .then(res => {
            if(res['errors']){
                var errors = res['errors'];
                usernameError.innerHTML = errors['username'];
                emailError.innerHTML = errors['email'];
                passwordError.innerHTML = errors['password'];
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

createAccPassTwo.addEventListener('input', function(){
    var passV = verifyPass();
    createAccPassTwo.setCustomValidity(passV === 1 ? "" : "Passwords don't match.");
});

createAccUsername.addEventListener('input', function(){
    var userV = verifyField(createAccUsername.value);
    createAccUsername.setCustomValidity(userV === 1 ? "" : "Please remove spaces.");
});

function verifyField(f){
    var spaces = false;
    for(var i = 0;i<f.length;i++){
        if(f.charAt(i)===' '){
            return -1;
        }
    }
    return 1;
}

function verifyPass(){
    if(createAccPassOne.value === createAccPassTwo.value){
        return 1;
    }else{
        return -1;
    }
}