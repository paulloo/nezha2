import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';
import { MovieList } from './MovieList';

export const MovieConfig = React.memo(({ 
  currentMovieId, 
  onMovieChange, 
  movieListData, 
  onClose 
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        {!movieListData ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <MovieList
            movies={movieListData.list}
            onMovieSelect={(id) => {
              onMovieChange(id);
              onClose();
            }}
            currentMovieId={currentMovieId}
            onClose={onClose}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}); 