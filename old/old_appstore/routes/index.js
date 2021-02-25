var express = require('express');
var router = express.Router();



module.exports = (conf)=>{

	router.get('/', function(req, res, next) {
		res.json(conf.selfDescription);
	});

	return router;
}