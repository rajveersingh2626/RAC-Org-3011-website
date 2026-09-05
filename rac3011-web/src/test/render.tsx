import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { QueryClient } from '@tanstack/react-query';
import { Providers, createQueryClient } from '@/app/providers';

export interface RenderPageOptions {
  path?: string;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function renderPage(element: ReactElement, options: RenderPageOptions = {}) {
  const path = options.path ?? '*';
  const initialEntries = options.initialEntries ?? ['/'];
  const queryClient = options.queryClient ?? createQueryClient();
  return render(
    <Providers queryClient={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  );
}
