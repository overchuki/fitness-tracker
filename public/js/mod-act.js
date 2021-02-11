var vals = JSON.parse(localStorage.getItem('vals')).reverse();
var unit = localStorage.getItem('unit');

var parentDiv = document.getElementById('entryDiv');

var _csrf = document.getElementById('hiddenToken');
var actId = document.getElementById('hiddenActId');

var nameInput = document.getElementById('modLiftName');
var lbRadio = document.getElementById('modLbRadio');
var kgRadio = document.getElementById('modKgRadio');
var currentName;
var submitNameBtn = document.getElementById('saveNewName');
var submitUnitBtn = document.getElementById('saveNewUnit');
var nameErrorMsg = document.getElementById('name-error-msg');
var unitErrorMsg = document.getElementById('unit-error-msg');
var convertCheck = document.getElementById('modConvertUnitCheck');

var activeEdit = false;
var activeEditEntry;
var activeEditNode;

var activeForm;
var activeOldDate;
var activeWeightInput;
var activeRepsInput;
var activeDateInput;
var activeErrorMsg;
var deleteEntryButton;

onload = () => {
    if(unit==='lbs'){
        lbRadio.checked = true;
    }else if(unit==='kgs'){
        kgRadio.checked = true;
    }
    currentName = nameInput.value;

    for(var i = 0;i<vals.length;i++){
        let cur = vals[i];
        parentDiv.insertAdjacentHTML('beforeend', '<div class="btm-marg"><div class="mod-lift-entry"><h6 class="entry-list-title" id="'+cur.date+'">'+cur.date+': '+Math.round(cur.weight)+' '+unit+' for '+cur.reps+'.</h6></div></div>');
        document.getElementById(cur.date).addEventListener('click', openEditField);
    }
}

function openEditField(event){
    activeEditEntry = vals.find(elem => elem.date === event.target.id);
    let tempNode = event.target;
    
    if(activeEdit){  
        let parentN = activeEditNode.parentNode.parentNode;
        let children = parentN.children;
        for(var i = 0;i<children.length;i++){
            if(children[i].classList.contains('mod-entry-edit')){
                children[i].parentNode.removeChild(children[i]);
                break;
            }
        }
        if(!tempNode.isSameNode(activeEditNode)){
            setActiveEdit(true, tempNode);
        }else{
            setActiveEdit(false, null);
        }
    }else{
        setActiveEdit(true, tempNode);
    }
}

function setActiveEdit(bool, tN){
    activeEdit = bool;
    activeEditNode = tN;
    if(activeEdit){
        let htmlStr = '<div class="mod-entry-edit"><form id="modifyLiftForm" class="form-inline"><div class="row"><input type="hidden" id="hiddenOldDate" name="oldDate" value="'+activeEditEntry.date+'"><div class="col-3"><input type="number" id="modEntryWeight" class="form-control input-cust-dark-small" value="'+Math.round(activeEditEntry.weight)+'" aria-label="weight" required></div><div class="col-3"><input type="number" max="20" min="1" id="modEntryReps" class="form-control input-cust-dark-small" name="reps" value="'+activeEditEntry.reps+'" required></div><div class="col-3"><input type="date" id="modEntryDate" class="form-control input-cust-dark-small" value="'+activeEditEntry.date+'" aria-label="date" required></div><div class="col-1"></div><div class="col-1"><button type="submit" class="btn cust-btn-dark" >Save</button></div><div class="col-1"><button id="deleteEntryBtn" type="button" class="btn cust-btn-dark"><i class="fas fa-trash"></i></button></div></div><span id="mod-lift-error" class="error-message"></span></form></div>';
        activeEditNode.parentNode.parentNode.insertAdjacentHTML('beforeend', htmlStr);
        
        activeForm = document.getElementById('modifyLiftForm');
        activeOldDate = document.getElementById('hiddenOldDate');
        activeWeightInput = document.getElementById('modEntryWeight');
        activeRepsInput = document.getElementById('modEntryReps');
        activeDateInput = document.getElementById('modEntryDate');
        deleteEntryButton = document.getElementById('deleteEntryBtn');
        activeErrorMsg = document.getElementById('mod-lift-error');
        activeErrorMsg.innerHTML = '';
        
        activeForm.addEventListener('submit', submitModRequest);
        deleteEntryButton.addEventListener('click', deleteEntry);
    }
}

