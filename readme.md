# Discord Community Insights Generator

An LLM powered Discord selfbot that scrapes chat history from Discord server channels to provide competitor analysis and community insights.  

## Description

This Discord selfbot unlocks the understanding of community dynamics and trends across Discord servers, which is crucial for ecosystem growth. By collecting and analysing community interactions, it generates valuable insights about activity patterns, influential members, and cross-community collaborations.        
The bot scrapes messages and provides customizable insights.     

Use cases can include:   
- competitor analysis
- identifying startup collaboration opportunities
- aggregate user community feedback

This is a non-exhaustive list as the use of LLMs allows for personalisation on the types of insights the bot is able to provide, based on your industry.   

## Getting Started  
Clone this repository and ensure you have the correct dependencies installed.    

### Installs & dependencies
Require node.js

```npm install openai```    
```npm install node-fetch```           
```npm install dotenv```    
```npm install express```    
```npm install promises```    

Need to set up own .env file with your selfbot Discord token and an Open API Key (topped up balance).  

### Executing program
Run the index.js file. Wait for the confirmation in the terminal/debugger:      
``` ${your_username} is ready! ```       
Go into a Discord server channel that you wish to scrape the messages of.     
Type in:        
``` hello all! ```        
and wait for the terminal/debugger to output:        
``` Common themes saved to themes.txt ```          
In a separate terminal, run ```npm start``` and go to the local host link to view the dashboard.      

## Contributors
Xander Wanagel     
Aaditya Bellamkonda      
Lamb Chen     
