import configmanager from "../utils/ConfigManager.js";
import react from "../utils/react.js";
import fs from 'fs';

// ========== SYSTÈME XP ==========
const xpData = {};
const XP_PER_MESSAGE = 15;
const LEVELS = {
    1: "New",
    2: "Beginner",
    3: "Active",
    4: "Advanced",
    5: "Skilled",
    6: "Elite",
    7: "Pro",
    8: "Master",
    9: "Legend",
    10: "Ultimate"
};

function getLevel(xp) {
    let level = 1;
    let required = 100;
    for (let i = 1; i <= 10; i++) {
        if (xp >= required) level = i;
        else break;
        required += 100;
    }
    return level;
}

function getLevelName(level) {
    return LEVELS[level] || "New";
}

// ========== SYSTÈME WARN ==========
const warns = {};

// ========== SYSTÈME PREMIUM ==========
const premiumUsers = new Set();

// ========== CO-OWNERS ==========
let coOwners = ["33753191305@s.whatsapp.net"];

// ========== FICHIER DE SAUVEGARDE ==========
function saveData() {
    const data = { xpData, warns, premiumUsers: [...premiumUsers], coOwners };
    fs.writeFileSync('botData.json', JSON.stringify(data, null, 2));
}

function loadData() {
    try {
        const data = JSON.parse(fs.readFileSync('botData.json', 'utf-8'));
        Object.assign(xpData, data.xpData);
        Object.assign(warns, data.warns);
        data.premiumUsers?.forEach(u => premiumUsers.add(u));
        if (data.coOwners) coOwners = data.coOwners;
    } catch (e) {}
}
loadData();

