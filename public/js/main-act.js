const graphPadding = 10;
const conversionFactorLb = 2.20462262;
const conversionFactorKg = 0.45359237;

let entryForm = document.getElementById('entryForm');
let addEntryError = document.getElementById('add-entry-err-message');
let infoParent = document.getElementById('activity-info-container');
let addEntryDate = document.getElementById('addEntryDate');
const addEntryToken = document.getElementById('hiddenToken').value.trim();
const activityId = document.getElementById('hiddenActId').value.trim();
const exTypeStr = document.getElementById('exType').value.trim();

let chart;
let ctx = document.getElementById('chartDiv').getContext('2d');
let timeFormat = 'YYYY-MM-DD';
let config;
let gridLineColor = '#2b2b2c';

let ActivityObject;
let vals;
let unit;
let stepArr = [0];
let dispArr;

onload = () => {
    let url = './get-vals'+activityId;

    getData(url)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
            }else if(res['vals']){
                vals = res['vals'];
                unit = res['unit'];
                ActivityObject = new ActivityFront(exTypeStr, res['cache']);
                ActivityObject.verifyData();
            }else{
                console.log('Unexpected response: ', res);
            }
        })
        .catch(err => {
            console.log('logging error: ', err);
        });
}

class ActivityFront {
    constructor(exType, cache){
        this.cache = cache;
        this.assignActivity(exType);
    }

    verifyData(){
        this.actObj.createStepArray();
        
        let { minVal, maxVal, step } = this.actObj.configureTicks();

        dispArr = this.actObj.createDispArr();

        setConfig(unit, minVal, maxVal, step, dispArr);
        makeChart();
    }

    configureData(data){
        return this.actObj.addDataToEntryPackage(data);
    }

    clearFields(){
        this.actObj.clearEntryFields();
    }
    
    assignActivity(exType){
        switch(exType){
            case 'lift':
                this.actObj = new LiftObj(this.cache);
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
                throw Error('Unrecongnized exercise type, frontend error.');
        }
    }
}

class RootActObj {
    constructor(exType){
        this.exType = exType;
    }

    roundToStep(val, upper){
        for(let i = 1; i < stepArr.length; i++){
            if(stepArr[i]>val){
                if(upper){
                    return stepArr[i];
                }else{
                    return stepArr[i-1];
                }
            }
        }
    }
}

class LiftObj extends RootActObj {
    constructor(cache){
        super('lift');
        
        this.cache = cache;
        
        this.graphMax = this.cache.graphBounds.max;
        this.graphMin = this.cache.graphBounds.min;
        if(unit === 'kgs'){
            this.graphMax *= conversionFactorKg;
            this.graphMin *= conversionFactorKg;
        }
        
        this.info = this.cache.info;
        this.displayInfo();

        this.addEntryWeight = document.getElementById('addEntryWeight');
        this.addEntryReps = document.getElementById('addEntryReps');
    }

    addDataToEntryPackage(data){
        data['value'] = this.addEntryWeight.value.trim();
        data['reps'] = this.addEntryReps.value.trim();
        return data;
    }

    clearEntryFields(){
        this.addEntryWeight.value = '';
        this.addEntryReps.value = '';
    }

    displayInfo(){
        for(let i = 0; i < this.info.length; i++){
            let cur = this.info[i];
            infoParent.insertAdjacentHTML('beforeend', `
                <div class="row">
                    <div class="col-6">
                        <h6 class="act-info-title">${cur[0]}</h6>
                    </div>
                    <div class="col-6">
                        <h6 class="act-info">${cur[1]}</h6>
                    </div>
                </div>
            `);
        }
    }

    createStepArray(){
        let step = 45;
        if(unit === 'kgs') step = 20;
        let cur = stepArr[0];
        while(this.graphMax+graphPadding>=cur){
            cur += step;
            stepArr.push(cur);
        }
    }

    configureTicks(){
        let max = this.graphMax+graphPadding;
        let min = this.graphMin-graphPadding;
        if(min < 0) min = 0;
        let maxVal = this.roundToStep(max, true);
        let minVal = this.roundToStep(min, false);
        let factor = 9;
        if(unit === 'kgs') factor = 10;
        let step = (maxVal - minVal) / factor;
        return { minVal, maxVal, step };
    }

    createDispArr(){
        let result = [];
        for(let i = 0; i < vals.length; i++){
            let cur = vals[i];
            let weight = Math.round(cur.weight);
            let max = cur.theomax;
            if(unit === 'kgs'){
                weight *= conversionFactorKg;
                max *= conversionFactorKg;
            }
            result.push({ x: cur.date, y: max, nested: { label: Math.round(weight)+' '+unit+' for '+cur.reps+'. Theoretical: '+Math.round(max)+' '+unit } });
        }
        return result;
    }
}

entryForm.addEventListener('submit', function(e){
    e.preventDefault();

    let url = './mod-act'+activityId;
    let type = 'PUT';

    let data = {};
    data['type'] = 'add';
    data = ActivityObject.configureData(data);
    data['date'] = addEntryDate.value.trim();
    data['exType'] = exTypeStr;
    data['_csrf'] = addEntryToken;

    sendData(url,data,type)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
                addEntryError.className = 'error-message';
                addEntryError.innerHTML = res['errors'].name;
            }else if(res['success']){
                ActivityObject.clearFields();
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

async function getData(url) {
    const response = await fetch(url, { method: 'GET' });
    return response.json();
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

function makeChart(){
    Chart.platform.disableCSSInjection = true;
    chart = new Chart(ctx, config);
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
                        let item = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                        let label = item.nested.label;
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
                        labelString: 'Weight ('+unit+')'
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