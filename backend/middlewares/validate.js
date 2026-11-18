import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

function formatZodError(err) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
}

/**
 * Express middleware that validates `req.body`, `req.query` and `req.params`
 * against a Zod schema map: `{ body, query, params }`. Validated/parsed data is
 * written back so controllers always see normalized, coerced input.
 *
 * Express 5 exposes `req.query` as a getter that rebuilds a fresh object on
 * each access — mutating it would silently lose values, so we redefine the
 * property with `Object.defineProperty` to a plain data property.
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body ?? {});
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query ?? {});
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
        req.validatedQuery = parsed;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params ?? {});
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(ApiError.badRequest("Validation failed", formatZodError(err)));
      }
      return next(err);
    }
  };
}

export default validate;
