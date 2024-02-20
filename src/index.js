const express = require("express");
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = 3001;
app.use(express.json());

const SECRET_KEY = 'cesar'; // Reemplaza '1234' con tu secreto real

// Middleware para verificar la firma
const verifyKeyMiddleware = (req, res, next) => {
  try {
    verify_signature(req);
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

// Función para verificar la firma
const verify_signature = (req) => {
  try {
    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    const trusted = Buffer.from(`sha256=${signature}`, "ascii");
    const untrusted = Buffer.from(
      req.header("x-hub-signature-256") || "",
      "ascii"
    );

    if (!crypto.timingSafeEqual(trusted, untrusted)) {
      throw new Error("Invalid signature");
    }

    // La firma es válida
    return true;
  } catch (err) {
    throw new Error(`Error verificando la firma: ${err}`);
  }
};

// Ruta protegida con el middleware
app.post('/api/github-event', verifyKeyMiddleware, (req, res) => {
  console.log('SOY MAMPO SOY MAMPO', req.header("x-github-event"));
  const { action, sender, repository } = req.body;
  const event = req.header("x-github-event");
  let message = "";

  switch (event) {
    case "star":
      console.log(`${sender.login} ${action} star on ${repository.full_name}`);
      message = `${sender.login} ${action} star on ${repository.full_name}`;
      break;
    case "issues":
      const { issue } = req.body;
      console.log(`${sender.login} ${action} issue ${issue.title} on ${repository.full_name}`);
      message = `${sender.login} ${action} issue ${issue.title} on ${repository.full_name}`;
      break;
    case "push":
      console.log(`${sender.login} pushes on ${repository.full_name}`);
      message = `${sender.login} pushes on ${repository.full_name}`;
      break;
    default:
      console.log(`Evento desconocido: ${event}`);
      message = `Evento desconocido: ${event}`;
      break;
  }

  const webhookUrl = 'https://discord.com/api/webhooks/1205602330091982869/8EVfKky4KEbfEVMGI0UdpnABi4xGqvCVXVaB60REOVOUQ5bN44C-YFhvMIH6AtQs7pn-';

  const postData = {
    content: message
  };

  axios.post(webhookUrl, postData)
    .then(response => {
      console.log('Mensaje enviado con éxito:', response.data);
    })
    .catch(error => {
      console.error('Error al enviar el mensaje:', error.message);
    });
  res.status(200).send(message);
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`El servidor de la API está escuchando en el puerto 3001`);
});
