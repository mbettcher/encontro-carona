import { environment } from '../../environments/environment';

export const APP_VERSION = '1.1.1';
export const APP_NAME = 'EAC - Tio Carona';
export const APP_RELEASE_LABEL = `v${APP_VERSION}`;
export const APP_RELEASE_DATE = '2026-07-20';

export const APP_BUILD_INFO = {
  appName: APP_NAME,
  version: APP_VERSION,
  releaseLabel: APP_RELEASE_LABEL,
  releaseDate: APP_RELEASE_DATE,
  environmentName: environment.production ? 'Produção' : 'Local/TQS',
  apiUrl: environment.apiUrl
};
