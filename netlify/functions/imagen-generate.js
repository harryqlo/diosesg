// netlify/functions/imagen-generate.js

// Importa 'node-fetch' si estás usando una versión de Node.js en Netlify que no lo incluye globalmente.
// En Netlify, las funciones suelen ejecutarse en un entorno Node.js.
// Para instalarlo en tu proyecto localmente (si pruebas localmente con netlify dev): npm install node-fetch
// const fetch = require('node-fetch'); // Descomenta si es necesario, o usa el fetch global si está disponible.

exports.handler = async function(event, context) {
    // Solo permitir peticiones POST
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

        const apiKey = process.env.GOOGLE_IMAGEN_API_KEY; // Tu clave de API de Google para Imagen
        if (!apiKey) {
            console.error("Error: GOOGLE_IMAGEN_API_KEY no está configurada en las variables de entorno de Netlify.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error de configuración del servidor: Clave de API de Imagen no encontrada.' }),
            };
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
        
        const payload = {
            instances: [{ prompt: prompt }],
            parameters: { sampleCount: 1 }
        };

        console.log(`[Netlify Fn imagen-generate] Enviando a Imagen API. Prompt: ${prompt.substring(0, 50)}...`);

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error(`[Netlify Fn imagen-generate] Error de Google Imagen API (${apiResponse.status}):`, responseData);
            // Devuelve la estructura de error de Google si está disponible, o un error genérico.
            const errorDetail = responseData.error ? responseData.error.message : `Error de API ${apiResponse.status}`;
            return {
                statusCode: apiResponse.status,
                body: JSON.stringify({ error: "Error al generar la imagen desde Google", details: errorDetail, googleResponse: responseData }),
            };
        }
        
        // Devuelve la respuesta exitosa de la API de Imagen tal cual la espera el frontend
        console.log("[Netlify Fn imagen-generate] Imagen generada exitosamente.");
        return {
            statusCode: 200,
            body: JSON.stringify(responseData), // Contiene la propiedad "predictions"
        };

    } catch (error) {
        console.error('[Netlify Fn imagen-generate] Error interno:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor en la función de imagen.', details: error.message }),
        };
    }
};
