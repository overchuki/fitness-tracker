const Activity = require('../models/activity');
const User = require('../models/user');
const bcrypt = require('bcrypt');

//user model functions
const create_new_user = async (username, email, password) => {
    return await User.create({ username, email, password });
}

const login_user = async (u, p) => {
    if(u.isEmail){
        u = u.toLowerCase();
    }
    const user = await User.findOne({ $or:[ { username: u }, { email: u } ] });
    if(user){
        const auth = await bcrypt.compare(p,user.password);
        if(auth){
            return user;
        }
        throw Error('Incorrect password.');
    }
    throw Error('Incorrect username or email.');
}

//activity model functions
const get_activity_array = async (USER_ID, EXTYPE) => {
    return await Activity.find({ userId: USER_ID, exType: EXTYPE });
}

const get_activity_by_id = async (ID) => {
    return await Activity.findById(ID);
}

const create_new_activity = async (ACT_OBJ) => {
    return await Activity.create(ACT_OBJ);
}

const save_activity_document = async (ACT_DOC) => {
    await ACT_DOC.save()
        .then(doc => {
            return doc;
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
}

const remove_activity_by_id = async (ID) => {
    return await Activity.findByIdAndRemove(ID);
}

module.exports = {
    create_new_user,
    login_user,
    get_activity_array,
    get_activity_by_id,
    create_new_activity,
    save_activity_document,
    remove_activity_by_id
}