/**
 * Simple Voting Website - Cloudflare Worker
 * 
 * This worker implements a basic voting system where users can vote on a topic
 * and see the current results.
 * 
 * Since Cloudflare Workers don't have built-in persistent storage by default,
 * this example uses memory for storing votes in the global scope.
 * For production use, consider using Cloudflare Workers KV or other persistent storage.
 */

// Initialize vote counts (will reset when worker is redeployed)
// In production, use Workers KV or another persistent storage method
let votes = { option1: 0, option2: 0, option3: 0 };

// HTML template for the voting page
function generateHTML(votes) {
  const total = votes.option1 + votes.option2 + votes.option3;
  
  // Calculate percentages
  const percentages = {
    option1: total > 0 ? Math.round((votes.option1 / total) * 100) : 0,
    option2: total > 0 ? Math.round((votes.option2 / total) * 100) : 0,
    option3: total > 0 ? Math.round((votes.option3 / total) * 100) : 0
  };

  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>投票系统 | Voting System</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f7f7f7;
        color: #333;
      }
      h1 {
        text-align: center;
        margin-bottom: 30px;
        color: #2c3e50;
      }
      .container {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .voting-form {
        margin-bottom: 40px;
      }
      .option {
        margin-bottom: 15px;
        padding: 15px;
        background-color: #f0f0f0;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .option:hover {
        background-color: #e0e0e0;
      }
      .results {
        margin-top: 40px;
      }
      .result-bar {
        height: 30px;
        margin-bottom: 20px;
        position: relative;
      }
      .bar {
        height: 100%;
        background-color: #3498db;
        border-radius: 4px;
        transition: width 0.5s ease-in-out;
      }
      .bar-label {
        position: absolute;
        right: 10px;
        top: 5px;
        color: white;
        font-weight: bold;
      }
      .option-label {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .total-votes {
        text-align: center;
        margin-top: 20px;
        font-style: italic;
        color: #7f8c8d;
      }
      button {
        background-color: #3498db;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin: 5px;
      }
      button:hover {
        background-color: #2980b9;
      }
      .language-toggle {
        text-align: right;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>简易投票系统 | Simple Voting System</h1>
      
      <div class="voting-form">
        <h2>您最喜欢的水果是什么？ | What's your favorite fruit?</h2>
        <form id="vote-form" method="post">
          <div class="option">
            <input type="radio" id="option1" name="vote" value="option1">
            <label for="option1">苹果 | Apple</label>
          </div>
          <div class="option">
            <input type="radio" id="option2" name="vote" value="option2">
            <label for="option2">香蕉 | Banana</label>
          </div>
          <div class="option">
            <input type="radio" id="option3" name="vote" value="option3">
            <label for="option3">橙子 | Orange</label>
          </div>
          <button type="submit">投票 | Vote</button>
        </form>
      </div>
      
      <div class="results">
        <h2>当前结果 | Current Results</h2>
        
        <div class="option-label">苹果 | Apple:</div>
        <div class="result-bar">
          <div class="bar" style="width: ${percentages.option1}%">
            <span class="bar-label">${percentages.option1}% (${votes.option1})</span>
          </div>
        </div>
        
        <div class="option-label">香蕉 | Banana:</div>
        <div class="result-bar">
          <div class="bar" style="width: ${percentages.option2}%">
            <span class="bar-label">${percentages.option2}% (${votes.option2})</span>
          </div>
        </div>
        
        <div class="option-label">橙子 | Orange:</div>
        <div class="result-bar">
          <div class="bar" style="width: ${percentages.option3}%">
            <span class="bar-label">${percentages.option3}% (${votes.option3})</span>
          </div>
        </div>
        
        <div class="total-votes">
          总票数 | Total votes: ${total}
        </div>
      </div>
    </div>
    
    <script>
      document.getElementById('vote-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const vote = formData.get('vote');
        
        if (!vote) {
          alert('请选择一个选项 | Please select an option');
          return;
        }
        
        fetch('/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ vote })
        })
        .then(response => response.text())
        .then(() => {
          window.location.reload();
        })
        .catch(error => {
          console.error('Error:', error);
        });
      });
    </script>
  </body>
  </html>
  `;
}

// Handle requests
async function handleRequest(request) {
  // Handle POST requests (voting)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const vote = body.vote;
      
      if (vote && votes.hasOwnProperty(vote)) {
        votes[vote]++;
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid vote option' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Handle GET requests (display the voting page)
  return new Response(generateHTML(votes), {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Listen for fetch events
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});