import { RouterProvider } from 'react-router';
import { createMainRouter } from './main.routes';

export default function MainSurfaceApp() {
  return <RouterProvider router={createMainRouter()} />;
}
