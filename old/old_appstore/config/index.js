
const YAML = require('yaml'), fs = require('fs');
const request = require('request');

let settings = YAML.parse(fs.readFileSync(process.cwd()+'/settings/settings.yaml', {encoding: 'utf8'}));
exports.settings = settings;

let openAPI = YAML.parse(fs.readFileSync(process.cwd()+'/settings/openapi.yaml', {encoding: 'utf8'}));
exports.openAPI = openAPI;

// let selfDescription = require(process.cwd()+'/settings/self-description.json');
// exports.selfDescription = selfDescription;

exports.mk_apps = [];

let refreshCatalog = ()=>{
	//console.log("settings : ", settings);
	//console.log("calling : ", settings.marketplaceAPIURL+'/workshops', '...');
	request.get(settings.marketplaceAPIURL+'/workshops', (err, res, body)=>{
		if (err){
			console.log(`err: ${err}`); 
		}
		else if (res.statusCode != 200){
			console.log(body.error);
			//console.log(` statusCode: ${res.statusCode} | body : ${body}`);
		}
		else{
			//console.log(JSON.parse(body).response.filter(e => e.metadata.type == 'app'));

			exports.mk_apps = JSON.parse(body).response.filter(e => e.metadata.type == 'app').map((e)=>{
				let spec = {
					id: settings.id+'/apps/'+e._id.toString(),
					metadata: {
						introduction: e.metadata.introduction,
						name: e.metadata.name,
						description: e.metadata.description,
						keywords: e.metadata.keywords instanceof Array ? e.metadata.keywords : []
					},
					spec:{
						image: e.spec.image,
						ports: e.spec.ports,
						settings: e.spec.settings,
						volumes: e.spec.volumes
					},
					connector: settings.id
				}
				spec.metadata.keywords.push('from:marketplace');
				
				return spec;
			});
			//console.log(apps);
		}
	})
}

refreshCatalog();
setInterval(refreshCatalog, 1000*60);

exports.db = require('./db');