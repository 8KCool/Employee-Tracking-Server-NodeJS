const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    idleTimeLimit: { type: Number, required: true, default: 60 },
    screenShotInterval: { type: Number, required: true, default: 3 },
});

const EmployeeModel = mongoose.model('Employee', employeeSchema);

module.exports = EmployeeModel;

/*
    save data to database

*/
// var newEmp = new Employees({
//     name: username,
//     email: username + "@gmail.com",
//     password: pwd, 
//     idleTimeLimit: 60,
//     screenShotInterval: 3
// })
    
// newEmp.save(function(err, Person){
    // if(err)
    // res.render('show_message', {message: "Database error", type: "error"});
    // else
    // res.render('show_message', {
    //     message: "New person added", type: "success", person: personInfo});
// });