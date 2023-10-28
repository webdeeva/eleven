const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.timeout = 600000;  // 10 minutes
app.post('/api/upload', async (req, res) => {
    const { name, files, description, labels, apiKey, ElementId } = req.body;

    // Immediately respond indicating processing has started
    res.json({ status: 'Processing started' });

    // Process the audio in the background
    processAudio(name, files, description, labels, apiKey, ElementId);
});

async function processAudio(name, files, description, labels, apiKey, ElementId) {
    const formData = new FormData();
    formData.append('name', name);
    
    // Download and append files to formData
    for (let fileUrl of files) {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        formData.append('files', buffer, {
            contentType: 'audio/webm',
            filename: 'sample.webm'
        });
    }

    formData.append('description', description);
    formData.append('labels', JSON.stringify(labels));

    let responseMessage;

    try {
        const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
            headers: {
                'accept': 'application/json',
                'xi-api-key': apiKey,
                ...formData.getHeaders()
            }
        });

        responseMessage = "Audio processed successfully!";
    } catch (error) {
        responseMessage = "Error uploading files to ElevenLabs API.";
    }

    // Update the no-code app using the provided Adalo API endpoint
    try {
        await axios.put(`https://api.adalo.com/v0/apps/9576576a-696d-4132-bdf0-b51ebeae7c34/collections/t_060c36988b7b4f1b935be317a88d0e79/${ElementId}`, {
            response: responseMessage
        }, {
            headers: {
                'Authorization': 'Bearer 93cs2pkvgeemz9dz6haed6aqk',
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error updating the no-code app via API:", error);
    }
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
