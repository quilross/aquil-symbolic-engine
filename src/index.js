export default {
    async fetch(req, env, ctx) {
        const url = new URL(req.url);

        const send = (status, data) =>
            new Response(JSON.stringify(data), {
                status,
                headers: { 'content-type': 'application/json' }
            });

        // --- Auth: Bearer token ---
        // const auth = req.headers.get('authorization') || '';
        // const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        // if (!token || token !== env.SECRET_API_KEY) return send(401, { error: 'unauthorized' });

        // Helper: try to parse JSON body
        const readJSON = async () => {
            try { return await req.json(); } catch { return {}; }
        };


        // Delegate log/retrieve endpoints to unified actions.js
        // Import the handler
        try {
            const { handleActions } = await import('./actions.js');
            const handled = await handleActions(req, env);
            if (handled) return handled;
        } catch (e) {
            // If import fails, continue to legacy handling
        }

        return send(404, { error: 'not_found' });
    }
    };

