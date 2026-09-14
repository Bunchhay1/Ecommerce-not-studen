package handler

import (
	"errors"
	"net/http"

	"github.com/ecommerce-microservice/user-service/internal/dto"
	"github.com/ecommerce-microservice/user-service/internal/middleware"
	"github.com/ecommerce-microservice/user-service/internal/repository"
	"github.com/ecommerce-microservice/user-service/internal/service"
	"github.com/gin-gonic/gin"
)

type AddressHandler struct {
	addressService service.AddressService
}

func NewAddressHandler(as service.AddressService) *AddressHandler {
	return &AddressHandler{addressService: as}
}

func (h *AddressHandler) GetMyAddresses(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	addresses, err := h.addressService.GetAddresses(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to retrieve addresses", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, addresses)
}

func (h *AddressHandler) GetAddressByID(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	addressID := c.Param("address_id")
	if addressID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Missing address id"})
		return
	}

	address, err := h.addressService.GetAddressByID(c.Request.Context(), userID, addressID)
	if err != nil {
		if errors.Is(err, repository.ErrAddressNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Address not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to retrieve address", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, address)
}

func (h *AddressHandler) CreateAddress(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var req dto.CreateAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request payload", Details: err.Error()})
		return
	}

	address, err := h.addressService.CreateAddress(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to create address", Details: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, address)
}

func (h *AddressHandler) UpdateAddress(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	addressID := c.Param("address_id")
	if addressID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Missing address id"})
		return
	}

	var req dto.UpdateAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request payload", Details: err.Error()})
		return
	}

	address, err := h.addressService.UpdateAddress(c.Request.Context(), userID, addressID, &req)
	if err != nil {
		if errors.Is(err, repository.ErrAddressNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Address not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to update address", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, address)
}

func (h *AddressHandler) DeleteAddress(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	addressID := c.Param("address_id")
	if addressID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Missing address id"})
		return
	}

	err = h.addressService.DeleteAddress(c.Request.Context(), userID, addressID)
	if err != nil {
		if errors.Is(err, repository.ErrAddressNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Address not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to delete address", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Address deleted successfully", Success: true})
}

func (h *AddressHandler) SetDefaultAddress(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	addressID := c.Param("address_id")
	if addressID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Missing address id"})
		return
	}

	address, err := h.addressService.SetDefaultAddress(c.Request.Context(), userID, addressID)
	if err != nil {
		if errors.Is(err, repository.ErrAddressNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Address not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to set default address", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, address)
}
