package response

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type APIResponse struct {
	Success   bool         `json:"success"`
	Error     *ErrorDetail `json:"error,omitempty"`
	Data      any          `json:"data,omitempty"`
	RequestID string       `json:"requestId"`
}

func WriteError(c *gin.Context, statusCode int, code, message string) {
	reqID, _ := c.Get("RequestID")
	requestIDStr, _ := reqID.(string)
	if requestIDStr == "" {
		requestIDStr = c.Writer.Header().Get("X-Request-ID")
	}

	c.AbortWithStatusJSON(statusCode, APIResponse{
		Success: false,
		Error: &ErrorDetail{
			Code:    code,
			Message: message,
		},
		RequestID: requestIDStr,
	})
}

func WriteSuccess(c *gin.Context, statusCode int, data any) {
	reqID, _ := c.Get("RequestID")
	requestIDStr, _ := reqID.(string)
	if requestIDStr == "" {
		requestIDStr = c.Writer.Header().Get("X-Request-ID")
	}

	c.JSON(statusCode, APIResponse{
		Success:   true,
		Data:      data,
		RequestID: requestIDStr,
	})
}

func WriteJSONDirect(w http.ResponseWriter, statusCode int, code, message, reqID string) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	resp := APIResponse{
		Success: false,
		Error: &ErrorDetail{
			Code:    code,
			Message: message,
		},
		RequestID: reqID,
	}
	data, err := json.Marshal(resp)
	if err != nil {
		return err
	}
	_, err = w.Write(data)
	return err
}

// Common error codes
const (
	ErrUnauthorized        = "UNAUTHORIZED"
	ErrForbidden           = "FORBIDDEN"
	ErrRateLimitExceeded   = "RATE_LIMIT_EXCEEDED"
	ErrBadGateway          = "BAD_GATEWAY"
	ErrGatewayTimeout      = "GATEWAY_TIMEOUT"
	ErrServiceUnavailable  = "SERVICE_UNAVAILABLE"
	ErrInternalServerError = "INTERNAL_SERVER_ERROR"
	ErrNotFound            = "NOT_FOUND"
	ErrBadRequest          = "BAD_REQUEST"
)

func StatusForCode(code string) int {
	switch code {
	case ErrUnauthorized:
		return http.StatusUnauthorized
	case ErrForbidden:
		return http.StatusForbidden
	case ErrRateLimitExceeded:
		return http.StatusTooManyRequests
	case ErrBadGateway:
		return http.StatusBadGateway
	case ErrGatewayTimeout:
		return http.StatusGatewayTimeout
	case ErrServiceUnavailable:
		return http.StatusServiceUnavailable
	case ErrNotFound:
		return http.StatusNotFound
	case ErrBadRequest:
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}
