require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  console.log("Loaded API Key:", process.env.NEWRUN_APP_OPENAI_API_KEY); // Check if key is loaded

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, who are you?" }],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("Response from OpenAI:", response.data);
  } catch (error) {
    console.error("Error in OpenAI request:", error.response ? error.response.data : error.message);
  }
}

testOpenAI();
