import configmanager from "./utils/ConfigManager.js";

const number = "33753191305";

configmanager.config.users[number] = {
    sudoList: ['33753191305@s.whatsapp.net'],
    tagAudioPath: "database/DigiX.mp3",
    antilink: false,
    response: true,
    autoreact: false,
    prefix: ".v",
    reaction: "👑",
    welcome: false,
    record: false,
    type: false,
    publicMode: false,
};
configmanager.save();

configmanager.premiums.premiumUser[`p`] = {
    premium: number,
} 
configmanager.saveP();

console.log("✅ Test configuration saved!");