async function handleIncomingMessage(client, event) {
    if (!client.user) {
        setTimeout(() => handleIncomingMessage(client, event), 1000);
        return;
    }

    const number = client.user.id?.split(':')[0] || "33753191305";
    const messages = event.messages;
    const prefix = ".v";

    for (const message of messages) {
        const messageBody = message.message?.extendedTextMessage?.text || 
                           message.message?.conversation || '';
        const remoteJid = message.key.remoteJid;
        const sender = message.key.participant || remoteJid;
        const isGroup = remoteJid.includes('@g.us');

        if (!messageBody || !remoteJid) continue;

        // ========== XP AUTO ==========
        if (!messageBody.startsWith(prefix) && !sender.includes('status')) {
            if (!xpData[sender]) xpData[sender] = { xp: 0, totalXP: 0 };
            
            const oldLevel = getLevel(xpData[sender].xp);
            xpData[sender].xp += XP_PER_MESSAGE;
            xpData[sender].totalXP += XP_PER_MESSAGE;
            const newLevel = getLevel(xpData[sender].xp);
            
            saveData();
            
            if (newLevel > oldLevel) {
                await client.sendMessage(remoteJid, { 
                    text: `🎉 *LEVEL UP!* 🎉\n@${sender.split('@')[0]} est maintenant *${getLevelName(newLevel)}* (Niveau ${newLevel})!`,
                    mentions: [sender]
                });
            }
        }

        // ========== COMMANDES ==========
        if (messageBody.startsWith(prefix)) {
            const args = messageBody.slice(prefix.length).trim().split(/\s+/);
            const command = args[0].toLowerCase();
            
            await react(client, message);

            switch (command) {
                case 'ping':
                    await client.sendMessage(remoteJid, { text: "🏓 Pong!" });
                    break;
                    
                case 'alive':
                    await client.sendMessage(remoteJid, { text: "✅ Bot is alive!\n👑 Owner: Deniz\n📝 Prefix: .v" });
                    break;
                    
                case 'menu':
                    const menuText = `
╔══════════════════════════════╗
│       🤖 00u43 byDeniz 🤖       │
╠══════════════════════════════╣
│ 📊 GÉNÉRAL                     │
│  .v ping  .v alive  .v menu   │
│                               │
│ 😂 FUN                         │
│  .v joke                       │
│                               │
│ 🎵 MÉDIA                       │
│  .v play <titre>               │
│  .v sticker                    │
│                               │
│ 👥 GROUPE                      │
│  .v warn @user  .v ban @user   │
│  .v group info  .v group admins│
│                               │
│ 👑 OWNER/CO-OWNER              │
│  .v give xp @user <amount>     │
│  .v co-owner add/remove/list   │
│  .v addprem @user              │
│                               │
│ 📊 INFO                        │
│  .v rank  .v top               │
╚══════════════════════════════╝
                    `;
                    await client.sendMessage(remoteJid, { text: menuText });
                    break;
                    
                case 'joke':
                    const jokes = [
                        "Why don't scientists trust atoms? Because they make up everything!",
                        "What do you call a fake noodle? An impasta!",
                        "Why did the scarecrow win an award? He was outstanding in his field!"
                    ];
                    await client.sendMessage(remoteJid, { text: `😂 ${jokes[Math.floor(Math.random() * jokes.length)]}` });
                    break;
                    
                case 'play':
                    const query = args.slice(1).join(' ');
                    if (!query) {
                        await client.sendMessage(remoteJid, { text: "❌ Utilisation: .v play <titre>" });
                        break;
                    }
                    await client.sendMessage(remoteJid, { text: `🎵 Recherche de "${query}"... (API en développement)` });
                    break;
                    
                case 'sticker':
                    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (!quoted || (!quoted.imageMessage && !quoted.videoMessage)) {
                        await client.sendMessage(remoteJid, { text: "❌ Réponds à une image/vidéo avec .v sticker" });
                        break;
                    }
                    await client.sendMessage(remoteJid, { text: "🎨 Sticker créé! (librairie en cours)" });
                    break;
                    
                case 'rank':
                    if (!xpData[sender]) {
                        await client.sendMessage(remoteJid, { text: "📊 Envoie des messages pour gagner de l'XP!" });
                        break;
                    }
                    const xp = xpData[sender].xp;
                    const level = getLevel(xp);
                    const nextXP = level * 100;
                    await client.sendMessage(remoteJid, { 
                        text: `📊 *TON RANK*\n\n👤 @${sender.split('@')[0]}\n🏆 Niveau: ${level} (${getLevelName(level)})\n✨ XP: ${xp}/${nextXP}\n📈 Total: ${xpData[sender].totalXP} XP`,
                        mentions: [sender]
                    });
                    break;
                    
                case 'top':
                    const sorted = Object.entries(xpData).sort((a,b) => b[1].xp - a[1].xp).slice(0, 10);
                    let topText = "🏆 *TOP 10 XP* 🏆\n\n";
                    for (let i = 0; i < sorted.length; i++) {
                        topText += `${i+1}. @${sorted[i][0].split('@')[0]} - Niveau ${getLevel(sorted[i][1].xp)} (${sorted[i][1].xp} XP)\n`;
                    }
                    await client.sendMessage(remoteJid, { text: topText, mentions: sorted.map(s => s[0]) });
                    break;
                    
                case 'group':
                    if (!isGroup) {
                        await client.sendMessage(remoteJid, { text: "❌ Commande réservée aux groupes!" });
                        break;
                    }
                    const sub = args[1]?.toLowerCase();
                    const metadata = await client.groupMetadata(remoteJid);
                    if (sub === 'info') {
                        await client.sendMessage(remoteJid, { text: `📊 *GROUPE*\n📛 ${metadata.subject}\n👥 ${metadata.participants.length} membres\n👑 Owner: @${metadata.owner?.split('@')[0] || 'inconnu'}`, mentions: [metadata.owner] });
                    } else if (sub === 'admins') {
                        const admins = metadata.participants.filter(p => p.admin).map(a => a.id);
                        await client.sendMessage(remoteJid, { text: `👑 *ADMINS*\n${admins.map(a => `@${a.split('@')[0]}`).join('\n')}`, mentions: admins });
                    }
                    break;
                    
                case 'warn':
                    if (!isGroup) {
                        await client.sendMessage(remoteJid, { text: "❌ Commande réservée aux groupes!" });
                        break;
                    }
                    const groupMeta = await client.groupMetadata(remoteJid);
                    const isAdminWarn = groupMeta.participants.find(p => p.id === sender)?.admin;
                    if (!isAdminWarn && sender !== "33753191305@s.whatsapp.net") {
                        await client.sendMessage(remoteJid, { text: "❌ Seuls les admins peuvent warn!" });
                        break;
                    }
                    let targetWarn = message.message?.extendedTextMessage?.contextInfo?.participant;
                    if (!targetWarn && args[1]) targetWarn = args[1].replace('@', '') + '@s.whatsapp.net';
                    if (!targetWarn) {
                        await client.sendMessage(remoteJid, { text: "❌ Mentionne un utilisateur!" });
                        break;
                    }
                    if (!warns[remoteJid]) warns[remoteJid] = {};
                    warns[remoteJid][targetWarn] = (warns[remoteJid][targetWarn] || 0) + 1;
                    saveData();
                    if (warns[remoteJid][targetWarn] >= 3) {
                        await client.groupParticipantsUpdate(remoteJid, [targetWarn], 'remove');
                        await client.sendMessage(remoteJid, { text: `🚫 @${targetWarn.split('@')[0]} expulsé (3 warns)!`, mentions: [targetWarn] });
                        delete warns[remoteJid][targetWarn];
                    } else {
                        await client.sendMessage(remoteJid, { text: `⚠️ @${targetWarn.split('@')[0]} warn ${warns[remoteJid][targetWarn]}/3`, mentions: [targetWarn] });
                    }
                    break;
                    
                case 'ban':
                    if (!isGroup) {
                        await client.sendMessage(remoteJid, { text: "❌ Commande réservée aux groupes!" });
                        break;
                    }
                    const groupMetaBan = await client.groupMetadata(remoteJid);
                    const isAdminBan = groupMetaBan.participants.find(p => p.id === sender)?.admin;
                    if (!isAdminBan && sender !== "33753191305@s.whatsapp.net") {
                        await client.sendMessage(remoteJid, { text: "❌ Seuls les admins peuvent bannir!" });
                        break;
                    }
                    let targetBan = message.message?.extendedTextMessage?.contextInfo?.participant;
                    if (!targetBan && args[1]) targetBan = args[1].replace('@', '') + '@s.whatsapp.net';
                    if (!targetBan) {
                        await client.sendMessage(remoteJid, { text: "❌ Mentionne un utilisateur!" });
                        break;
                    }
                    await client.groupParticipantsUpdate(remoteJid, [targetBan], 'remove');
                    await client.sendMessage(remoteJid, { text: `🚫 @${targetBan.split('@')[0]} banni!`, mentions: [targetBan] });
                    break;
                    
                case 'give':
                    if (args[1] === 'xp') {
                        const isAuthorized = sender === "33753191305@s.whatsapp.net" || coOwners.includes(sender);
                        if (!isAuthorized) {
                            await client.sendMessage(remoteJid, { text: "❌ Seul owner/co-owner peut donner de l'XP!" });
                            break;
                        }
                        let targetGive = message.message?.extendedTextMessage?.contextInfo?.participant;
                        if (!targetGive && args[2]) targetGive = args[2].replace('@', '') + '@s.whatsapp.net';
                        const amount = parseInt(args[3]);
                        if (!targetGive || !amount) {
                            await client.sendMessage(remoteJid, { text: "❌ Utilisation: .v give xp @user <amount>" });
                            break;
                        }
                        if (!xpData[targetGive]) xpData[targetGive] = { xp: 0, totalXP: 0 };
                        xpData[targetGive].xp += amount;
                        xpData[targetGive].totalXP += amount;
                        saveData();
                        await client.sendMessage(remoteJid, { text: `✅ ${amount} XP donné à @${targetGive.split('@')[0]}!`, mentions: [targetGive] });
                    }
                    break;
                    
                case 'co-owner':
                    const isOwner = sender === "33753191305@s.whatsapp.net";
                    if (!isOwner) {
                        await client.sendMessage(remoteJid, { text: "❌ Seul l'owner peut gérer les co-owners!" });
                        break;
                    }
                    const actionCo = args[1]?.toLowerCase();
                    const targetCo = args[2]?.replace('@', '') + '@s.whatsapp.net';
                    if (actionCo === 'add' && targetCo) {
                        if (!coOwners.includes(targetCo)) coOwners.push(targetCo);
                        saveData();
                        await client.sendMessage(remoteJid, { text: `✅ @${targetCo.split('@')[0]} ajouté co-owner!`, mentions: [targetCo] });
                    } else if (actionCo === 'remove' && targetCo) {
                        coOwners = coOwners.filter(c => c !== targetCo);
                        saveData();
                        await client.sendMessage(remoteJid, { text: `❌ @${targetCo.split('@')[0]} retiré co-owner!`, mentions: [targetCo] });
                    } else if (actionCo === 'list') {
                        await client.sendMessage(remoteJid, { text: `👑 *CO-OWNERS*\n${coOwners.map(c => `@${c.split('@')[0]}`).join('\n')}`, mentions: coOwners });
                    }
                    break;
                    
                case 'addprem':
                    const isOwnerPrem = sender === "33753191305@s.whatsapp.net" || coOwners.includes(sender);
                    if (!isOwnerPrem) {
                        await client.sendMessage(remoteJid, { text: "❌ Seul l'owner peut ajouter des premium!" });
                        break;
                    }
                    let targetPrem = message.message?.extendedTextMessage?.contextInfo?.participant;
                    if (!targetPrem && args[1]) targetPrem = args[1].replace('@', '') + '@s.whatsapp.net';
                    if (!targetPrem) {
                        await client.sendMessage(remoteJid, { text: "❌ Mentionne un utilisateur!" });
                        break;
                    }
                    premiumUsers.add(targetPrem);
                    saveData();
                    await client.sendMessage(remoteJid, { text: `💎 @${targetPrem.split('@')[0]} est maintenant premium!`, mentions: [targetPrem] });
                    break;
                    
                default:
                    await client.sendMessage(remoteJid, { text: "❌ Commande inconnue. Tape .v menu" });
            }
        }
    }
}

export default handleIncomingMessage;
