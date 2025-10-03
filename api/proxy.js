// api/proxy.js

// La función principal que maneja la solicitud HTTP
export default async function handler(req, res) {
    // 1. Obtener la URL objetivo del argumento 'url'
    const targetUrl = req.query.url;

    // 2. Validación básica de la URL
    if (!targetUrl) {
        res.status(400).send('Error: El parámetro "url" es obligatorio.');
        return;
    }

    try {
        // 3. Realizar la solicitud HTTP a la URL objetivo
        const response = await fetch(targetUrl);

        // 4. Manejar errores de la solicitud (códigos de estado no exitosos)
        if (!response.ok) {
            // Devuelve el código de estado y un mensaje de error del servidor objetivo
            res.status(response.status).send(`Error al obtener la URL: ${response.statusText}`);
            return;
        }

        // 5. Clonar los headers de la respuesta original, pero eliminar algunos que pueden causar problemas (ej. Content-Encoding, Content-Length)
        const headers = new Headers(response.headers);
        headers.delete('content-encoding');
        headers.delete('content-length');

        // 6. Configurar los headers de la respuesta de Vercel
        // Puedes agregar headers CORS si es necesario para el consumo desde el navegador
        res.setHeader('Access-Control-Allow-Origin', '*');
        headers.forEach((value, name) => {
            res.setHeader(name, value);
        });

        // 7. Devolver el contenido de la respuesta (raw/crudo)
        // Usamos .text() o .json() o .buffer() dependiendo de lo que esperes, pero .text() es común para "raw"
        const contentType = headers.get('content-type') || 'text/plain';

        if (contentType.includes('application/json')) {
             // Si es JSON, Vercel puede manejar la serialización
            const jsonBody = await response.json();
            res.status(200).json(jsonBody);
        } else {
            // Para otros tipos (HTML, XML, texto puro, etc.)
            const rawBody = await response.text();
            res.status(200).send(rawBody);
        }

    } catch (error) {
        // 8. Manejar errores de red o del proceso de fetch
        console.error('Proxy Error:', error.message);
        res.status(500).send(`Error interno del proxy: ${error.message}`);
    }
}