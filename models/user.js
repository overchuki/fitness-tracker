const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Please enter a username.'],
        trim: true,
        unique: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email'],
        index: {
            unique: true,
            partialFilterExpression: { email: { $type: "string" } }
        }
    },
    password: {
        type: String,
        required: [true, 'Please enter a password.']
    }
}, {
    timestamps: true,
    collection: 'users'
});

userSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;