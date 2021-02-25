

let mongoose = require('mongoose'), Schema = mongoose.Schema;

mongoose.connect('mongodb://mongo', {useNewUrlParser: true});

let participantSchema = new Schema({
	id: {type: String, required:true},
	name: {type: String},
	email: {type: String},
	csr: {type: String},
	createdAt : {type:Date, default: Date.now}
}, { collection: "particiant"});

let connectorSchema = new Schema({
	id: {type:String, required: true},
	participant: {type: String, required: true},
	name: {type: String},
	contact_name: {type: String},
	contact_email: {type: String},
	csr: {type: String},
	securityProfile: {type:String, default: "idsc:BASE_SECURITY_PROFILE"},
	extendedGuarantee: {type: String, default: "idsc:USAGE_CONTROL_POLICY_ENFORCEMENT"},
	createdAt : {type:Date, default: Date.now}
}, {collection: "connector" });

let appSchema = new Schema({
	
	source: {type: String},
	metadata: {
		id: {type: String, required: true},
		name: String,
		keywords: [String],
		description: String,
		introduction: String
	},
	artifact: {
		image: String,
		ports: [{ name: String, port: Number }],
		settings: [ { name: String, type: {type: String, enum:['string', 'number', 'url']}, required: {type: Boolean, default: false} } ],
		volumes: [ {name: String, mountPoint: String} ]
	},
	owner_connectorID: {type: String}
});
appSchema.index({'$**': 'text'});

mongoose.model('participant', participantSchema);
mongoose.model('connector', connectorSchema);
mongoose.model('app', appSchema);

module.exports = mongoose;
