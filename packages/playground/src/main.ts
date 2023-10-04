import {
  enableProdMode,
  ENVIRONMENT_INITIALIZER,
  importProvidersFrom,
  inject,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BasicPageComponent } from './app/basic-page/basic-page.component';
import { QUERY_CLIENT_OPTIONS, QueryClientService } from '@ngneat/query';
import { QueryClientConfig, QueryFunction } from '@tanstack/react-query';
import { firstValueFrom } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    // This is to enable devtools in the playground
    // For your application, please check environment.production as the following
    // environment.production
    //   ? []
    //   : {
    //       provide: ENVIRONMENT_INITIALIZER,
    //       multi: true,
    //       useValue() {
    //         const queryClient = inject(QueryClient);
    //         import('@ngneat/query-devtools').then((m) => {
    //           m.ngQueryDevtools({ queryClient });
    //         });
    //       },
    //     },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue() {
        const queryClient = inject(QueryClientService);
        import('@ngneat/query-devtools').then((m) => {
          m.ngQueryDevtools({ queryClient });
        });
      },
    },
    {
      provide: QUERY_CLIENT_OPTIONS,
      useFactory: () => {
        const httpClient = inject(HttpClient);
        const queryFn: QueryFunction = async ({ queryKey }) =>
          firstValueFrom(
            httpClient.get<unknown[]>(
              `https://jsonplaceholder.typicode.com${queryKey[0]}`
            )
          );
        return <QueryClientConfig>{
          defaultOptions: {
            queries: {
              queryFn,
            },
          },
        };
      },
    },
    importProvidersFrom(
      HttpClientModule,
      BrowserAnimationsModule,
      RouterModule.forRoot(
        [
          {
            path: '',
            component: BasicPageComponent,
          },
          {
            path: 'basic',
            component: BasicPageComponent,
          },
        ],
        { initialNavigation: 'enabledBlocking' }
      )
    ),
  ],
}).catch((err) => console.error(err));
