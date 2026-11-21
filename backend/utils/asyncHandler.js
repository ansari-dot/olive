/**
 * Wraps an async route handler so that any rejected promise is forwarded to the
 * Express error pipeline. Keeps controllers free of try/catch boilerplate.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
