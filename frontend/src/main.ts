import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { academyAuthInterceptor } from './app/core/academy/academy-auth.interceptor';
import { AcademyApiService } from './app/core/academy/academy-api.service';
import { AcademySessionStore } from './app/core/academy/academy-session.store';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([academyAuthInterceptor])),
    provideRouter(routes),
    { provide: AcademyApiService, useFactory: () => new AcademyApiService() },
    { provide: AcademySessionStore, useFactory: () => new AcademySessionStore() },
  ],
}).catch((error) => console.error(error));
