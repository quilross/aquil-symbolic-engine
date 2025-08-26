export const send = (status, data) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' }
  });

export const readJSON = async (req) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};
