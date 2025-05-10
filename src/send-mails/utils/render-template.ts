import { progresoMonthlyTemplate } from '../templates/progreso-monthly.template';
import { welcomeCourseTemplate } from '../templates/welcome-course.template';
import { resetPasswordTemplate } from '../templates/reset-password.template';

interface ProgresoTemplateData {
  title: string;
  name: string;
  body: string;
  clubProgress: { club_title: string; progress: string }[];
  email_user: string;
  identification: string;
  login_link: string;
  tutorial_link: string;
  support_email: string;
}

export function renderProgresoTemplate(data: ProgresoTemplateData): string {
  const progressHtml = data.clubProgress
    .map((club) => {
      const width = club.progress === '0%' ? '10%' : club.progress;
      return `
        <tr>
          <td>${club.club_title}</td>
          <td>
            <div class="progress-bar" style="width: ${width};">
              ${club.progress}
            </div>
          </td>
        </tr>`;
    })
    .join('\n');

  return progresoMonthlyTemplate
    .replace(/{{title}}/g, data.title)
    .replace(/{{name}}/g, data.name)
    .replace(/{{body}}/g, data.body)
    .replace(/{{clubProgress}}/g, progressHtml)
    .replace(/{{email_user}}/g, data.email_user)
    .replace(/{{identification}}/g, data.identification)
    .replace(/{{login_link}}/g, data.login_link)
    .replace(/{{tutorial_link}}/g, data.tutorial_link)
    .replace(/{{support_email}}/g, data.support_email);
}

export function renderTemplate(templateName: string, data: Record<string, string>): string {
    let template = '';
  
    switch (templateName) {
        case 'welcome-course':
            template = welcomeCourseTemplate;
            break;
        case 'reset-password':
            template = resetPasswordTemplate;
            break;
        case 'monthly-progress':
            template = progresoMonthlyTemplate;
            break;
      default:
        throw new Error('Plantilla no encontrada');
    }
  
    return Object.keys(data).reduce((acc, key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      return acc.replace(regex, data[key]);
    }, template);
}