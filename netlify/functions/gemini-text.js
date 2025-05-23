// netlify/functions/gemini-text.js
// const fetch = require('node-fetch'); // Descomenta si es necesario

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El "prompt" es requerido.' }),
            };
        }

        const apiKey = process.env.GOOGLE_GEMINI_API_KEY; // Tu clave de API de Google para Gemini (texto)
         if (!apiKey) {
            console.error("Error: GOOGLE_GEMINI_API_KEY no está configurada en las variables de entorno de Netlify.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error de configuración del servidor: Clave de API de Gemini no encontrada.' }),
            };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };

        console.log(`[Netlify Fn gemini-text] Enviando a Gemini API. Prompt: ${prompt.substring(0, 50)}...`);

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error(`[Netlify Fn gemini-text] Error de Google Gemini API (${apiResponse.status}):`, responseData);
            const errorDetail = responseData.error ? responseData.error.message : `Error de API ${apiResponse.status}`;
            return {
                statusCode: apiResponse.status,
                body: JSON.stringify({ error: "Error al generar texto desde Google", details: errorDetail, googleResponse: responseData }),
            };
        }

        // Devuelve la respuesta exitosa de la API de Gemini tal cual la espera el frontend
        console.log("[Netlify Fn gemini-text] Texto generado exitosamente.");
        return {
            statusCode: 200,
            body: JSON.stringify(responseData), // Contiene la propiedad "candidates"
        };

    } catch (error) {
        console.error('[Netlify Fn gemini-text] Error interno:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor en la función de texto.', details: error.message }),
        };
    }
};
