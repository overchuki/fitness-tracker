const maxVals = [1.0,0.95,0.925,0.9,0.875,0.85,0.825,0.8,0.775,0.75,0.725,0.7,0.675,0.65,0.625,0.6,0.575,0.55,0.525,0.5];
const conversionFactorLb = 2.20462262;
const conversionFactorKg = 0.45359237;
const types = [['lift', 'bodyweight'], ['hrate'], ['cardio'], ['bwex']];
const validUnits = [['lbs', 'kgs'], ['bpm'], ['miles', 'km'], ['reps']];

class ActivityObj {
    constructor(userInput){
        this.userInput = userInput;
        this.assignEntryClass(this.userInput.exType);
    }

    initializeActivity(){
        this.NewActivity = { name: this.userInput.name, exType: this.userInput.exType, userId: this.userInput.userId, unit: this.userInput.unit };
        let value = parseInt(this.userInput.value);
        if(!this.verifyUnit(this.userInput.exType, this.userInput.unit)){ throw Error('Invalid unit for exercise type'); }
        let duration = Math.round((new Date() - this.toDate(this.userInput.date)) / (1000 * 60 * 60 * 24));
        if(duration < 0){ duration = 0 };
        this.NewActivity.commonCache = { duration };
        let { specificCache, initValue } = this.entryObject.initializeCacheAndValues(this.userInput.reps, value, this.userInput.date, this.NewActivity);
        this.NewActivity.values = [initValue];
        this.NewActivity.specificCache = specificCache;
        return this.NewActivity;
    }

    addValuesEntry(ACT_DOC){
        let { index, arrExists } = this.binarySearchByDate(ACT_DOC.values, this.userInput.date);
        if(!arrExists&&index>=0){
            let { NEW_ACT_DOC, newVal } = this.entryObject.addValueToEntry(ACT_DOC, this.userInput);
            ACT_DOC = NEW_ACT_DOC;
            ACT_DOC.values.splice(index, 0, newVal);
            let response = { success: { msg: 'added to array', vals: ACT_DOC.values } };
            return { ACT_DOC, response };
        }else{
            throw Error('Only one entry per date is allowed.');
        }
    }

    modValuesEntry(ACT_DOC){
        let { index, arrExists } = this.binarySearchByDate(ACT_DOC.values, this.userInput.date);
        let oldObj = this.binarySearchByDate(ACT_DOC.values, this.userInput.oldDate);
        if(oldObj.arrExists){
            if((!arrExists&&index>=0)||this.userInput.oldDate===this.userInput.date){
                let tempObj = ACT_DOC.values[oldObj.index];
                ACT_DOC.values.splice(oldObj.index, 1);
                let newVal = this.entryObject.setNewValue(this.userInput, ACT_DOC.unit);
                console.log(newVal);
                ACT_DOC.values.splice(index, 0, newVal);
                ACT_DOC = this.entryObject.modifyValueInEntry(ACT_DOC);
                let response = { success: { msg: 'modified array', vals: ACT_DOC.values } };
                return { ACT_DOC, response };
            }else{
                throw Error('Only one entry per date is allowed.');
            }
        }else{
            throw Error('Server Error: Old date does not exist.');
        }
    }

    delValuesEntry(ACT_DOC){
        let oldObj = this.binarySearchByDate(ACT_DOC.values, this.userInput.date);
        if(oldObj.arrExists){
            let delVal = ACT_DOC.values[oldObj.index];
            ACT_DOC.values.splice(oldObj.index, 1);
            ACT_DOC = this.entryObject.deleteValueEntry(ACT_DOC, delVal);
            let response = { success: { msg: 'removed from array', vals: ACT_DOC.values } };
            return { ACT_DOC, response };
        }else{
            throw Error('Delete date does not exist.');
        }
    }

    nameChangeActivity(ACT_DOC){
        ACT_DOC.name = this.userInput.name;
        let response = { success: { msg: 'changed name', name: ACT_DOC.name } };
        return { ACT_DOC, response };
    }

    unitChangeActivity(ACT_DOC){
        if(ACT_DOC.unit===this.userInput.unit){ throw Error('This is already the current unit'); }
        if(!this.verifyUnit(this.userInput.exType, this.userInput.unit)){ throw Error('Invalid unit for exercise type'); }
        ACT_DOC.unit = this.userInput.unit;
        let response = { success: { msg: 'changed unit of activity', vals: ACT_DOC.values } };
        return { ACT_DOC, response };
    }

    updateCommonCache(ACT_DOC){
        let newDur = Math.round((new Date() - this.toDate(ACT_DOC.values[0].date)) / (1000 * 60 * 60 * 24));
        if(ACT_DOC.values.length>0&&newDur>0){
            return { duration: newDur };
        }else{
            return { duration: 0 };
        }
    }

