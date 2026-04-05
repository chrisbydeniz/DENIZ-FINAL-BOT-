import fs from 'fs';

const configPath = 'config.json';
const premiumPath = 'db.json';

let config = {};
let premiums = {};

if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} else {
    config = { users: {} };
}

if (fs.existsSync(premiumPath)) {
    premiums = JSON.parse(fs.readFileSync(premiumPath, 'utf-8'));
} else {
    premiums = { premiumUser: {} };
}

const saveConfig = () => {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

const savePremium = () => {
    fs.writeFileSync(premiumPath, JSON.stringify(premiums, null, 2));
};

export default {
    config,
    premiums,
    save: saveConfig,
    saveP: savePremium
};
