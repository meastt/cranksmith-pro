// components/Layout.js

export default function Layout({ children }) {
    return (
      <div
        className="
          min-h-screen 
          min-w-[1400px] 
          overflow-x-auto 
          bg-bg 
          text-text 
          font-mono 
          antialiased
        "
      >
        {children}
      </div>
    );
  }
  