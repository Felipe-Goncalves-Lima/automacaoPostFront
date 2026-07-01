import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that creates a smooth, animated progress bar 
 * based on REAL progress data from the Google Sheet "Progresso" column.
 * 
 * When the real progress value changes (e.g., from 25 to 50),
 * the bar smoothly animates to the new value instead of jumping.
 * 
 * Between updates, if the post is in an active state, 
 * the bar creeps forward slightly to show activity.
 */
const useAnimatedProgress = (realProgress, status) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const animationRef = useRef(null);

  const isActive = ['aprovado', 'agendado', 'postando'].includes(status.toLowerCase());
  const isComplete = ['publicado', 'sucesso'].includes(status.toLowerCase());
  const isError = status.toLowerCase() === 'erro';

  useEffect(() => {
    // Determine the target progress
    let target;
    if (isComplete) {
      target = 100;
    } else if (isError) {
      target = 100;
    } else if (status.toLowerCase() === 'rascunho') {
      target = 5;
    } else if (status.toLowerCase() === 'pendente') {
      target = 8;
    } else if (realProgress > 0) {
      target = realProgress;
    } else {
      // Fallback based on status when no Progresso column exists yet
      switch (status.toLowerCase()) {
        case 'aprovado': target = 20; break;
        case 'agendado': target = 35; break;
        case 'postando': target = 60; break;
        default: target = 3;
      }
    }

    targetRef.current = target;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = currentRef.current;
    const startTime = performance.now();
    
    // Duration depends on how far we need to travel
    const distance = Math.abs(target - startValue);
    const duration = Math.max(600, Math.min(2000, distance * 30)); // 600ms to 2s

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const rawT = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - rawT, 3);
      
      const newValue = startValue + (target - startValue) * eased;
      currentRef.current = newValue;
      setDisplayProgress(newValue);

      if (rawT < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // After reaching target, if active, do a very slow creep
        // This shows the user "something is happening" between real updates
        if (isActive && target < 95) {
          const creepStart = performance.now();
          const creepFrom = target;
          // Creep at most 8% beyond the real progress (to not be misleading)
          const creepTo = Math.min(target + 8, 95);
          const creepDuration = 60000; // 1 minute of slow creep

          const creep = (time) => {
            const creepElapsed = time - creepStart;
            const creepT = Math.min(creepElapsed / creepDuration, 1);
            // Very strong ease-out so it barely moves
            const creepEased = 1 - Math.pow(1 - creepT, 5);
            const creepValue = creepFrom + (creepTo - creepFrom) * creepEased;
            currentRef.current = creepValue;
            setDisplayProgress(creepValue);

            if (creepT < 1) {
              animationRef.current = requestAnimationFrame(creep);
            }
          };
          animationRef.current = requestAnimationFrame(creep);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [realProgress, status, isActive, isComplete, isError]);

  return Math.round(displayProgress * 10) / 10;
};

export default useAnimatedProgress;
