'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Page not found</p>
        <a href="/" className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold">
          Go Home
        </a>
      </div>
    </div>
  );
}
