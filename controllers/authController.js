const dbController = require('../controllers/databaseController');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const config = require('../config');
const maxAgeSeconds = 1 * 24 * 60 * 60;

const handleErrors = (err) => {
    let error = { username: '', email: '', password: '' };
    //incorrect email
    if(err.message.includes('Incorrect username')){ error['username'] = err.message };
    //incorrect password
    if(err.message.includes('Incorrect password')){ error['password'] = err.message };
    //duplicate error
    if(err.code === 11000){
        Object.keys(err.keyValue).forEach(key => {
            let keyUpper = key.charAt(0).toUpperCase() + key.slice(1);
            error[key] = `${keyUpper} is already taken.`;
        });
        return error;
    }
    //validation error
    if(err.message.toLowerCase().includes('user validation failed')){
        Object.values(err.errors).forEach(({properties}) => {
            error[properties.path] = properties.message;
        });
    }
    return error;
}

const get_login = (req, res) => {
    res.render('auth/log-in', {
        title: 'Log in'
    });
}

const get_signup = (req, res) => {
    res.render('auth/signup', {
        title: 'Sign up'
    });
}

const get_settings = (req, res) => {
    res.render('tabs/settings', {
        title: 'Settings'
    });
}

const createToken = (id) => {
    return jwt.sign({ id }, config.get('jwt_secret'), { expiresIn: maxAgeSeconds });
}

const login_user = async (req, res) => {
    const { username, password } = req.body;
    try{
        const user = await dbController.login_user(username, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAgeSeconds * 1000 });
        res.status(201).json({ userId: user._id });
    }catch(err){
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const signup_user = async (req, res) => {
    const { username, email, password } = req.body;
    try{
        const user = await dbController.create_new_user(username, email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAgeSeconds * 1000 });
        res.status(201).json({ userId: user._id });
    }catch(err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const mod_user = (req, res) => {
    //modify user
}

const logout_user = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
}

const rem_user = (req, res) => {
    //delete user
}

module.exports = {
    get_login,
    get_signup,
    login_user,
    signup_user,
    logout_user,
    mod_user,
    rem_user,
    get_settings
}