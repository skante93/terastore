var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');

module.exports = (db)=>{
	let participantModel = db.model('participant');
	let connectorModel = db.model('connector');

	router.get('/', function(req, res, next) {
		res.locals.title = "DAPS registration";

		participantModel.find({}, (err, p)=>{
			res.locals.participants = p;
			connectorModel.find({}, (err, c)=>{
				res.locals.connectors = c;
				res.render('register');
			});
		});
	});

	router.post('/participant', bodyParser.urlencoded(), bodyParser.json(), (req, res, next)=>{
		//console.log("req, body : ", req.body);

		let p = new participantModel({id: req.body.participantID, name: req.body.name, email: req.body.email });
		
		p.save((err)=>{
			res.redirect('/register');
		});
	});

	router.post('/connector', bodyParser.urlencoded(), bodyParser.json(), (req, res, next)=>{
		console.log("req, body : ", req.body);

		let c = new connectorModel({
			participant: req.body.participantID, 
			id: req.body.connectorID, 
			name: req.body.name, 
			contact_name: req.body.contact_name, 
			contact_email: req.body.contact_email 
		});
		
		c.save((err)=>{
			res.redirect('/register');
		});

	});

	return router;
}
