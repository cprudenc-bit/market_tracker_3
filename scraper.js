const axios = require('axios');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(TOKEN);

// Configuración de búsqueda
const KEYWORD = 'seiko 5';
const HISTORY_FILE = './history.json';
const WALLAPOP_API = `https://api.wallapop.com/api/v3/general/search?keywords=${encodeURIComponent(KEYWORD)}&filters_source=search_box&order_by=newest`;

async function run() {
    // 1. Cargar historial
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE));
    }

    try {
        // 2. Llamada a la API de Wallapop
        const response = await axios.get(WALLAPOP_API, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const items = response.data.search_objects || [];
        let newItemsFound = false;

        for (const item of items) {
            // 3. Verificar si el ID ya existe en el historial
            if (!history.includes(item.id)) {
                const message = `⌚ *¡Nuevo Seiko 5!*\n\n💰 Precio: ${item.price.amount} ${item.price.currency}\n📝 ${item.title}\n\n🔗 [Ver en Wallapop](https://es.wallapop.com/item/${item.web_slug})`;
                
                await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
                
                history.push(item.id);
                newItemsFound = true;
            }
        }

        // 4. Guardar historial actualizado (máximo 200 IDs para no saturar el JSON)
        if (newItemsFound) {
            const updatedHistory = history.slice(-200);
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(updatedHistory, null, 2));
            console.log("Historial actualizado y mensaje enviado.");
        } else {
            console.log("No hay novedades.");
        }

    } catch (error) {
        console.error("Error en la búsqueda:", error.message);
    }
}

run();