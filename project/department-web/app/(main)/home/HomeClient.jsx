"use client";

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Home2 Page</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded"
      onClick={() => window.location.href = '/'}>Go to Home Page</button>
    </div>
  );
}