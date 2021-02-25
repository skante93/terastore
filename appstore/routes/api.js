
const express = require('express'), router = express.Router(),  bodyParser = require('body-parser');

let db = require('../config/db'), appModel = db.model('app'), settings = require('../config/settings');

router.use(bodyParser.json());

router.get('/apps', function(req, res, next){
	console.log("* Midlle 1");
	//res.send('respond with a resource');
	appModel.find({}, (err, apps)=>{
		if (err){
			return res.status(500).json({message: err.toString() });
		}
		res.json(apps.map(app=> app.metadata));
	});
});

router.post('/apps', function(req, res, next) {
	console.log("* Midlle 2");
	
	let metadata = req.body;
	if (!metadata || Object.keys(metadata).length == 0){
		return res.status(500).json({ message: "an appMetadata Object is expected" });
	}

	if ( !('name' in metadata && metadata.name) ){
		return res.status(500).json({ message: "field \"name\" is mandatory" });
	}
	metadata.id = settings.id+'/apps/'+db.Types.ObjectId();

	new appModel({ metadata: metadata}).save((err, app)=>{
		if (err){
			return res.status(500).json({message: err.toString() });
		}
		res.json(app.metadata);
	});
});

router.get('/apps/:appID/metadata', function(req, res, next) {
	console.log("* Midlle 3");
	
	appModel.findOne({"metadata.id": req.params.appID}, (err, app)=>{
		//
		if (err){
			console.log("err : ", err);
			return res.status(500).json({message: err.toString() });
		}
		if (!app){
			return res.status(404).json({message: "not found" });
		}
		res.json(app.metadata);
	});
});

router.put('/apps/:appID/metadata', function(req, res, next) {
	console.log("* Midlle 4");
	
	let metadata = req.body;

	appModel.findOne({"metadata.id": req.params.appID}, (err, app)=>{
		//
		if (err){
			return res.status(500).json({message: err.toString() });
		}
		if (!app){
			return res.status(404).json({ message: "not found" });
		}

		metadata.id = app.metadata.id;

		appModel.update({"metadata.id": req.params.appID}, {$set: {metadata: metadata}}, (err, editInfo)=>{
			//
			if (err){
				return res.status(500).json({message: err.toString() });
			}

			res.json(metadata);
		});
		
	});
});

router.get('/apps/:appID/artifact', function(req, res, next) {
	console.log("* Midlle 5");
	
	appModel.findOne({"metadata.id": req.params.appID}, (err, app)=>{
		//
		if (err){
			return res.status(500).json({message: err.toString() });
		}
		if (!app.artifact.image){
			return res.status(404).json({message: 'not defined'});
		}

		res.json(app.artifact);
	});
});

router.put('/apps/:appID/artifact', function(req, res, next) {
	console.log("* Midlle 6");
	
	let artifact = req.body;

	appModel.findOne({"metadata.id": req.params.appID}, (err, app)=>{
		//
		if (err){
			return res.status(500).json({message: err.toString() });
		}
		if (!app){
			return res.status(404).json({ message: "not found" });
		}

		appModel.update({"metadata.id": req.params.appID}, {$set: {artifact: artifact}}, (err, editInfo)=>{
			//
			if (err){
				return res.status(500).json({message: err.toString() });
			}

			res.json(app.artifact);
		});
		
	});

});

router.get('/apps/search', function(req, res, next) {
	console.log("* Midlle 7");
	
	appModel.find({$text : {$search : req.query.q } }).exec((err, apps)=>{
		if (err){
			return res.status(500).json({message: err.toString() });
		}

		res.json(apps.map(app=> app.metadata));
	});
});

module.exports = router;
