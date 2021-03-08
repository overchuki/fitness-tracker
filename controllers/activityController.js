const dbController = require('../controllers/databaseController');
const actClassController = require('../controllers/activityClassController');

const test_endpoint = async (req, res) => {
    res.status(400).send('Dev endpoint currently empty.');
}

//error handler
const handleErrors = (err) => {
    const error = { name: err.message };
    console.log(err);
    return error;
}

//get requests for pages
const get_activity_list_page = async (req, res) => {
    let type = req.params.exType;
    let act = await dbController.get_activity_array(res.locals.user._id, type);
    res.locals.activities = act;
    res.locals.exType = type;
    res.render('tabs/actList', {
        title: type.toUpperCase()
    });
}

const get_add_activity_form = (req, res) => {
    let type = req.params.exType;
    res.locals.exType = type;
    res.render('activities/add-act', {
        title: 'Add '+type.toUpperCase(),
        csrfToken: req.csrfToken()
    });
}

const get_activity_page = async (req, res) => {
    let actId = req.params.id;
    let act = await dbController.get_activity_by_id(actId);
    res.locals.activity = act;
    res.locals.exType = act.exType;
    res.render('activities/main-act', {
        title: act.name,
        csrfToken: req.csrfToken()
    });
}

const get_activity_values = async (req, res) => {
    let actId = req.params.id;
    let act = await dbController.get_activity_by_id(actId);
    
    let vals = act.values;
    let ACT_OBJ = new actClassController.ActivityObj({ exType: act.exType });
    let cache = ACT_OBJ.getCacheRoot(act);
    let unit = act.unit;
    
    res.json({ vals, cache, unit });
}

const get_modify_activity_page = async (req, res) => {
    let actId = req.params.id;
    let act = await dbController.get_activity_by_id(actId);
    res.locals.activity = act;
    res.locals.exType = act.exType;
    res.render('activities/mod-act', {
        title: 'Edit '+act.name,
        csrfToken: req.csrfToken()
    });
}

const get_remove_activity_page = (req, res) => {
    let actId = req.params.id;
    res.locals.actId = actId;
    res.render('activities/rem-act', {
        title: 'Delete',
        csrfToken: req.csrfToken()
    });
}

//add new activity to db
//{ value, reps, date, userId, name, unit, exType }
const add_activity_db = async (req, res) => {
    let userInput = req.body;
    
    try{
        let ACT_OBJ = new actClassController.ActivityObj(userInput);
        let newAct = ACT_OBJ.initializeActivity();
        let activity = await dbController.create_new_activity(newAct);
        res.status(201).json({ activity });
    }catch(err){
        let errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

//{ type, value, reps, date, name, oldDate, unit, exType }
const modify_activity_db = async (req, res) => {
    let userInput = req.body;
    let actId = req.params.id;
    let act = await dbController.get_activity_by_id(actId);
    let response = {};

    try{
        let ACT_OBJ = new actClassController.ActivityObj(userInput);
        let result = { ACT_DOC: act, response: { errors: { msg: 'default response, no action triggered' } } };
        switch(userInput.type){
            case 'add':
                result = ACT_OBJ.addValuesEntry(act);
                break;
            case 'mod':
                result = ACT_OBJ.modValuesEntry(act);
                break;
            case 'del':
                result = ACT_OBJ.delValuesEntry(act);
                break;
            case 'name':
                result = ACT_OBJ.nameChangeActivity(act);
                break;
            case 'unit':
                result = ACT_OBJ.unitChangeActivity(act);
                break;
            default:
                throw Error('Unrecognized modify request');
        }
        act = result.ACT_DOC;
        response = result.response;
        act.commonCache = ACT_OBJ.updateCommonCache(act);
        await dbController.save_activity_document(act)
            .then(doc => {
                res.json(response);
            })
            .catch(err => {
                throw err;
            });
    }catch(err){
        let errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const remove_activity = async (req, res) => {
    let actId = req.params.id;
    let response = {};
    try{
        let remAct = await dbController.remove_activity_by_id(actId);
        if(remAct){
            response = { success: { msg: 'removed lift' } };
        }else{
            throw Error('Lift not found');
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
    get_remove_activity_page,
    test_endpoint
}