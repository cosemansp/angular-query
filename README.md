> The TanStack Query (also known as react-query) adapter for Angular applications

Get rid of granular state management, manual refetching, and async spaghetti code. TanStack Query gives you declarative, always-up-to-date auto-managed queries and mutations that improve your developer experience.

## Features

T.B.D

## Table of Contents

- [Features](#features)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Queries](#queries)
- [Query Client](#query-client)
  - [Query](#query)
- [Mutations](#mutations)
  - [Mutation Result](#mutation-result)
  - [Mutation](#mutation)
- [Query Global Options](#query-global-options)
- [Devtools](#devtools)

## Installation

```
npm i angular-query
yarn add angular-query
```

## Queries

## Query Client

Inject the `QueryClientService` provider to get access to the query client [instance](https://tanstack.com/query/v4/docs/reference/QueryClient):

```ts
import { QueryClientService } from 'angular-/query';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private queryClient = inject(QueryClientService);
}
```

### Query

Inject the `UseQuery` in your service. Using the hook is similar to the [official](https://tanstack.com/query/v4/docs/guides/queries) hook, except the query function should return an `observable`.

```ts
import { UseQuery } from '@ngneat/query';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private http = inject(HttpClient);
  private useQuery = inject(UseQuery);

  getTodos() {
    return this.useQuery(['todos'], () => {
      return this.http.get<Todo[]>(
        'https://jsonplaceholder.typicode.com/todos'
      );
    });
  }

  getTodo(id: number) {
    return this.useQuery(['todo', id], () => {
      return this.http.get<Todo>(
        `https://jsonplaceholder.typicode.com/todos/${id}`
      );
    });
  }
}
```

Use it in your component:

```ts
import { SubscribeModule } from '@ngneat/subscribe';

@Component({
  standalone: true,
  imports: [NgIf, NgForOf, SpinnerComponent, SubscribeModule],
  template: `
    <ng-container *subscribe="todos$ as todos">
      <ng-query-spinner *ngIf="todos.isLoading"></ng-query-spinner>

      <p *ngIf="todos.isError">Error...</p>

      <ul *ngIf="todos.isSuccess">
        <li *ngFor="let todo of todos.data">
          {{ todo.title }}
        </li>
      </ul>
    </ng-container>
  `,
})
export class TodosPageComponent {
  todos$ = inject(TodosService).getTodos().result$;
}
```

Note that using the `*subscribe` [directive](https://github.com/ngneat/subscribe) is optional. Subscriptions can be made using any method you choose.

## Mutations

### Mutation Result

The official `mutation` function can be a little verbose. Generally, you can use the following in-house simplified implementation.

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { QueryClientService } from 'angular-query';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClientService);

  addTodo({ title }: { title: string }) {
    return this.http.post<{ success: boolean }>(`todos`, { title }).pipe(
      tap((newTodo) => {
        // Invalidate to refetch
        this.queryClient.invalidateQueries(['todos']);
        // Or update manually
        this.queryClient.setQueryData<TodosResponse>(
          ['todos'],
          addEntity('todos', newTodo)
        );
      })
    );
  }
}
```

And in the component:

```ts
import { QueryClientService, useMutationResult } from 'angular-query';

@Component({
  template: `
    <input #ref />

    <button
      (click)="addTodo({ title: ref.value })"
      *subscribe="addTodoMutation.result$ as addTodoMutation"
    >
      Add todo {{ addTodoMutation.isLoading ? 'Loading' : '' }}
    </button>
  `,
})
export class TodosPageComponent {
  private todosService = inject(TodosService);
  addTodoMutation = useMutationResult();

  addTodo({ title }) {
    this.todosService
      .addTodo({ title })
      .pipe(this.addTodoMutation.track())
      .subscribe();
  }
}
```

### Mutation

You can use the original `mutation` [functionality](https://tanstack.com/query/v4/docs/reference/useMutation) if you prefer.

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { QueryClientService, UseMutation } from '@angular-query';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClientService);
  private useMutation = inject(UseMutation);

  addTodo() {
    return this.useMutation(({ title }: { title: string }) => {
      return this.http.post<{ success: boolean }>(`todos`, { title }).pipe(
        tap((newTodo) => {
          // Invalidate to refetch
          this.queryClient.invalidateQueries(['todos']);
          // Or update manually
          this.queryClient.setQueryData<TodosResponse>(
            ['todos'],
            addEntity('todos', newTodo)
          );
        })
      );
    });
  }
}
```

And in the component:

```ts
@Component({
  template: `
    <input #ref />

    <button
      (click)="addTodo({ title: ref.value })"
      *subscribe="addTodoMutation.result$ as addTodoMutation"
    >
      Add todo {{ addTodoMutation.isLoading ? 'Loading' : '' }}
    </button>
  `,
})
export class TodosPageComponent {
  private todosService = inject(TodosService);
  addTodoMutation = this.todosService.addTodo();

  addTodo({ title }) {
    this.addTodoMutation$.mutate({ title }).then((res) => {
      console.log(res.success);
    });
  }
}
```

## Query Global Options

You can provide the `QUERY_CLIENT_OPTIONS` provider to set the global [options](https://tanstack.com/query/v4/docs/reference/QueryClient) of the query client instance:

```ts
import { provideQueryClientOptions } from 'angular-query';

{
  providers: [
    provideQueryClientOptions({
      defaultOptions: {
        queries: {
          staleTime: 3000,
        },
      },
    }),
  ];
}
```

## Devtools

Install the `@ngneat/query-devtools` package. Lazy load and use it only in `development` environment:

```ts
import { ENVIRONMENT_INITIALIZER } from '@angular/core';
import { environment } from './environments/environment';

import { QueryClientService } from 'angular-query';

bootstrapApplication(AppComponent, {
  providers: [
    environment.production
      ? []
      : {
          provide: ENVIRONMENT_INITIALIZER,
          multi: true,
          useValue() {
            const queryClient = inject(QueryClientService);
            import('@ngneat/query-devtools').then((m) => {
              m.ngQueryDevtools({ queryClient });
            });
          },
        },
  ],
});
```

