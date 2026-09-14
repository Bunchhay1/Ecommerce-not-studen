package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const HeaderRequestID = "X-Request-ID"

func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader(HeaderRequestID)
		if reqID == "" {
			reqID = uuid.New().String()
		}

		c.Set("RequestID", reqID)
		c.Writer.Header().Set(HeaderRequestID, reqID)
		c.Request.Header.Set(HeaderRequestID, reqID)

		c.Next()
	}
}
