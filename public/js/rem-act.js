var confirmDelete = document.getElementById('delLiftBtn');
var actId = document.getElementById('hiddenActId');
var _csrf = document.getElementById('hiddenToken');

confirmDelete.addEventListener('click', () => {
    var url = './del-act'+actId.value.trim();
    var type = 'DELETE';

    var data = {};
    data['_csrf'] = _csrf.value;

    sendData(url, data, type)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
            }else if(res['success']){
                window.location.href = './';
            }else{
                console.log('unexpected server response');
            }
        })
        .catch(err => {
            console.log(err);
        });
});

async function sendData(url, data, t) {
    const response = await fetch(url, {
        method: t,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}