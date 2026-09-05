import { RouterProvider } from 'react-router';
import { createCareerbridgeRouter } from './careerbridge.routes';

export default function CareerbridgeSurfaceApp() {
  return <RouterProvider router={createCareerbridgeRouter()} />;
}
