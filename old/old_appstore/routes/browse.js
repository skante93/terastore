var express = require('express');
var router = express.Router();




module.exports = (conf)=>{
	// setInterval(()=>{
	// 	console.log(conf.apps);
	// }, 10*1000);
	
	let appModel = conf.db.model('app');

	let fetchCatalog = (cb)=>{
		appModel.find({}, (err, a)=>{
			if (err){
				console.log(err);
				return cb(err);
			}
			let apps = a.concat(conf.mk_apps);/*.map(app => {
				let catalog_entry = {
					"@id": app.id,
				    "@type": [
						"ids:AppResource"
					],
					"ids:description": app.metadata.description,
				    "ids:title": app.metadata.name,
				    "ids:comment": app.metadata.introduction,
				    "ids:keyword": app.metadata.keywords
				}

				return catalog_entry;
			});
			*/

			cb(null, apps);
		});
	}

	router.get('/', function(req, res, next) {
		res.locals.title = 'Browse AppStore Catalog';
		
		fetchCatalog((err, cat)=>{
			res.locals.apps = cat;
			res.render('browse');
		});
		
	});

	router.post('/create', (req, res, next)=>{
		//

	});
	return router;
}