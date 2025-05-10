export const welcomeCourseTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Bienvenido al Curso</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>¡Hola {{name}}!</h2>
    <p>Te damos la bienvenida al curso <strong>{{course_title}}</strong>.</p>
    <p>Tu usuario es: <strong>{{email_user}}</strong></p>
    <p>Contraseña: <strong>{{identification}}</strong></p>
    <p>Puedes acceder al curso en el siguiente enlace:</p>
    <p><a class="button" href="{{login_link}}">Ingresar al Curso</a></p>
    <p>Si tienes alguna duda, contáctanos en <a href="mailto:{{support_email}}">{{support_email}}</a>.</p>
    <p>¡Éxito en tu aprendizaje!</p>
  </div>
</body>
</html>
`;
