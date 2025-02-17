import React from 'react';

export const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
  </div>
)); 