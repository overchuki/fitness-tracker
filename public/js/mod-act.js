const _csrf = document.getElementById('hiddenToken').value.trim();
const actId = document.getElementById('hiddenActId').value.trim();
const exTypeStr = document.getElementById('exType').value.trim();
const conversionFactorLb = 2.20462262;
const conversionFactorKg = 0.45359237;

let curNode = 0;
let vals;
let unit;

let parentDiv = document.getElementById('entryDiv');

let nameInput = document.getElementById('modLiftName');
let currentName = nameInput.value;

let lbRadio = document.getElementById('modLbRadio');
let kgRadio = document.getElementById('modKgRadio');

let submitNameBtn = document.getElementById('saveNewName');
let submitUnitBtn = document.getElementById('saveNewUnit');

let nameErrorMsg = document.getElementById('name-error-msg');
let unitErrorMsg = document.getElementById('unit-error-msg');

let ActivityObject;

let activeEdit = false;
let activeEditEntry;
let activeEditNode;

let activeForm;
let activeOldDate;
let activeDateInput;
let activeErrorMsg;
let deleteEntryButton;

let activeValueInput;
let activeRepsInput;

onload = () => {
    let url = './get-vals'+actId;

    getData(url)
        .then(res => {
            if(res['errors']){
                console.log(res['errors']);
            }else if(res['vals']){
                vals = res['vals'].reverse();
                unit = res['unit'];
                ActivityObject = new ActivityMod(exTypeStr);
                ActivityObject.setCheckedUnit();
                ActivityObject.addNodes(curNode, vals.length);
            }else{
                console.log('Unexpected response: ', res);
            }
        })
        .catch(err => {
            console.log('logging error: ', err);
        });
}

class ActivityMod {
    constructor(exType){
        this.assignObject(exType);
    }

    addNodes(start, end){
        for(let i = start;i<end;i++){
            let cur = vals[i];
            parentDiv.insertAdjacentHTML('beforeend', `
                <div class="btm-marg">
                    <div class="mod-lift-entry">
                        <h6 class="entry-list-title" id="${cur.date}">${cur.date}: ${ActivityObject.baseHTMLString(cur)}</h6>
                    </div>
                </div>
            `);
            document.getElementById(cur.date).addEventListener('click', openEditField);
        }
    }

    setCheckedUnit(){
        if(unit==='lbs'){
            lbRadio.checked = true;
        }else if(unit==='kgs'){
            kgRadio.checked = true;
        }
    }

    setActiveInputsRoot(){
        this.actObj.setActiveInputs();
    }

    getActiveInputValuesRoot(inDate){
        return this.actObj.getActiveInputValues(inDate);
    }

    baseHTMLString(entry){
        return this.actObj.basicViewHTMLString(entry);
    }

    expandedHTMLString(entry){
        return this.actObj.expandedViewHTMLString(entry);
    }

    unitFilter(val){
        return this.actObj.actUnitFilter(val);
    }

