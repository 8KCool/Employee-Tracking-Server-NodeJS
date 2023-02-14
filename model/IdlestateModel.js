const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Idlestatechema = new mongoose.Schema({
    employee_id: { type: Schema.Types.ObjectId, required: true },
    start_time: { type: Date , required: true },
    end_time: { type: Date , required: true },
    total_work_time: { type: Number , required: true, default: 0 },
    mouse_work_time: { type: Number, required: true, default: 0 },
    key_work_time: { type: Number, required: true, default: 0 },
    s3shot_count: { type: Number, required: true, default: 0 },
    s3shot_screen_array: { type: Array }
});

const IdlestateModel = mongoose.model('Idlestate', Idlestatechema);
module.exports = IdlestateModel;
