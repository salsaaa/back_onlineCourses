const mongoose = require('mongoose');
const _ = require('lodash');

const courseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        maxlength: 256
    },
    duration: {
        type: Number,
        required: true
    },
    payment: {
        type: Number,
        required: true
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    points:{
        type:Number,
        default:0
    },
    img: {
        type: String,
    },
    materials: [
        {
            title: {
                type: String,
                required: true,
                maxlength: 50
            },
            link: {
                type: String,
                required: true
            }
          
        }
    ],
 
}, {
    timestamps: true,
    toJSON: {
        transform: doc => {
            return _.pick(doc, ['_id', 'title', 'description', 'duration', 'payment', 'progress', 'categoryId', 'materials', 'userId','points','img' ]);
        }
    },
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;