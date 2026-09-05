import { RouterProvider } from 'react-router';
import { createDrishtiRouter } from './drishti.routes';

export default function DrishtiSurfaceApp() {
  return <RouterProvider router={createDrishtiRouter()} />;
}
