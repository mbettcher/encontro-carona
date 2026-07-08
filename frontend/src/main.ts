import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiErrorInterceptor } from './app/core/api-error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiErrorInterceptor])),

    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false
        }
      },
      ripple: true
    }),

    MessageService
  ]
}).catch(err => console.error(err));