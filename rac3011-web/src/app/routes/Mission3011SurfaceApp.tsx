import { RouterProvider } from 'react-router';
import { createMission3011Router } from './mission3011.routes';

export default function Mission3011SurfaceApp() {
  return <RouterProvider router={createMission3011Router()} />;
}
