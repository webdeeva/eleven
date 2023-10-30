const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/api/upload', async (req, res) => {
   const { name, file, description, labels, apiKey, ElementId } = req.body;

const formData = new FormData();
formData.append('name', name);
    
// Download the file from the provided URL and append it to formData
const response = await axios.get(file, { responseType: 'arraybuffer' });
const buffer = Buffer.from(response.data, 'binary');
formData.append('files', buffer, {
    contentType: 'audio/mpeg',
    filename: 'sample.mp3'
});
    }

    formData.append('description', description);
    formData.append('labels', JSON.stringify(labels));

    try {
        // Upload to ElevenLabs API
        const elevenLabsResponse = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
            headers: {
                'accept': 'application/json',
                'xi-api-key': apiKey,
                ...formData.getHeaders()
            }
        });

        // Update Adalo API after successful upload to ElevenLabs
        await axios.put(`https://api.adalo.com/v0/apps/9576576a-696d-4132-bdf0-b51ebeae7c34/collections/t_060c36988b7b4f1b935be317a88d0e79/${ElementId}`, {
            response: "Audio uploaded successfully!"
        }, {
            headers: {
                'Authorization': 'Bearer 93cs2pkvgeemz9dz6haed6aqk',
                'Content-Type': 'application/json'
            }
        });

        res.json(elevenLabsResponse.data);

    } catch (error) {
        // If there's an error, update Adalo API with the error information
        try {
            await axios.put(`https://api.adalo.com/v0/apps/9576576a-696d-4132-bdf0-b51ebeae7c34/collections/t_060c36988b7b4f1b935be317a88d0e79/${ElementId}`, {
                log: `Error: ${error.message || error}`
            }, {
                headers: {
                    'Authorization': 'Bearer 93cs2pkvgeemz9dz6haed6aqk',
                    'Content-Type': 'application/json'
                }
            });
        } catch (adaloError) {
            console.error("Error updating Adalo API:", adaloError.message || adaloError);
        }

        res.status(500).send('Error processing the request.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
