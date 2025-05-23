// netlify/functions/gemini-text.js

exports.handler = async function(event, context) {
    console.log("[Netlify Fn gemini-text] Iniciando ejecución de la función.");
    console.log("[Netlify Fn gemini-text] Variables de entorno disponibles (claves):", Object.keys(process.env).join(', ')); // Log para ver todas las claves de entorno

    if (event.httpMethod !== 'POST') {
        console.warn("[Netlify Fn gemini-text] Método HTTP no permitido:", event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            console.warn("[Netlify Fn gemini-text] Prompt no encontrado en el cuerpo de la petición.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El "prompt" es requerido.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        
        // Log detallado para la clave API
        if (apiKey) {
            console.log("[Netlify Fn gemini-text] GOOGLE_GEMINI_API_KEY encontrada. Longitud:", apiKey.length); // Muestra la longitud para verificar que no esté vacía
        } else {
            console.error("[Netlify Fn gemini-text] FATAL ERROR: La variable de entorno GOOGLE_GEMINI_API_KEY NO está configurada o es undefined/null en Netlify.");
            // Log adicional para ver si existe pero con otro casing, aunque process.env suele ser case-sensitive en Node.
            const envKeys = Object.keys(process.env);
            const geminiKeyVariant = envKeys.find(key => key.toUpperCase() === 'GOOGLE_GEMINI_API_KEY');
            if (geminiKeyVariant && geminiKeyVariant !== 'GOOGLE_GEMINI_API_KEY') {
                 console.error(`[Netlify Fn gemini-text] Se encontró una variante: '${geminiKeyVariant}'. ¿Es un error de mayúsculas/minúsculas?`);
            }

            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error de configuración del servidor: Clave de API de Gemini no encontrada en el entorno de la función.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };

        console.log(`[Netlify Fn gemini-text] Iniciando llamada a Google Gemini API. Prompt (inicio): ${prompt.substring(0, 50)}...`);

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await apiResponse.json(); 

        if (!apiResponse.ok) {
            console.error(`[Netlify Fn gemini-text] Error desde Google Gemini API (${apiResponse.status}):`, JSON.stringify(responseData, null, 2));
            const errorDetail = responseData && responseData.error && responseData.error.message ? responseData.error.message : `Error de API ${apiResponse.status}`;
            return {
                statusCode: apiResponse.status, 
                body: JSON.stringify({ error: "Error al generar texto desde Google", details: errorDetail, googleResponse: responseData }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        console.log("[Netlify Fn gemini-text] Texto generado exitosamente por Google.");
        return {
            statusCode: 200,
            body: JSON.stringify(responseData), 
            headers: { 'Content-Type': 'application/json' },
        };

    } catch (error) {
        console.error('[Netlify Fn gemini-text] Error interno en la función:', error.toString(), error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor en la función de texto.', details: error.message }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};
