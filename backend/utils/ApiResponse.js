/**
 * Standardized API response builder.
 * Ensures consistent response envelopment across all domains while preserving
 * legacy payload properties for storefront and admin panel backward compatibility.
 */
export class ApiResponse {
  /**
   * Send a successful response (200 OK by default).
   */
  static success(res, payload = {}, message = "", statusCode = 200) {
    const isObject = payload && typeof payload === "object" && !Array.isArray(payload);
    const body = {
      success: true,
      ...(message ? { message } : {}),
      ...(isObject ? payload : { data: payload }),
    };

    if (body.data === undefined) {
      body.data = payload;
    }

    return res.status(statusCode).json(body);
  }

  /**
   * Send a 201 Created response.
   */
  static created(res, payload = {}, message = "Created successfully") {
    return ApiResponse.success(res, payload, message, 201);
  }

  /**
   * Send a standardized error response.
   */
  static error(res, message = "An error occurred", statusCode = 500, details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(details ? { details } : {}),
    });
  }
}

export default ApiResponse;
