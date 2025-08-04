// Existing imports and code

// Add the new route handling code
router.get("/system/health", () => {
  return new Response(JSON.stringify({
    status: "ok",
    message: "Signalhaven backend is operational.",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});

// Add the logging statement
console.log("Routing request:", request.method, request.url);

// Existing code continues...