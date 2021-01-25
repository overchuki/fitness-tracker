const Activity = require('../models/activity');
const maxVals = [1.0,0.95,0.925,0.9,0.875,0.85,0.825,0.8,0.775,0.75,0.725,0.7,0.675,0.65,0.625,0.6,0.575,0.55,0.525,0.5];
const conversionFactorLb = 2.20462262;
const conversionFactorKg = 0.45359237;
const types = [['lift', 'bodyweight'], ['hrate'], ['cardio'], ['bwex']];
const validUnits = [['lbs', 'kgs'], ['bpm'], ['miles', 'km'], ['reps']];

//inner functions
const handleErrors = (err) => {
    const error = { name: err.message };
    console.log(err);
    return error;
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

const convertValsKGLB = (vals, unit, type, cache) => {
    let arr = vals;
    let conv = 1;
    if(unit==='lbs'){
        conv = conversionFactorLb;
    }else if(unit==='kgs'){
        conv = conversionFactorKg;
    }
    if(type==='lift'){
        return convertValsLift(arr, conv, cache);
    }else if(type==='bodyweight'){
        return convertValsBW(arr, conv, cache);
    }
}

const convertValsLift = (arr, conv, cache) => {
    for(var i = 0;i<arr.length;i++){
        let cur = arr[i];
        let newWeight = Math.round((cur.weight*conv + Number.EPSILON) * 10000) / 10000;
        let newTheo = findMax(newWeight, cur.reps);
        arr[i].weight = newWeight;
        arr[i].theomax = newTheo;
    }
    cache.max.weight = Math.round((cache.max.weight*conv + Number.EPSILON) * 10000) / 10000;
    cache.theo.max = Math.round((cache.theo.max*conv + Number.EPSILON) * 10000) / 10000;
    cache.theo.min = Math.round((cache.theo.min*conv + Number.EPSILON) * 10000) / 10000;
    cache.totalWeight = Math.round((cache.totalWeight*conv + Number.EPSILON) * 10000) / 10000;
    return { arr, cache };
}

const convertValsBW = (arr, conv, cache) => {
    for(var i = 0;i<arr.length;i++){
        let cur = arr[i];
        let newWeight = Math.round((cur.weight*conv + Number.EPSILON) * 10000) / 10000;
        arr[i].weight = newWeight;
    }
    return arr;
}

const newDuration = (date) => {
    return Math.round((new Date() - toDate(date)) / (1000 * 60 * 60 * 24));
}

const getNewCacheLift = (val, curCache) => {
    if(val.weight>curCache.max.weight){
        curCache.max.weight = val.weight;
        curCache.max.reps = val.reps;
    }
    if(val.theomax>curCache.theo.max){
        curCache.theo.max = val.theomax;
    }
    if(val.theomax<curCache.theo.min||curCache.theo.min===0){
        curCache.theo.min = val.theomax;
    }
    curCache.totalWeight += (val.weight*val.reps);
    return curCache;
}

const getNewCacheLiftScan = (vals) => {
    let max = { weight: 0, reps: 0 };
    let theo = { max: 0, min: 0 };
    let totalWeight = 0;
    if(vals.length>0){
        theo.min = vals[0].theomax;
    }
    for(var i = 0;i<vals.length;i++){
        let cur = vals[i];
        let t = cur.theomax;
        let m = cur.weight;
        if(t>theo.max){
            theo.max = t;
        }
        if(t<theo.min||theo.min===0){
            theo.min = t;
        }
        if(m>max.weight){
            max.weight = m;
            max.reps = cur.reps;
        }
        totalWeight += (m*cur.reps);
    }
    return { max, theo, totalWeight };
}

const binarySearchByDate = (arr, target) => {
    let start = 0;
    let end = arr.length-1;
    let mid = Math.floor((start + end)/2);
    while(start<=end){
        mid = Math.floor((start + end)/2);
        if(target===arr[mid].date){
            return { index: mid, arrExists: true };
        }else if(toDate(target)>toDate(arr[mid].date)){
            start = mid + 1;
        }else if(toDate(target)<toDate(arr[mid].date)){
            end = mid - 1;
        }
    }
    if(toDate(target)>toDate(arr[mid].date)){
        return { index: mid+1, arrExists: false};
    }else if(toDate(target)<toDate(arr[mid].date)){
        return { index: mid, arrExists: false};
    }
    return { index: -1, arrExists: false};
}

//get requests for pages
const get_activity_list_page = async (req, res) => {
    let act = await Activity.find({ userId: res.locals.user._id, exType: 'lift' });
    res.locals.activities = act;
    res.render('tabs/lifting', {
        title: 'Lifting'
    });
}

const get_add_activity_form = (req, res) => {
    res.render('activities/add-lift.ejs', {
        title: 'Add Lift',
        csrfToken: req.csrfToken()
    });
}

const get_activity_page = async (req, res) => {
    let actId = req.params.id;
    let act = await Activity.findById(actId);
    res.locals.activity = act;
    res.render('activities/lift', {
        title: act.name,
        csrfToken: req.csrfToken()
    });
}

const get_activity_values = async (req, res) => {
    let actId = req.params.id;
    let act = await Activity.findById(actId);
    let vals = act.values;
    let theomax = act.theomax;
    let theomin = act.theomin;
    let unit = act.unit;
    res.json({ vals, theomax, theomin, unit });
}

const get_modify_activity_page = async (req, res) => {
    let actId = req.params.id;
    let act = await Activity.findById(actId);
    res.locals.activity = act;
    res.render('activities/mod-lift', {
        title: 'Edit '+act.name,
        csrfToken: req.csrfToken()
    });
}

const get_remove_activity_page = (req, res) => {
    let actId = req.params.id;
    res.locals.actId = actId;
    res.render('activities/rem-lift', {
        title: 'Delete',
        csrfToken: req.csrfToken()
    });
}

//add new activity to db
//all: name, exType, userId, unit, values, duration
//lift: values: [{ value, reps, theomax, date }], max: { weight, reps }, theo: { max, min }
//bodyweight: values: [{ weight, date }]
//hrate: -
//cardio: -
//bwex: -
const add_activity_db = async (req, res) => {
    let { name, value, reps, date, exType, userId, unit } = req.body;
    
    let NewActivity = { name, exType, userId, unit };
    let duration;
    
    let theomax;
    
    try{
        value = parseInt(value);
        if(!verifyUnit(exType, unit)){
            throw Error('Invalid unit for exercise type');
        }
        duration = Math.round((new Date() - toDate(date)) / (1000 * 60 * 60 * 24));
        if(duration < 0){ duration = 0 };
        NewActivity.commonCache.duration = duration;
        switch(exType){
            case 'lift':
                reps = parseInt(reps);
                if(unit==='kgs'){
                    value = Math.round((value*conversionFactorLb + Number.EPSILON) * 10000) / 10000;
                }
                theomax = findMax(value,reps);
                NewActivity.values = [{ weight: value, reps, theomax, date }];
                NewActivity.liftingCache = { max: { weight: value, reps }, theo: { max: theomax, min: theomax }, totalWeight: (value*reps) };
                console.log(NewActivity);
                break;
            case 'bodyweight':
                if(unit==='kgs'){
                    value = Math.round((value*conversionFactorLb + Number.EPSILON) * 10000) / 10000;
                }
                NewActivity.values = [{ weight: value, date }];
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
        let activity = await Activity.create(NewActivity);
        res.status(201).json({ activity });
    }catch(err){
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

//modify activity in db
//add: type, value, reps, date, exType
//mod: type, value, reps, date, oldDate, exType
//del: type, date, exType
//name: type, name
//unit: type, unit, convert
const modify_activity_db = async (req, res) => {
    let { type, value, reps, date, name, oldDate, unit, convert, exType  } = req.body;
    let actId = req.params.id;
    let act = await Activity.findById(actId);
    let response = {};

    try{
        if(type==='add'||type==='mod'||type==='del'){
            let { index, arrExists } = binarySearchByDate(act.values, date);
            let newDur;
            
            if(type==='add'||type==='mod'){
                value = parseInt(value);
                reps = parseInt(reps);
                let newTheoMax = findMax(value,reps);
                
                if(type==='add'){
                    if(!arrExists&&index>=0){
                        switch(exType){
                            case 'lift':
                                let newValLf = { weight: value, reps, theomax: newTheoMax, date };
                                act.values.splice(index, 0, newValLf);
                                let newCache = getNewCacheLift(newValLf, act.liftingCache);
                                console.log(newCache);
                                act.liftingCache = newCache;
                                response.success = { msg: 'added to array', vals: act.values };
                                break;
                            case 'bodyweight':
                                let newValBW = { weight: value, date };
                                act.values.splice(index, 0, newValBW);
                                //update cache once it exists
                                response.success = { msg: 'added to array', vals: act.values };
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
                    }else{
                        throw Error('Only one entry per date is allowed.');
                    }
                }else if(type==='mod'){
                    let oldObj = binarySearchByDate(act.values, oldDate);
                    let oldInd = oldObj.index;
                    let oldExists = oldObj.arrExists;
                    if(oldExists){
                        if((!arrExists&&index>=0)||oldDate===date){
                            let tempObj = act.values[oldInd];
                            act.values.splice(oldInd, 1);
                            switch(exType){
                                case 'lift':
                                    tempObj.date = date;
                                    tempObj.weight = value;
                                    tempObj.reps = reps;
                                    tempObj.theomax = newTheoMax;
                                    act.values.splice(index, 0, tempObj);
                                    let newCache = getNewCacheLift(tempObj, act.liftingCache);
                                    act.liftingCache = newCache;
                                    response.success = { msg: 'modded array', vals: act.values };
                                    break;
                                case 'bodyweight':
                                    tempObj.date = date;
                                    tempObj.weight = value;
                                    act.values.splice(index, 0, tempObj);
                                    response.success = { msg: 'modded array', vals: act.values };
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
                                    throw Error('Unrecongnized exercise type');
                            }
                        }else{
                            throw Error('Only one entry per date is allowed.');
                        }
                    }else{
                        throw Error('Old date does not exist.');
                    }
                }
                newDur = newDuration(act.values[0].date);
            }else if(type==='del'){
                if(arrExists){
                    let delVal = act.values[index];
                    act.values.splice(index, 1);
                    switch(exType){
                        case 'lift':
                            let newCacheLift = getNewCacheLiftScan(act.values);
                            console.log(newCacheLift);
                            act.liftingCache.max = newCacheLift.max;
                            act.liftingCache.theo = newCacheLift.theo;
                            act.liftingCache.totalWeight = newCacheLift.totalWeight;
                            break;
                        case 'bodyweight':
                            //update bw cache
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
                    newDur = newDuration(act.values[0].date);
                    response.success = { msg: 'removed from array', vals: act.values };
                }else{
                    throw Error('Delete date does not exist.');
                }
            }
            if(newDur>act.commonCache.duration){ act.commonCache.duration = newDur; }
        }else if(type==='name'){
            act.name = name;
            response.success = { msg: 'changed name', name };
        }else if(type==='unit'){
            act.unit = unit;
            if(convert){
                switch(exType){
                    case 'lift':
                        let convertedValsLift = convertValsKGLB(act.values, unit, exType, act.liftingCache);
                        act.values = convertedValsLift.arr;
                        act.liftingCache = convertedValsLift.cache;
                        break;
                    case 'bodyweight':
                        let convertedValsBW = convertValsKGLB(act.values, unit, exType, act.bodyweightCache);
                        act.values = convertedValsBW.arr;
                        act.bodyweightCache = convertedValsBW.cache;
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
                response.success = { msg: 'changed unit and converted', vals: act.values, unit };
            }else{
                response.success = { msg: 'changed unit', unit };
            }
        }else{
            throw Error('Unrecognized modify request');
        }
        await act.save()
                .then(doc => {
                    res.json(response);
                })
                .catch(err => {
                    const errors = handleErrors(err);
                    res.status(400).json({ errors });
                });
    }catch(err){
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const remove_activity = async (req, res) => {
    let actId = req.params.id;
    let response = {};
    try{
        let remAct = await Activity.findByIdAndRemove(actId);
        if(remAct){
            response = { success: { msg: 'removed lift' } };
        }else{
            response = { errors: { name: 'lift not found' } };
        }
    }catch(err){
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
    res.json(response);
}

module.exports = {
    get_add_activity_form,
    get_activity_page,
    add_activity_db,
    modify_activity_db,
    remove_activity,
    get_activity_list_page,
    get_activity_values,
    get_modify_activity_page,
    get_remove_activity_page
}