var liftForm = document.getElementById('liftForm');

var addLiftName = document.getElementById('addLiftName');
var addLiftWeight = document.getElementById('addLiftWeight');
var addLiftReps = document.getElementById('addLiftReps');
var addLiftDate = document.getElementById('addLiftDate');
var addLiftUserId = document.getElementById('hiddenUserId');
var addLiftToken = document.getElementById('hiddenToken');
var addLiftLbRadio = document.getElementById('lbRadio');
var addLiftKgRadio = document.getElementById('kgRadio');

liftForm.addEventListener('submit', function(e){
    e.preventDefault();
    
    var url = './add-lift';
    var type = 'POST';
    var unit;
    if(addLiftLbRadio.checked){
        unit = 'lbs';
    }else if(addLiftKgRadio.checked){
        unit = 'kgs';
    }
    
    var data = {};
    data['name'] = addLiftName.value.trim();
    data['value'] = addLiftWeight.value.trim();
    data['reps'] = addLiftReps.value.trim();
    data['date'] = addLiftDate.value.trim();
    data['exType'] = 'lift';
    data['userId'] = addLiftUserId.value;
    data['unit'] = unit;
    data['_csrf'] = addLiftToken.value;
    
    sendData(url,data,type)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
            }else if(res['activity']){
                console.log(res['activity'].name, ' has been added to list');
                window.location.href = './get-lift'+res['activity']._id;
            }else{
                console.log('Unexpected response: ', res);
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