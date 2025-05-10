
export const resetPasswordTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Restablecimiento de Contraseña</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Hola {{name}},</h2>
    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
    <p>Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
    <p><a class="button" href="{{reset_link}}">Restablecer Contraseña</a></p>
    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    <p>Gracias,</p>
    <p>Equipo de Soporte</p>
  </div>
</body>
</html>
`;
