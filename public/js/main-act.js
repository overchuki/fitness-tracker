var entryForm = document.getElementById('entryForm');
var addEntryToken = document.getElementById('hiddenToken').value.trim();
var addEntryError = document.getElementById('add-entry-err-message');
var activityId = document.getElementById('hiddenActId').value.trim();
var exTypeStr = document.getElementById('exType').value.trim();

//move to classes
var addEntryWeight = document.getElementById('addEntryWeight');
var addEntryReps = document.getElementById('addEntryReps');
var addEntryDate = document.getElementById('addEntryDate');

var chart;
var ctx = document.getElementById('chartDiv').getContext('2d');
var timeFormat = 'YYYY-MM-DD';
var config;
var gridLineColor = '#2b2b2c';
var ActivityObject;

var vals;
var unit;
var stepArr = [0];
var dispArr;

onload = () => {
    createPlateArray();

    var url = './get-vals'+activityId;

    getData(url)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
            }else if(res['vals']){
                vals = res['vals'];
                unit = res['unit'];
                ActivityObject = new ActivityFront(exTypeStr, res['cache']);
                verifyData();
            }else{
                console.log('Unexpected response: ', res);
            }
        })
        .catch(err => {
            console.log('logging error:')
            console.log(err);
        });
}

//main class func
// function verifyData(){
//     localStorage.setItem('vals', JSON.stringify(vals));
//     localStorage.setItem('unit', unit);

//     createPlateArray(theomax);
    
//     var { minVal, maxVal, step } = configureTicks();
//     dispArr = createDispArr(vals);
    
//     setConfig(unit, minVal, maxVal, step, dispArr);
//     makeChart();
// }

//act class func
function createPlateArray(max){
    let cur = plateArr[plateArr.length-1];
    while(max+11>cur){
        cur += 45;
        plateArr.push(cur);
    }
}

//act func
function roundTo45(val, r){
    for(var i = 1;i<plateArr.length;i++){
        if(plateArr[i]>val){
            if(r){
                return plateArr[i];
            }else{
                return plateArr[i-1];
            }
        }
    }
}

//act class func
function configureTicks(){
    let min = theomin-10;
    let max = theomax+10;
    if(min<0){ min = 0; }
    let minVal = roundTo45(min, false);
    let maxVal = roundTo45(max, true);
    let diff = maxVal - minVal;
    let step = diff/9;
    return { minVal, maxVal, step };
}

//act class func
function createDispArr(v){
    let result = [];
    for(var i = 0;i<v.length;i++){
        let cur = v[i];
        let w = Math.round(cur.weight);
        result.push({ x: cur.date, y: cur.theomax, nested: { weight: w, reps: cur.reps } });
    }
    return result;
}

class ActivityFront {
    constructor(exType, cache){
        this.exType = exType;
        this.cache = cache;
        this.assignActivity();
    }

    verifyData(){

        this.actObj.createStepArray();
        
        //var { minVal, maxVal, step } = this.actObj.configureTicks();
        //dispArr = this.actObj.createDispArr(vals);
        
        //setConfig(unit, minVal, maxVal, step, dispArr);
        makeChart();
    }

    assignActivity(){
        switch(this.exType){
            case 'lift':
                this.actObj = new LiftObj(this.cache);
                break;
            case 'bodyweight':
                //
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
                throw Error('Unrecongnized exercise type, frontend error.');
        }
    }
}

class LiftObj extends ActivityFront {
    constructor(vals, cache){
        this.cache = cache;
        this.graphMax = this.cache.graphBounds.max;
        this.graphMin = this.cache.graphBounds.min;
        this.info = this.cache.info;
    }

    displayInfo(){

    }

    createStepArray(){
        let cur = stepArr[0];
        while(this.graphMax)

        let cur = plateArr[plateArr.length-1];
        while(max+11>cur){
            cur += 45;
            plateArr.push(cur);
        }
    }

    configureTicks(){

    }

    createDispArr(){

    }
}

function makeChart(){
    Chart.platform.disableCSSInjection = true;
    chart = new Chart(ctx, config);
}

async function getData(url) {
    const response = await fetch(url, { method: 'GET' });
    return response.json();
}

entryForm.addEventListener('submit', function(e){
    e.preventDefault();

    var url = './mod-lift'+activityId;
    var type = 'PUT';

    var data = {};
    data['type'] = 'add';
    data['weight'] = addEntryWeight.value.trim();
    data['reps'] = addEntryReps.value.trim();
    data['date'] = addEntryDate.value.trim();
    data['name'] = '';
    data['oldDate'] = '';
    data['unit'] = '';
    data['convert'] = false;
    data['_csrf'] = addEntryToken;

    sendData(url,data,type)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
                addEntryError.className = 'error-message';
                addEntryError.innerHTML = res['errors'].name;
            }else if(res['success']){
                addEntryWeight.value = '';
                addEntryReps.value = '';
                addEntryDate.value = '';
                addEntryError.className = 'success-message';
                addEntryError.innerHTML = 'Successfully added.';
                window.location.reload();
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

function setConfig(u, minVal, maxVal, st, dArr){
    config = {
        type: 'line',
        data: {
            datasets: [
                {
                label: u,
                data: dArr,
                fill: false,
                borderColor: '#C3073F'
                }
            ]
        },
        options: {
            responsive: true,
            legend: {
                display: false
            },
            elements: {
                line: {
                    tension: 0
                }
            },
            maintainAspectRatio: false,
            title: {
                display: true,
                text: "Progress Scale"
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        var item = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                        var label = item.nested.weight+' '+unit+' for '+item.nested.reps+'. Theoretical: '+item.y+' '+unit;
                        return label;
                    }
                }
            },
            scales:     {
                xAxes: [{
                    type: "time",
                    time: {
                        parser: timeFormat,
                        tooltipFormat: 'll'
                    },
                    gridLines: {
                        color: gridLineColor
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Weight'
                    },
                    gridLines: {
                        color: gridLineColor
                    },
                    ticks: {
                        suggestedMin: minVal,
                        suggestedMax: maxVal,
                        stepSize: st
                    }
                }]
            }
        }
    }
}