/**
 * Creates an AbortController and sets up cleanup to abort when the component unmounts
 * @param abortSignalRef Reference to store the abort signal
 * @returns Cleanup function to abort the controller
 */
export const useAbortController = () => {
  const controllerRef = { current: new AbortController() };

  const cleanup = () => {
    if (!controllerRef.current.signal.aborted) {
      controllerRef.current.abort();
    }
  };

  return { signal: controllerRef.current.signal, cleanup };
};

/**
 * Checks if an abort signal has been triggered
 * @param signal AbortSignal to check
 * @returns Boolean indicating if the signal was aborted
 */
export const isAborted = (signal: AbortSignal): boolean => {
  return signal.aborted;
};
