const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/api/upload', async (req, res) => {
    const { name, files, description, labels, apiKey } = req.body;

    const formData = new FormData();
    formData.append('name', name);
    
    // Assuming files is an array of URLs, download and append them to formData
    for (let fileUrl of files) {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        formData.append('files', buffer, {
            contentType: 'audio/webm',
            filename: 'sample.webm' // Modify filename as per requirement
        });
    }

    formData.append('description', description);
    formData.append('labels', JSON.stringify(labels));

    try {
        const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
            headers: {
                'accept': 'application/json',
                'xi-api-key': apiKey,
                ...formData.getHeaders()
            },
            timeout: 600000  // Setting the timeout to 10 minutes
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error uploading files to ElevenLabs API.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
