

const YAML = require('yaml'), fs = require('fs');

let settings = YAML.parse(fs.readFileSync(process.cwd()+'/settings/settings.yaml', {encoding: 'utf8'}));

// Process (check) settings

module.exports = settings;