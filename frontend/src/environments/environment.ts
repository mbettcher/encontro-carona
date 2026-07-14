const isLocalDev =
  typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && window.location.port === '4200';

export const environment = {
  production: !isLocalDev,
  apiUrl: isLocalDev ? 'http://localhost:8080/api' : '/api'
};
