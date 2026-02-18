export async function askLLM(prompt) {
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama3",
            prompt,
            stream: true
        }),
    });
    const data = await response.json();
    return data.response;
}
