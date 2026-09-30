import { micromark } from 'micromark';

export const renderAcademyMarkdown = (source: string) => micromark(source, { allowDangerousHtml: false, allowDangerousProtocol: false });
