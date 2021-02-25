

//const bodyParser = require('body-parser'), 

const express = require('express'), app = express(), logger = require('morgan'), createError = require('http-errors'), jwt = require('jsonwebtoken');

var path = require('path');

app.use(logger('dev'));

//app.use(bodyParser.json());
let db = require('./db');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/', require('./routes/index'));

app.use('/register', require('./routes/register')(db));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500).json({ status: err.status, message: err.message, stack: err.stack });
});

app.listen(3000, ()=>{ console.log("\n\t ** DAPS started ** "); })