    binarySearchByDate(arr, target){
        let start = 0;
        let end = arr.length-1;
        let mid = Math.floor((start + end)/2);
        while(start<=end){
            mid = Math.floor((start + end)/2);
            if(target===arr[mid].date){
                return { index: mid, arrExists: true };
            }else if(this.toDate(target)>this.toDate(arr[mid].date)){
                start = mid + 1;
            }else if(this.toDate(target)<this.toDate(arr[mid].date)){
                end = mid - 1;
            }
        }
        if(this.toDate(target)>this.toDate(arr[mid].date)){
            return { index: mid+1, arrExists: false};
        }else if(this.toDate(target)<this.toDate(arr[mid].date)){
            return { index: mid, arrExists: false};
        }
        return { index: -1, arrExists: false};
    }

    toDate(dateStr){
        var parts = dateStr.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    verifyUnit(type, unit){
        let index = this.findType(type);
        for(var i = 0;i<validUnits[index].length;i++){
            if(validUnits[index][i]===unit){
                return true;
            }
        }
        return false;
    }

    findType(type){
        for(var i = 0;i<types.length;i++){
            for(var x = 0;x<types[i].length;x++){
                if(types[i][x]===type){
                    return i;
                }
            }
        }
        return -1;
    }

    getCacheRoot(ACT_DOC){
        return this.entryObject.getCache(ACT_DOC);
    }

    assignEntryClass(type){
        switch(type){
            case 'lift':
                this.entryObject = new LiftEntry();
                break;
            case 'bodyweight':
                // this.entryObject = new BWEntry();
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
    }
}

class Entry {
    findMax(w, r){
        return Math.round(((w/maxVals[r-1]) + Number.EPSILON) * 10000) / 10000;
    }

    unitFilter(val, unit){
        if(unit === 'lbs') return Math.round(val);
        else if(unit === 'kgs') return Math.round(val*conversionFactorKg);
    }
}

class LiftEntry extends Entry {

    addValueToEntry(ACT_DOC, userInput){
        let newVal = this.setNewValue(userInput, ACT_DOC.unit);
        let NEW_ACT_DOC = this.updateCache(newVal, ACT_DOC);
        return { NEW_ACT_DOC, newVal };
    }

    modifyValueInEntry(ACT_DOC){
        ACT_DOC = this.scanCache(ACT_DOC);
        return ACT_DOC;
    }

    setNewValue(userInput, unit){
        let value = parseInt(userInput.value);
        if(unit==='kgs'){ value = Math.round((value*conversionFactorLb + Number.EPSILON) * 10000) / 10000; }
        let reps = parseInt(userInput.reps);
        let newTheoMax = this.findMax(value,reps);
        let newVal = { weight: value, reps, theomax: newTheoMax, date: userInput.date };
        return newVal;
    }

    deleteValueEntry(ACT_DOC, delVal){
        let curCache = ACT_DOC.specificCache.lift;
        if(curCache.max.weight<=delVal.weight||curCache.theo.max<=delVal.theomax||curCache.theo.min>=delVal.theomax){
            ACT_DOC = this.scanCache(ACT_DOC);
        }else{
            let totalWeightSub = Math.round(((delVal.weight*delVal.reps) + Number.EPSILON) * 10000) / 10000;
            ACT_DOC.specificCache.lift.totalWeight -= totalWeightSub;
        }
        return ACT_DOC;
    }

    initializeCacheAndValues(reps, value, date, currentObj){
        reps = parseInt(reps);
        if(currentObj.unit==='kgs'){ value = Math.round((value*conversionFactorLb + Number.EPSILON) * 10000) / 10000; }
        let theomax = this.findMax(value,reps);
        let initValue = { weight: value, reps, theomax, date };
        let totalWeight = Math.round((value*reps + Number.EPSILON) * 10000) / 10000;
        let specificCache = { lift: { max: { weight: value, reps }, theo: { max: theomax, min: theomax }, totalWeight } };
        return { specificCache, initValue };
    }

    updateCache(val, ACT_DOC){
        let lift = ACT_DOC.specificCache.lift;
        
        if((val.weight>lift.max.weight)||(val.weight===lift.max.weight&&val.reps>lift.max.reps)){
            ACT_DOC.specificCache.lift.max.weight = val.weight;
            ACT_DOC.specificCache.lift.max.reps = val.reps;
        }
        if(val.theomax>lift.theo.max){
            ACT_DOC.specificCache.lift.theo.max = val.theomax;
        }
        if(val.theomax<lift.theo.min||lift.theo.min===0){
            ACT_DOC.specificCache.lift.theo.min = val.theomax;
        }
        let totalWeightAdd = Math.round(val.weight*val.reps + Number.EPSILON);
        ACT_DOC.specificCache.lift.totalWeight += totalWeightAdd;
        return ACT_DOC;
    }

    scanCache(ACT_DOC){
        let vals = ACT_DOC.values;
        let max = { weight: 0, reps: 0 };
        let theo = { max: 0, min: 0 };
        let totalWeight = 0;
        for(var i = 0;i<vals.length;i++){
            let cur = vals[i];
            let t = cur.theomax;
            let m = cur.weight;
            let r = cur.reps;
            if(t>theo.max){
                theo.max = t;
            }
            if(t<theo.min||theo.min===0){
                theo.min = t;
            }
            if(m>max.weight||(m===max.weight&&r>max.reps)){
                max.weight = m;
                max.reps = r;
            }
            totalWeight += (m*cur.reps);
        }
        totalWeight = Math.round((totalWeight + Number.EPSILON) * 10000) / 10000;
        ACT_DOC.specificCache.lift = { max, theo, totalWeight };
        return ACT_DOC;
    }

    getCache(ACT_DOC){
        let unit = ACT_DOC.unit;
        let specificCache = ACT_DOC.specificCache.lift;
        let returnCache = [
            ['Latest', 
                this.unitFilter(ACT_DOC.values[ACT_DOC.values.length-1].weight, unit)
                +' '+unit+' for '+ACT_DOC.values[ACT_DOC.values.length-1].reps+' reps'],
            ['Max',
                this.unitFilter(specificCache.max.weight, unit)
                +' '+unit+' for '+specificCache.max.reps+' reps'],
            ['Theoretical Max', this.unitFilter(specificCache.theo.max, unit)+' '+unit],
            ['Duration', ACT_DOC.commonCache.duration+' days'],
            ['Total Weight Lifted', this.unitFilter(specificCache.totalWeight, unit)+' '+unit]
        ];
        let returnGraph = {
            max: specificCache.theo.max,
            min: specificCache.theo.min
        }
        return { info: returnCache, graphBounds: returnGraph };
    }
}

class BWEntry extends Entry {
    
    addValueToEntry(){
        // let newValBW = { weight: value, date };
        // act.values.splice(index, 0, newValBW);
        // //update cache once it exists
        // response.success = { msg: 'added to array', vals: act.values };
    }

    modifyValueInEntry(){
        // tempObj.date = date;
        // tempObj.weight = value;
        // act.values.splice(index, 0, tempObj);
        // response.success = { msg: 'modded array', vals: act.values };
    }

    deleteValueEntry(){

    }
    
    initializeCacheAndValues(value, date, currentObj){
        if(currentObj.unit==='kgs'){
            value = Math.round((value*conversionFactorLb + Number.EPSILON) * 10000) / 10000;
        }
        let values = [{ weight: value, date }];
        let bodyweightCache = { max: { weight: value, reps }, theo: { max: theomax, min: theomax }, totalWeight: (value*reps) };
        currentObj.values = values;
        currentObj.bodyweightCache = bodyweightCache;
        return currentObj;
    }

    updateCache(){

    }

    scanCache(){

    }

    getCache(ACT_DOC){
        
    }
}

class CardioEntry extends Entry {

    addValueToEntry(ACT_DOC, index){

    }

    modifyValueInEntry(ACT_DOC, index, oldObj){

    }

    deleteValueEntry(ACT_DOC, index){

    }

    initializeCacheAndValues(reps, value, date, currentObj){

    }

    updateCache(val, curCache){

    }

    scanCache(vals){

    }

    getCache(ACT_DOC){

    }
}

class HRateEntry extends Entry {
    
    addValueToEntry(ACT_DOC, index){

    }

    modifyValueInEntry(ACT_DOC, index, oldObj){

    }

    deleteValueEntry(ACT_DOC, index){

    }

    initializeCacheAndValues(reps, value, date, currentObj){

    }

    updateCache(val, curCache){

    }

    scanCache(vals){

    }

    getCache(ACT_DOC){
        
    }
}

class BWEXEntry extends Entry {
    
    addValueToEntry(ACT_DOC, index){

    }

    modifyValueInEntry(ACT_DOC, index, oldObj){

    }

    deleteValueEntry(ACT_DOC, index){

    }

    initializeCacheAndValues(reps, value, date, currentObj){

    }

    updateCache(val, curCache){

    }

    scanCache(vals){

    }

    getCache(ACT_DOC){
        
    }
}

module.exports = {
    ActivityObj
}