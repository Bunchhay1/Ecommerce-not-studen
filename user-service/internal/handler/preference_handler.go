package handler

import (
	"net/http"

	"github.com/ecommerce-microservice/user-service/internal/dto"
	"github.com/ecommerce-microservice/user-service/internal/middleware"
	"github.com/ecommerce-microservice/user-service/internal/service"
	"github.com/gin-gonic/gin"
)

type PreferenceHandler struct {
	prefService service.PreferenceService
}

func NewPreferenceHandler(ps service.PreferenceService) *PreferenceHandler {
	return &PreferenceHandler{prefService: ps}
}

func (h *PreferenceHandler) GetPreferences(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	pref, err := h.prefService.GetPreferences(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to retrieve preferences", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, pref)
}

func (h *PreferenceHandler) UpdatePreferences(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var req dto.UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request payload", Details: err.Error()})
		return
	}

	pref, err := h.prefService.UpdatePreferences(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to update preferences", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, pref)
}

func (h *PreferenceHandler) GetSettings(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	settings, err := h.prefService.GetSettings(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to retrieve settings", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func (h *PreferenceHandler) UpdateSettings(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var req dto.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request payload", Details: err.Error()})
		return
	}

	settings, err := h.prefService.UpdateSettings(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to update settings", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}
