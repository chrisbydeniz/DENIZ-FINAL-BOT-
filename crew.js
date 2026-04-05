import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import pino from 'pino';
import handleIncomingMessage from './events/messageHandler.js';
import configmanager from './utils/ConfigManager.js';

const data = 'sessionData';

async function connectToWhatsapp() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(data);

    const sock = makeWASocket({
        version: version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['00u43 byDeniz', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 QR Code:');
            console.log(qr);
        }

        if (connection === 'open') {
            console.log('✅ 00u43 byDeniz connecté !');
            console.log('📝 Préfixe: .v');
            console.log('👑 Owner: 33753191305');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconnexion...');
                connectToWhatsapp();
            }
        }
    });

    sock.ev.on('messages.upsert', async (msg) => {
        if (msg.messages && msg.messages[0]) {
            await handleIncomingMessage(sock, { messages: msg.messages });
        }
    });

    setTimeout(async () => {
        const number = "33753191305";
        try {
            const code = await sock.requestPairingCode(number, 'DIGIXBOT');
            console.log(`📲 CODE DE PAIRE: ${code}`);
            console.log(`👉 WhatsApp → Paramètres → Appareils liés → Lier un appareil`);
        } catch (e) {
            console.log("⚠️ Utilise le QR code");
        }
    }, 5000);
}

export default connectToWhatsapp;
