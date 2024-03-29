const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const activitySchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    exType: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    values: {
        type: Array,
        "default": [],
        required: true
    },
    commonCache: {
        duration: {
            type: Number,
            required: true
        }
    },
    specificCache: {
        lift: {
            max: {
                weight: {
                    type: Number
                },
                reps: {
                    type: Number
                }
            },
            theo: {
                max: {
                    type: Number
                },
                min: {
                    type: Number
                }
            },
            totalWeight: {
                type: Number
            }
        },
        bodyweight: {
            bounds: {
                max: {
                    type: Number
                },
                min: {
                    type: Number
                }
            }
        }
    }
}, {
    timestamps: true,
    collection: 'activities'
});

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;