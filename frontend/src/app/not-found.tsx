'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white relative">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4a0000_1px,transparent_1px),linear-gradient(to_bottom,#4a0000_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

      <div className="text-center">
        <h1 className="text-8xl font-black mb-6 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">404</h1>
        <p className="text-2xl mb-12 text-gray-300">Page not found</p>
        <a href="/" className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl inline-block">
          Go Home
        </a>
      </div>
    </div>
  );
}
