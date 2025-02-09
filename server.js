const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const _ = require('lodash');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve static files from public directory
app.use('/static', express.static(path.join(__dirname, 'public')));

// Main dashboard route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes for data visualization

// Get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const data = await fs.readFile('community_data.json', 'utf8');
        const messages = JSON.parse(data);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error reading messages data' });
    }
});

// Get user activity statistics
app.get('/api/stats/user-activity', async (req, res) => {
    try {
        const data = await fs.readFile('community_data.json', 'utf8');
        const { messages } = JSON.parse(data);
        
        const userActivity = _.chain(messages)
            .groupBy('author.username')
            .map((userMessages, username) => ({
                username,
                messageCount: userMessages.length,
                totalCharacters: _.sumBy(userMessages, msg => msg.content.length),
                avgMessageLength: Math.round(_.meanBy(userMessages, msg => msg.content.length))
            }))
            .value();
        
        res.json(userActivity);
    } catch (error) {
        res.status(500).json({ error: 'Error processing user activity data' });
    }
});

// Get mentions analysis
app.get('/api/stats/mentions', async (req, res) => {
    try {
        // Read and parse the data file
        const data = await fs.readFile('community_data.json', 'utf8');
        const { messages } = JSON.parse(data);
        
        // Process user mentions and role mentions separately
        const mentionsAnalysis = messages.reduce((acc, msg) => {
            // Process user mentions
            msg.mentions.users.forEach(userId => {
                const existingUser = acc.find(m => m.id === userId);
                if (existingUser) {
                    existingUser.count++;
                    existingUser.messages.push(msg.id);
                } else {
                    acc.push({
                        id: userId,
                        type: 'user',
                        count: 1,
                        messages: [msg.id]
                    });
                }
            });

            // Process role mentions
            msg.mentions.roles.forEach(roleId => {
                const existingRole = acc.find(m => m.id === roleId);
                if (existingRole) {
                    existingRole.count++;
                    existingRole.messages.push(msg.id);
                } else {
                    acc.push({
                        id: roleId,
                        type: 'role',
                        count: 1,
                        messages: [msg.id]
                    });
                }
            });

            return acc;
        }, []);

        // Sort by count in descending order
        const sortedMentions = mentionsAnalysis
            .sort((a, b) => b.count - a.count)
            .map(mention => ({
                ...mention,
                percentage: ((mention.count / messages.length) * 100).toFixed(2)
            }));

        // Add metadata to the response
        const response = {
            totalMessages: messages.length,
            totalMentions: sortedMentions.reduce((sum, m) => sum + m.count, 0),
            uniqueMentionTargets: sortedMentions.length,
            mentionsData: sortedMentions
        };

        res.json(response);
        
    } catch (error) {
        console.error('Error processing mentions data:', error);
        res.status(500).json({ 
            error: 'Error processing mentions data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get time-based activity analysis
app.get('/api/stats/time-activity', async (req, res) => {
    try {
        const data = await fs.readFile('community_data.json', 'utf8');
        const { messages } = JSON.parse(data);
        
        const timeActivity = _.chain(messages)
            .groupBy(msg => new Date(msg.timestamp).toISOString().split('T')[0])
            .map((dayMessages, date) => ({
                date,
                count: dayMessages.length
            }))
            .value();
        
        res.json(timeActivity);
    } catch (error) {
        res.status(500).json({ error: 'Error processing time activity data' });
    }
});

// Get content analysis (word frequency, etc.)
app.get('/api/stats/content-analysis', async (req, res) => {
    try {
        const data = await fs.readFile('community_data.json', 'utf8');
        const { messages } = JSON.parse(data);

        const stopWords = new Set(['that', 'this', 'have', 'what', "it's", 'they', 'need', 'know', 'feel', 'like', 'you', 'u', 'your', 'will', 'is', 'when', 'how', 'who', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'out', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'where', 'why', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']);

        const filteredMessages = messages.map(msg => ({
            ...msg,
            content: msg.content
            .toLowerCase()
            .split(/\s+/)
            .filter(word => !stopWords.has(word))
            .join(' ')
        }));
        
        const wordFrequency = _.chain(filteredMessages)
            .map(msg => msg.content.toLowerCase().split(/\s+/))
            .flatten()
            .filter(word => word.length > 3) // Filter out short words
            .countBy()
            .map((count, word) => ({ word, count }))
            .orderBy(['count'], ['desc'])
            .take(20) // Top 20 words
            .value();
        
        res.json(wordFrequency);
    } catch (error) {
        res.status(500).json({ error: 'Error processing content analysis' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});