function submitModRequest(e){
    e.preventDefault();

    var inWeight = activeWeightInput.value.trim();
    var inReps = activeRepsInput.value.trim();
    var inDate = activeDateInput.value.trim();

    if(inWeight===Math.round(activeEditEntry.weight)+''&&inReps===activeEditEntry.reps+''&&inDate===activeEditEntry.date){
        activeErrorMsg.className = 'error-message';
        activeErrorMsg.innerHTML = 'Please change something about this entry.';
    }else{
        sendMessage('mod', inWeight, inReps, inDate, '', activeOldDate.value.trim(), '', 'Successfully modified.', false);
    }
}

function deleteEntry(){
    sendMessage('del', '', '', activeOldDate.value.trim(), '', '', '', 'Successfully deleted.', false);
}

submitNameBtn.addEventListener('click', () => {
    var curName = nameInput.value;
    if(currentName===curName){
        nameErrorMsg.className = 'error-message';
        nameErrorMsg.innerHTML = 'Please change the name.';
    }else{
        sendMessage('name', '', '', '', curName, '', '', 'Changed name successfully.', false);
    }
});

submitUnitBtn.addEventListener('click', () => {
    var curUnit;
    var convertUn = false;
    if(convertCheck.checked){
        convertUn = true;
    }
    if(lbRadio.checked){
        curUnit = 'lbs';
    }else if(kgRadio.checked){
        curUnit = 'kgs';
    }
    if(curUnit===unit&&curUnit){
        unitErrorMsg.className = 'error-message';
        unitErrorMsg.innerHTML = 'Please change the unit.';
    }else{
        sendMessage('unit', '', '', '', '', '', curUnit, 'Changed unit successfully.', convertUn);
    }
});

function sendMessage(dType, dWeight, dReps, dDate, dName, dOldDate, dUnit, successMsg, convert){
    var url = './mod-lift'+actId.value.trim();
    var type = 'PUT';

    var data = {};
    data['type'] = dType;
    data['weight'] = dWeight;
    data['reps'] = dReps;
    data['date'] = dDate;
    data['name'] = dName;
    data['oldDate'] = dOldDate;
    data['unit'] = dUnit;
    data['convert'] = convert;
    data['_csrf'] = _csrf.value;

    sendData(url,data,type)
        .then(res => {
            if(res['errors']){
                dealWithError(res);
            }else if(res['success']){
                dealSuccess(res, successMsg, dType);
            }else{
                console.log('Unexpected response: ', res);
            }
        })
        .catch(err => {
            console.log(err);
        });
}

function dealWithError(res){
    console.log(res['errors']);
    if(type==='mod'||type==='del'){
        activeErrorMsg.className = 'error-message';
        activeErrorMsg.innerHTML = res['errors'].name;
    }else if(type==='name'){
        nameErrorMsg.className = 'error-message';
        nameErrorMsg.innerHTML = res['errors'].name;
    }else if(type==='unit'){
        unitErrorMsg.className = 'error-message';
        unitErrorMsg.innerHTML = res['errors'].name;
    }
}

function dealSuccess(res, msg, type){
    if(type==='mod'||type==='del'){
        activeErrorMsg.className = 'success-message';
        activeErrorMsg.innerHTML = msg;
    }else if(type==='name'){
        nameErrorMsg.className = 'success-message';
        nameErrorMsg.innerHTML = msg;
    }else if(type==='unit'){
        unitErrorMsg.className = 'success-message';
        unitErrorMsg.innerHTML = msg;
    }
    if(res['success'].vals){
        localStorage.setItem('vals', JSON.stringify(res['success'].vals));
    }
    if(res['success'].unit){
        localStorage.setItem('unit', res['success'].unit);

    }
    window.location.reload();
}

function deleteInfoMessage(){
    activeErrorMsg.innerHTML = '';
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