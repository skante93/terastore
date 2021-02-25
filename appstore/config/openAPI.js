
const YAML = require('yaml'), fs = require('fs');

let openAPI = YAML.parse(fs.readFileSync(process.cwd()+'/settings/openapi.yaml', {encoding: 'utf8'}));

// Process (check) OpenAPI specs

module.exports = openAPI;