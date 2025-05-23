// netlify/functions/imagen-generate.js

// En Netlify, el 'fetch' global suele estar disponible para versiones recientes de Node.js.
// Si encuentras errores relacionados con fetch, podrías necesitar instalar 'node-fetch':
// 1. En tu terminal, en la raíz de tu proyecto: npm init -y (si no tienes package.json)
// 2. Luego: npm install node-fetch
// 3. Y descomentar la siguiente línea:
// const fetch = require('node-fetch'); 

exports.handler = async function(event, context) {
    console.log("[Netlify Fn imagen-generate] Iniciando ejecución de la función.");
    // Opcional: Loguear todas las claves de entorno disponibles para depuración extrema.
    // console.log("[Netlify Fn imagen-generate] Variables de entorno disponibles (claves):", Object.keys(process.env).join(', '));

    if (event.httpMethod !== 'POST') {
        console.warn("[Netlify Fn imagen-generate] Método HTTP no permitido:", event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            console.warn("[Netlify Fn imagen-generate] Prompt no encontrado en el cuerpo de la petición.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El "prompt" es requerido.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const apiKey = process.env.GOOGLE_IMAGEN_API_KEY; 
        
        if (!apiKey) {
            console.error("[Netlify Fn imagen-generate] FATAL ERROR: La variable de entorno GOOGLE_IMAGEN_API_KEY NO está configurada o es undefined/null en Netlify.");
            const envKeys = Object.keys(process.env);
            const imagenKeyVariant = envKeys.find(key => key.toUpperCase() === 'GOOGLE_IMAGEN_API_KEY');
            if (imagenKeyVariant && imagenKeyVariant !== 'GOOGLE_IMAGEN_API_KEY') {
                 console.error(`[Netlify Fn imagen-generate] Se encontró una variante: '${imagenKeyVariant}'. ¿Es un error de mayúsculas/minúsculas?`);
            }
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error de configuración del servidor: Clave de API de Imagen no encontrada en el entorno de la función.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        } else {
            console.log("[Netlify Fn imagen-generate] GOOGLE_IMAGEN_API_KEY encontrada. Longitud:", apiKey.length);
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
        
        const payload = {
            instances: [{ prompt: prompt }],
            parameters: { sampleCount: 1 } // Generar una imagen por prompt
        };

        console.log(`[Netlify Fn imagen-generate] Iniciando llamada a Google Imagen API. Prompt (inicio): ${prompt.substring(0, 50)}...`);

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await apiResponse.json(); // Intentar parsear JSON siempre

        if (!apiResponse.ok) {
            console.error(`[Netlify Fn imagen-generate] Error desde Google Imagen API (${apiResponse.status}):`, JSON.stringify(responseData, null, 2));
            const errorDetail = responseData && responseData.error && responseData.error.message ? responseData.error.message : `Error de API ${apiResponse.status}`;
            return {
                statusCode: apiResponse.status, 
                body: JSON.stringify({ error: "Error al generar la imagen desde Google", details: errorDetail, googleResponse: responseData }),
                headers: { 'Content-Type': 'application/json' },
            };
        }
        
        console.log("[Netlify Fn imagen-generate] Imagen generada exitosamente por Google.");
        return {
            statusCode: 200,
            body: JSON.stringify(responseData), // El frontend espera el objeto con la propiedad "predictions"
            headers: { 'Content-Type': 'application/json' },
        };

    } catch (error) {
        console.error('[Netlify Fn imagen-generate] Error interno en la función:', error.toString(), error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor en la función de imagen.', details: error.message }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};
