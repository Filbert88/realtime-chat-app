import React from "react";

const Loading: React.FC = () => {
  return (
    <main className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
      <div className="loader"></div>
    </main>
  );
};

export default Loading;