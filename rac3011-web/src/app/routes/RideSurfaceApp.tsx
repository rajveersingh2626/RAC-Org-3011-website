import { RouterProvider } from 'react-router';
import { createRideRouter } from './ride.routes';

export default function RideSurfaceApp() {
  return <RouterProvider router={createRideRouter()} />;
}
