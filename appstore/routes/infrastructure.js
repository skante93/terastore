
const express = require('express'), router = express.Router(), multiparty = require('multiparty');

var FormData = require('form-data');


// Parsing multipart veriables

module.exports = (conf)=>{
	
	let { parseMultipartHeaderAndPayload , dapsAuth, idsMessagesHandler} = conf.utils.middlewares;
	
	let errHandler = (err, req, res, next)=>{
		res.status(err.status || 500).json({ status: err.status, message: err.message, stack: err.stack });
	}

	router.post('/', [parseMultipartHeaderAndPayload, dapsAuth, idsMessagesHandler, errHandler]);

	return router;
}