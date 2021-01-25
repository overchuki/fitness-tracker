const config_json = require('./config.json');

module.exports = {
    getMongoURL: () => {
        const ms = config_json['mongo'];
        return `mongodb+srv://${ms['username']}:${ms['password']}@${ms['host']}/${ms['db']}?retryWrites=true&w=majority`;
    },
    get: (key) => {
        return config_json[key];
    }
};