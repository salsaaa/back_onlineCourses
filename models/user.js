const mongoose = require('mongoose');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const CustomError = require('../helpers/customError');

const util = require('util');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_KEY_SECRET;
const sign = util.promisify(jwt.sign);
const verify = util.promisify(jwt.verify);

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    userType: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 0
    },
    disable:{
        type:Boolean,
        default:false
    },
    img: {
        type: String,
    },
    enrolledCourses:[{
        courseId:{

            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        },
        progress: {
            type: Number,
            default: 0
        },
        claimed:{
            type:Boolean,
            default:false
        }

    }]

}, {
    timestamps: true,
    toJSON: {
        transform: doc => {
            return _.pick(doc, ['_id', 'fullName', 'email', 'userType','enrolledCourses','points','disable','img']);
        }
    },
});



sign({userId: ''}, jwtSecret)
    .then( token => console.log(token) )
    .catch( err => next() );

// To Encrypt the password
userSchema.pre('save', async function() {
    if (this.isModified('password'))
        this.password = await bcrypt.hash(this.password, 7)
});
userSchema.pre('findByIdAndUpdate', async function() {
    if (this.isModified('password'))
        this.password = await bcrypt.hash(this.password, 7)
});
// To Check the password is correct!
userSchema.methods.comparePassword = function(pass) {
    return bcrypt.compare(pass, this.password);
};
// To Check the email is correct!
userSchema.methods.compareEmail = async function(em) {
    return await User.find( { email: em });
}
// generate token
userSchema.methods.generateToken = function() {
    return sign({userId: this.id}, jwtSecret)
};
// verify token
userSchema.statics.getCurrentUser = async function(token) {
    const payload = await verify(token, jwtSecret);
    const currentUser = await User.findById(payload.userId);

    if (!currentUser) throw CustomError(404, 'User Not Found!');
    return currentUser;
}

const User = mongoose.model('User', userSchema);

module.exports = User;