const fs = require('fs');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
const apiUrl = "https://api.openai.com/v1/chat/completions";

async function analyzeChatHistory() {
    try {
        const chatHistory = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
        const chatContent = chatHistory.map(entry => entry.content).join("\n");
        
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "system", content: "Analyze the following chat history and identify 5 common themes." },
                           { role: "user", content: chatContent }],
                max_tokens: 200
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const themes = data.choices[0].message.content;
        
        fs.writeFileSync('themes.txt', themes, 'utf8');
        console.log("Common themes saved to themes.txt");
    } catch (error) {
        console.error("Error processing chat history:", error);
    }
}


analyzeChatHistory();

// Export the function
module.exports = { analyzeChatHistory };
