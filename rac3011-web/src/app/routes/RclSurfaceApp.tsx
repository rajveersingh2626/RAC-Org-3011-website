import { RouterProvider } from 'react-router';
import { createRclRouter } from './rcl.routes';

export default function RclSurfaceApp() {
  return <RouterProvider router={createRclRouter()} />;
}
