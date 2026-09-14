package handler

import (
	"net/http"

	"github.com/ecommerce-microservice/user-service/internal/dto"
	"github.com/ecommerce-microservice/user-service/internal/middleware"
	"github.com/ecommerce-microservice/user-service/internal/service"
	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	profileService service.ProfileService
}

func NewProfileHandler(ps service.ProfileService) *ProfileHandler {
	return &ProfileHandler{profileService: ps}
}

func (h *ProfileHandler) GetMyProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	profile, err := h.profileService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to retrieve profile", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *ProfileHandler) UpdateMyProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request payload", Details: err.Error()})
		return
	}

	profile, err := h.profileService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to update profile", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *ProfileHandler) GetUserProfileByID(c *gin.Context) {
	targetUserID := c.Param("id")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Missing user id parameter"})
		return
	}

	profile, err := h.profileService.GetProfile(c.Request.Context(), targetUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User profile not found", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}