    assignObject(exType){
        switch(exType){
            case 'lift':
                this.actObj = new LiftObj(exType);
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
}

class LiftObj extends RootActObj {
    constructor(exType){
        super(exType);
    }

    setActiveInputs(){
        activeValueInput = document.getElementById('modEntryWeight');
        activeRepsInput = document.getElementById('modEntryReps');
    }

    getActiveInputValues(inDate){
        let inValue = activeValueInput.value.trim();
        let inReps = activeRepsInput.value.trim();

        if(inValue===this.actUnitFilter(activeEditEntry.weight)+''&&inReps===activeEditEntry.reps+''&&inDate===activeEditEntry.date){
            activeErrorMsg.className = 'error-message';
            activeErrorMsg.innerHTML = 'Please change something about this entry.';
            return null;
        }
        return { inValue, inReps };
    }

    basicViewHTMLString(entry){
        return `${this.actUnitFilter(entry.weight)} ${unit} for ${entry.reps}.`;
    }

    expandedViewHTMLString(entry){
        return `
            <div class="col-3">
                <input type="number" id="modEntryWeight" class="form-control input-cust-dark-small" value="${this.actUnitFilter(entry.weight)}" aria-label="weight" required>
            </div>
            <div class="col-3">
                <input type="number" max="20" min="1" id="modEntryReps" class="form-control input-cust-dark-small" name="reps" value="${entry.reps}" required>
            </div>
        `;
    }

    actUnitFilter(val){
        if(unit === 'kgs'){
            return Math.round(val*conversionFactorKg);
        }else{
            return Math.round(val);
        }
    }
}

function openEditField(event){
    activeEditEntry = vals.find(elem => elem.date === event.target.id);
    let tempNode = event.target;
    
    if(activeEdit){  
        let parentN = activeEditNode.parentNode.parentNode;
        let children = parentN.children;
        for(let i = 0;i<children.length;i++){
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
        let htmlStr = `
            <div class="mod-entry-edit">
                <form id="modifyLiftForm" class="form-inline">
                    <div class="row">
                        <input type="hidden" id="hiddenOldDate" name="oldDate" value="${activeEditEntry.date}">
                        ${ActivityObject.expandedHTMLString(activeEditEntry)}
                        <div class="col-3">
                            <input type="date" id="modEntryDate" class="form-control input-cust-dark-small" value="${activeEditEntry.date}" aria-label="date" required>
                        </div>
                        <div class="col-1"></div>
                        <div class="col-1">
                            <button type="submit" class="btn cust-btn-dark" >Save</button>
                        </div>
                        <div class="col-1">
                            <button id="deleteEntryBtn" type="button" class="btn cust-btn-dark">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <span id="mod-lift-error" class="error-message"></span>
                </form>
            </div>
        `;
        activeEditNode.parentNode.parentNode.insertAdjacentHTML('beforeend', htmlStr);
        
        activeForm = document.getElementById('modifyLiftForm');
        activeOldDate = document.getElementById('hiddenOldDate');
        activeDateInput = document.getElementById('modEntryDate');
        deleteEntryButton = document.getElementById('deleteEntryBtn');
        activeErrorMsg = document.getElementById('mod-lift-error');
        activeErrorMsg.innerHTML = '';
        
        ActivityObject.setActiveInputsRoot();
        
        activeForm.addEventListener('submit', submitModRequest);
        deleteEntryButton.addEventListener('click', deleteEntry);
    }
}

function submitModRequest(e){
    e.preventDefault();
    
    let inDate = activeDateInput.value.trim();
    let newValues = ActivityObject.getActiveInputValuesRoot(inDate);
    if(newValues){
        sendMessage('mod', newValues.inValue, newValues.inReps, inDate, '', activeOldDate.value.trim(), '', 'Successfully modified.');
    }
}

function deleteEntry(){
    sendMessage('del', '', '', activeOldDate.value.trim(), '', '', '', 'Successfully deleted.');
}

submitNameBtn.addEventListener('click', () => {
    let newName = nameInput.value;
    if(currentName===newName){
        nameErrorMsg.className = 'error-message';
        nameErrorMsg.innerHTML = 'Please change the name.';
    }else{
        sendMessage('name', '', '', '', newName, '', '', 'Changed name successfully.');
    }
});

submitUnitBtn.addEventListener('click', () => {
    let curUnit;
    if(lbRadio.checked){
        curUnit = 'lbs';
    }else if(kgRadio.checked){
        curUnit = 'kgs';
    }
    if(curUnit===unit&&curUnit){
        unitErrorMsg.className = 'error-message';
        unitErrorMsg.innerHTML = 'Please change the unit.';
    }else{
        sendMessage('unit', '', '', '', '', '', curUnit, 'Changed unit successfully.');
    }
});

function sendMessage(dType, dValue, dReps, dDate, dName, dOldDate, dUnit, successMsg){
    let url = './mod-act'+actId;
    let type = 'PUT';

    let data = {};
    data['type'] = dType;
    data['value'] = dValue;
    data['reps'] = dReps;
    data['date'] = dDate;
    data['name'] = dName;
    data['oldDate'] = dOldDate;
    data['unit'] = dUnit;
    data['exType'] = exTypeStr;
    data['_csrf'] = _csrf;

    sendData(url,data,type)
        .then(res => {
            if(res['errors']){
                dealWithOutcome(res, res['errors'].name, dType);
            }else if(res['success']){
                dealWithOutcome(res, successMsg, dType);
            }else{
                console.log('Unexpected response: ', res);
            }
        })
        .catch(err => {
            console.log(err);
        });
}

function dealWithOutcome(res, msg, type){
    let className = 'success-message';
    if(res['errors']){
        className = 'error-message';
        console.log(res['errors']);
    }
    
    if(type==='mod'||type==='del'){
        activeErrorMsg.className = className;
        activeErrorMsg.innerHTML = msg;
    }else if(type==='name'){
        nameErrorMsg.className = className;
        nameErrorMsg.innerHTML = msg;
    }else if(type==='unit'){
        unitErrorMsg.className = className;
        unitErrorMsg.innerHTML = msg;
    }
    if(res['success']) window.location.reload();
}

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