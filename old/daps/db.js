

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

mongoose.model('participant', participantSchema);
mongoose.model('connector', connectorSchema);

module.exports = mongoose;
