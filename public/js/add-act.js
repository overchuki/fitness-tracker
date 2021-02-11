var actForm = document.getElementById('actForm');

var addActName = document.getElementById('addActName');
var addActDate = document.getElementById('addActDate');
var addActUserId = document.getElementById('hiddenUserId');
var addActToken = document.getElementById('hiddenToken');
var exType = document.getElementById('exType');

actForm.addEventListener('submit', function(e){
    e.preventDefault();
    
    var url = './add-act';
    var type = 'POST';

    var data = {};
    data['name'] = addActName.value.trim();
    data['date'] = addActDate.value.trim();
    data['userId'] = addActUserId.value;
    data['_csrf'] = addActToken.value;

    switch(exType.value.trim()){
        case 'lift':
                data = constructLiftData(data);
                break;
            case 'bodyweight':
                throw Error('bodyweight not yet supported');
                break;
            case 'hrate':
                throw Error('heartrate not yet supported');
                break;
            case 'cardio':
                throw Error('cardio not yet supported');
                break;
            case 'bwex':
                throw Error('bodyweight exercises not yet supported');
                break;
            default:
                throw Error('Unrecongnized exercise type.');
    }

    console.log('sending data: ', data);
    
    sendData(url,data,type)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
            }else if(res['activity']){
                window.location.href = './get-act'+res['activity']._id;
            }else{
                console.log('Unexpected response: ', res);
            }
        })
        .catch(err => {
            console.log(err);
        });
});

const constructLiftData = (data) => {
    var addLiftWeight = document.getElementById('addLiftWeight');
    var addLiftReps = document.getElementById('addLiftReps');
    var addLiftLbRadio = document.getElementById('lbRadio');
    var addLiftKgRadio = document.getElementById('kgRadio');

    var unit;
    if(addLiftLbRadio.checked){
        unit = 'lbs';
    }else if(addLiftKgRadio.checked){
        unit = 'kgs';
    }

    data['value'] = addLiftWeight.value.trim();
    data['reps'] = addLiftReps.value.trim();
    data['exType'] = 'lift';
    data['unit'] = unit;

    return data;
}

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