const mongoose = require('mongoose');
const express = require('express');
var bodyParser = require('body-parser');
const { IPC_URL } = require('./enums');
const url = require('url');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

mongoose.set('strictQuery', true);

const dbConnect = "mongodb://127.0.0.1:27017/ss_screens";

const port = process.env.PORT || 5000;
mongoose
    .connect(dbConnect)
    .then(() => {
        console.log('connected to db');
        app.listen(port, () => {
            console.log(`serve at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log(err.message);
    });


const EmployeeModel = require('./model/EmployeeModel');
const IdlestateModel = require('./model/IdlestateModel');

app.get('/', function (req, res) {
    console.log(req.query);
});

app.get('/api', function (req, res) {
    console.log(req.query);
});

////login function
app.get(IPC_URL.VERIFYUSER_URL, function (req, res) {

    try {
        const reqUrl = url.parse(req.url, true);
        var username = reqUrl.query.name;
        var pwd = reqUrl.query.pwd;

        EmployeeModel.find({ name: username, password: pwd }, function (err, data) {
            if (data && data.length > 0) {
                res.status(200).json(data[0]);
            } else {
                res.status(201).send('Invalid email or password.');
            }
        });
    }
    catch (err) {
        console.log("error during call to db ".concat(err))
        throw err;
    }
})

////get employee state
app.get(IPC_URL.GETCURRENTSTATE_URL, function (req, res) {
    try {
        const reqUrl = url.parse(req.url, true);
        var employee_id = reqUrl.query.employeeId;
        IdlestateModel.find({ employee_id: employee_id }, function (err, data) {
            var currentMin = new Date().getMinutes();
            var currentSec = new Date().getSeconds();
            var left_time = (10 - (currentMin) % 10) * 60 - currentSec;
            var saved_capture = 0;
            if (data && data.length > 0) {
                if ((600 - left_time) > (new Date().getTime() - data[0].end_time)/ 1000) {
                    saved_capture = data[0].s3shot_count;
                }
                // get Left Time and left capture
                res.status(200).json({
                    LeftTime: left_time,
                    LeftCapture: saved_capture
                });
            } else {
                res.status(200).json({
                    LeftTime: left_time,
                    LeftCapture: 0
                });
            }
        }).sort({ _id: -1 }).limit(1);
    }
    catch (err) {
        console.log("error during call to db ".concat(err))
        throw err;
    }
})

////update idle state
app.post(IPC_URL.UPLOADSTATE_URL, function (req, res) {
    try {

        var idleState = req.body;
        var employeeData = idleState.employeeData;

        IdlestateModel.find({ employee_id: employeeData._id }, function (err, data) {
            var currentMin = new Date().getMinutes();
            var currentSec = new Date().getSeconds();
            var left_time = (10 - (currentMin) % 10) * 60 - currentSec;
            console.log(left_time);

            var saved_capture = 0;
            if (data && data.length > 0) {
                if ((600 - left_time) > (new Date().getTime() - data[0].end_time) / 1000) {
                    updateIdleData(idleState, data[0], res);
                }
                else {
                    insertIdleData(idleState, res);
                }
            } else {
                insertIdleData(idleState, res);
            }
        }).sort({ _id: -1 }).limit(1);
    }
    catch (err) {
        console.log("error during call to db ".concat(err))
        throw err;
    }
})

const insertIdleData = (idleState, res) => {
    console.log("insertIdle");
    var employeeData = idleState.employeeData;
    var s3shot_count = idleState.s3shot_count;
    var s3shot_screen_array = idleState.s3shot_screen_array;
    var uploadStateData;
    var idleTime = idleState.idleTime;
    if (idleTime == 0) {  // normal save idle state
        var end_time = new Date().getTime();
        var totalTimeRange = idleState.timeRange;
        uploadStateData = new IdlestateModel({
            employee_id: employeeData._id,
            start_time: end_time - totalTimeRange * 1000,
            end_time: end_time,
            total_work_time: totalTimeRange,
            mouse_work_time: totalTimeRange - idleState.mouseIdleTime,
            key_work_time: totalTimeRange - idleState.keyIdleTime,
            s3shot_count: s3shot_count,
            s3shot_screen_array: s3shot_screen_array
        });
    }
    else {  // when idle time > idletime limit
        var end_time = new Date().getTime() - idleTime * 1000;
        var totalTimeRange = idleState.timeRange - idleTime;
        uploadStateData = new IdlestateModel({
            employee_id: employeeData._id,
            start_time: end_time - totalTimeRange * 1000,
            end_time: end_time,
            total_work_time: totalTimeRange,
            mouse_work_time: totalTimeRange - (idleState.mouseIdleTime - idleTime),
            key_work_time: totalTimeRange - (idleState.keyIdleTime - idleTime),
            s3shot_count: s3shot_count,
            s3shot_screen_array: s3shot_screen_array
        });
    }

    uploadStateData.save(function (err, IdlestateModel) {
        if (err)
            res.status(201).send("error");
        else
            res.status(200).json(idleState);
    });
}


const updateIdleData = async (idleState, savedData, res) => {
    console.log("updateIdle");
    var employeeData = idleState.employeeData;
    var s3shot_count = idleState.s3shot_count;
    var s3shot_screen_array = idleState.s3shot_screen_array;
    var uploadStateData;
    var idleTime = idleState.idleTime;
    if (idleTime == 0) {  // normal save idle state
        var end_time = new Date().getTime();
        var totalTimeRange = idleState.timeRange;
        uploadStateData = {
            employee_id: employeeData._id,
            start_time: savedData.start_time,
            end_time: end_time,
            total_work_time: totalTimeRange + savedData.total_work_time,
            mouse_work_time: totalTimeRange - idleState.mouseIdleTime + savedData.mouse_work_time,
            key_work_time: totalTimeRange - idleState.keyIdleTime + savedData.key_work_time,
            s3shot_count: s3shot_count + savedData.s3shot_count,
            s3shot_screen_array: savedData.s3shot_screen_array.concat(s3shot_screen_array)
        };
    }
    else {  // when idle time > idletime limit
        var end_time = new Date().getTime() - idleTime * 1000;
        var totalTimeRange = idleState.timeRange - idleTime;
        uploadStateData = {
            employee_id: employeeData._id,
            start_time: savedData.start_time,
            end_time: end_time,
            total_work_time: totalTimeRange + savedData.total_work_time,
            mouse_work_time: totalTimeRange - (idleState.mouseIdleTime - idleTime) + savedData.mouse_work_time,
            key_work_time: totalTimeRange - (idleState.keyIdleTime - idleTime) + savedData.key_work_time,
            s3shot_count: s3shot_count + savedData.s3shot_count,
            s3shot_screen_array: savedData.s3shot_screen_array.concat(s3shot_screen_array)
        };
    }

    console.log(uploadStateData);
    console.log(savedData._id);
    await IdlestateModel.findOneAndUpdate(
        {
            _id: savedData._id,
        }, uploadStateData
    )
    res.status(200).json(idleState);
}