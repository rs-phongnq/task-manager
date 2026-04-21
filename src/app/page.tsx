import { redirect } from 'next/navigation';

export default function Home() {
  // Tự động điều hướng vào dashboard
  // Middleware sẽ quản lý việc user có được phép vào dashboard hay không
  redirect('/dashboard');
}
