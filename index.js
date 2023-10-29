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

async function processAudio(name, file, description, labels, apiKey, ElementId) {
    const formData = new FormData();
    formData.append('name', name);
    
    try {
        const response = await axios.get(file, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        formData.append('files', buffer, {
            contentType: 'audio/webm',
            filename: 'sample.webm'
        });
    } catch (error) {
        logError(`Error downloading file from URL ${file}: ${error}`);
    }

    formData.append('description', description);
    formData.append('labels', JSON.stringify(labels));

    try {
        const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
            headers: {
                'accept': 'application/json',
                'xi-api-key': apiKey,
                ...formData.getHeaders()
            }
        });
    } catch (error) {
        const errorMessage = `Error uploading files to ElevenLabs API: ${error}`;
        logError(errorMessage);
    }

    try {
        await axios.put(`https://api.adalo.com/v0/apps/9576576a-696d-4132-bdf0-b51ebeae7c34/collections/t_060c36988b7b4f1b935be317a88d0e79/${ElementId}`, {
            response: "Audio processed successfully!"
        }, {
            headers: {
                'Authorization': 'Bearer 93cs2pkvgeemz9dz6haed6aqk',
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        const errorMessage = `Error updating the no-code app via API: ${error}`;
        logError(errorMessage);
    }
}



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
