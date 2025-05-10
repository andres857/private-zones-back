export const progresoMonthlyTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8" />
    <title>{{title}}</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table th, .table td { border: 1px solid #ccc; padding: 10px; }
        .progress-bar { height: 20px; background: #007bff; color: white; text-align: center; line-height: 20px; border-radius: 4px; }
    </style>
    </head>
        <body>
            <div class="container">
                <h2 style="text-align: center;">{{title}}</h2>
                <p>Hola {{name}},</p>
                <p>{{body}}</p>

                <table class="table">
                <thead>
                    <tr><th>Curso</th><th>Progreso</th></tr>
                </thead>
                <tbody>
                    {{clubProgress}}
                </tbody>
                </table>

                <p>Tu usuario es: {{email_user}}</p>
                <p>Contraseña: {{identification}}</p>
                <p>Link de ingreso: <a href="{{login_link}}">{{login_link}}</a></p>
                <p>Tutorial: <a href="{{tutorial_link}}">{{tutorial_link}}</a></p>
                <p>Soporte: <a href="mailto:{{support_email}}">{{support_email}}</a></p>
            </div>
        </body>
    </html>
`;