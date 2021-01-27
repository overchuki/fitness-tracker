const maxVals = [1.0,0.95,0.925,0.9,0.875,0.85,0.825,0.8,0.775,0.75,0.725,0.7,0.675,0.65,0.625,0.6,0.575,0.55,0.525,0.5];
const conversionFactorLb = 2.20462262;
const conversionFactorKg = 0.45359237;
const types = [['lift', 'bodyweight'], ['hrate'], ['cardio'], ['bwex']];
const validUnits = [['lbs', 'kgs'], ['bpm'], ['miles', 'km'], ['reps']];

class ActivityObj {
    constructor(userInput){
        this.userInput = userInput;
        this.assignEntryClass();
    }

    initializeActivity(){
        this.NewActivity = { name: this.userInput.name, exType: this.userInput.exType, userId: this.userInput.userId, unit: this.userInput.unit };
        let value = parseInt(this.userInput.value);
        if(!verifyUnit(this.userInput.exType, this.userInput.unit)){ throw Error('Invalid unit for exercise type'); }
        let duration = Math.round((new Date() - toDate(this.userInput.date)) / (1000 * 60 * 60 * 24));
        if(duration < 0){ duration = 0 };
        this.NewActivity.commonCache = { duration };
        this.NewActivity = this.entryObject.initializeCacheAndValues(this.userInput.reps, value, this.userInput.date, this.NewActivity);
    }

    assignEntryClass(){
        switch(this.userInput.exType){
            case 'lift':
                this.entryObject = new LiftEntry();
                break;
            case 'bodyweight':
                this.entryObject = new BWEntry();
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
    }
}

class Entry {

    initializeCacheAndValues(){
        throw Error('Default cache initializer, no entry specific method found.');
    }

    updateCache(){
        throw Error('Default cache updator, no entry specific method found.');
    }

    scanCache(){
        throw Error('Default cache scanner, no entry specific method found.');
    }
}

class LiftEntry extends Entry {

    initializeCacheAndValues(reps, value, date, currentObj){
        reps = parseInt(reps);
        if(currentObj.unit==='kgs'){
            value = Math.round((value*conversionFactorLb + Number.EPSILON) * 10000) / 10000;
        }
        let theomax = findMax(value,reps);
        let values = [{ weight: value, reps, theomax, date }];
        let liftingCache = { max: { weight: value, reps }, theo: { max: theomax, min: theomax }, totalWeight: (value*reps) };
        currentObj.values = values;
        currentObj.liftingCache = liftingCache;
        return currentObj;
    }

    updateCache(){

    }

    scanCache(){

    }
}

class BWEntry extends Entry {
    initializeCacheAndValues(){

    }

    updateCache(){

    }

    scanCache(){

    }
}

class CardioEntry extends Entry {
    
}

class HRateEntry extends Entry {
    
}

class BWEXEntry extends Entry {
    
}

const findMax = (w, r) => {
    return Math.round(((w/maxVals[r-1]) + Number.EPSILON) * 10000) / 10000;
}

const toDate = (dateStr) => {
    var parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

const verifyUnit = (type, unit) => {
    let index = findType(type);
    for(var i = 0;i<validUnits[index].length;i++){
        if(validUnits[index][i]===unit){
            return true;
        }
    }
    return false;
}

const findType = (type) => {
    for(var i = 0;i<types.length;i++){
        for(var x = 0;x<types[i].length;x++){
            if(types[i][x]===type){
                return i;
            }
        }
    }
    return -1;
}

module.exports = {
    ActivityObj,
    Entry
}