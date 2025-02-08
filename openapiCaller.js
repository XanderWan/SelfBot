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
                messages: [{ 
                    role: "system", 
                    content: "You are a precise analyzer that must identify EXACTLY 3 common themes from the provided chat history. You must format your response as a numbered list with exactly 3 items. Any other format or number of themes is incorrect and unacceptable. At the end of each line, add \"\\n\"" 
                },
                           { role: "user", content: chatContent }],
                max_tokens: 200
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const themes = data.choices[0].message.content;
        
        fs.writeFileSync('public/themes.txt', themes, 'utf8');
        console.log("Common themes saved to themes.txt");
    } catch (error) {
        console.error("Error processing chat history:", error);
    }
}


//analyzeChatHistory();

// Export the function
module.exports = { analyzeChatHistory };
