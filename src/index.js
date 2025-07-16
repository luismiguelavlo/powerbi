require('dotenv').config();
const cors = require('cors');
const axios = require('axios');
const express = require('express');
const app = express();


app.use(cors());
app.use(express.json());

const {
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET,
  WORKSPACE_ID,
  REPORT_ID,
  PORT
} = process.env;

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/get-embed-token', async (req, res) => {
  try {
    // 1. Obtener token de acceso
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'https://analysis.windows.net/powerbi/api/.default',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log(tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;

    // 2. Obtener información del reporte
    const reportInfo = await axios.get(
      `https://api.powerbi.com/v1.0/myorg/groups/${WORKSPACE_ID}/reports/${REPORT_ID}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(reportInfo.data);

    const embedUrl = reportInfo.data.embedUrl;

    // 3. Obtener embed token
    const embedTokenResponse = await axios.post(
      'https://api.powerbi.com/v1.0/myorg/GenerateToken',
      {
        datasets: [{ id: reportInfo.data.datasetId }],
        reports: [{ id: REPORT_ID, allowEdit: false }],
        targetworkspaces: [{ id: WORKSPACE_ID }],
        identities: [{
          username: 'l.avendano@syc.com.co',
          datasets: [reportInfo.data.datasetId]
        }]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const embedToken = embedTokenResponse.data.token;

    res.json({
      embedToken,
      embedUrl,
      reportId: REPORT_ID,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Error al generar token de embeber');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
