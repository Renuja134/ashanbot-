const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const { state, saveState } = useSingleFileAuthState('./auth_info.json');
const puppeteer = require('puppeteer');

async function getSignal() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto('https://aviator-next.spribegaming.com/?user=1246786037&token=4b4416d8-5b33-4e81-888d-01fc10c0b300&lang=en&currency=LKR&operator=1xbetcore&return_url=https://1xbet.lk/slots?locale=en_GB', { waitUntil: 'networkidle0' });

    await page.waitForSelector('.history-item', { timeout: 15000 });

    const signal = await page.evaluate(() => {
        const item = document.querySelector('.history-item');
        const id = item?.querySelector('.round-id')?.textContent.trim() || 'ID නැහැ';
        const bet = item?.querySelector('.coefficient')?.textContent.trim() || 'බෙට් නැහැ';
        return { id, bet };
    });

    const time = new Date().toLocaleTimeString('si-LK', { hour: 'numeric', minute: 'numeric', hour12: true });

    await browser.close();

    return `📡 අශන් බොට් සික්නල්\n\n🆔 ID: ${signal.id}\n🎯 බෙට් එක: ${signal.bet}\n⏰ වේලාව: ${time}\n\n🔥 ලයු සික්නල්: දැන් බෙට් එකක් දැමීමට සුදුසු වේලාවක්!`;
}

async function startBot() {
    const sock = makeWASocket({ auth: state });
    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const sender = msg.key.remoteJid;

        if (text?.toLowerCase().includes('ashanbot')) {
            const signalText = await getSignal();
            await sock.sendMessage(sender, { text: signalText });
        }
    });
}

startBot();
