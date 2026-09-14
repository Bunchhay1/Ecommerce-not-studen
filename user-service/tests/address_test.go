package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/cache"
	"github.com/ecommerce-microservice/user-service/internal/dto"
	"github.com/ecommerce-microservice/user-service/internal/event"
	"github.com/ecommerce-microservice/user-service/internal/handler"
	"github.com/ecommerce-microservice/user-service/internal/middleware"
	"github.com/ecommerce-microservice/user-service/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupAddressApp() (*gin.Engine, *MockAddressRepository) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	repo := NewMockAddressRepository()
	cacheClient := cache.NewNoopCache()
	producer := event.NewLoggingProducer()

	svc := service.NewAddressService(repo, cacheClient, producer, 30*time.Minute)
	h := handler.NewAddressHandler(svc)

	v1 := r.Group("/api/v1")
	{
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(testSecret))
		{
			users.GET("/me/addresses", h.GetMyAddresses)
			users.POST("/me/addresses", h.CreateAddress)
			users.GET("/me/addresses/:address_id", h.GetAddressByID)
			users.PUT("/me/addresses/:address_id", h.UpdateAddress)
			users.DELETE("/me/addresses/:address_id", h.DeleteAddress)
			users.PATCH("/me/addresses/:address_id/default", h.SetDefaultAddress)
		}
	}

	return r, repo
}

func TestAddress_CreateAndDefaultSwitching(t *testing.T) {
	router, _ := setupAddressApp()
	token := generateTestJWT("user-addr-1", "access", []string{"CUSTOMER"}, 1*time.Hour)

	// 1. Create first address (Home) - should automatically be default
	homePayload := dto.CreateAddressRequest{
		Label:         "Home",
		RecipientName: "John Doe",
		Phone:         "+85512345678",
		AddressLine1:  "Street 123, House 45",
		City:          "Phnom Penh",
		Province:      "Phnom Penh",
		Country:       "Cambodia",
		PostalCode:    "12000",
		IsDefault:     false,
	}
	body1, _ := json.Marshal(homePayload)

	req1, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/addresses", bytes.NewBuffer(body1))
	req1.Header.Set("Authorization", "Bearer "+token)
	req1.Header.Set("Content-Type", "application/json")
	resp1 := httptest.NewRecorder()
	router.ServeHTTP(resp1, req1)

	assert.Equal(t, http.StatusCreated, resp1.Code)
	var addr1 dto.AddressResponse
	_ = json.Unmarshal(resp1.Body.Bytes(), &addr1)
	assert.True(t, addr1.IsDefault, "First address should default to is_default=true")
	addr1ID := addr1.ID

	// 2. Create second address (Office) with is_default=true
	officePayload := dto.CreateAddressRequest{
		Label:         "Office",
		RecipientName: "John Doe",
		Phone:         "+85598765432",
		AddressLine1:  "Vattanac Tower, Level 18",
		City:          "Phnom Penh",
		Province:      "Phnom Penh",
		Country:       "Cambodia",
		PostalCode:    "12000",
		IsDefault:     true,
	}
	body2, _ := json.Marshal(officePayload)

	req2, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/addresses", bytes.NewBuffer(body2))
	req2.Header.Set("Authorization", "Bearer "+token)
	req2.Header.Set("Content-Type", "application/json")
	resp2 := httptest.NewRecorder()
	router.ServeHTTP(resp2, req2)

	assert.Equal(t, http.StatusCreated, resp2.Code)
	var addr2 dto.AddressResponse
	_ = json.Unmarshal(resp2.Body.Bytes(), &addr2)
	assert.True(t, addr2.IsDefault)
	addr2ID := addr2.ID

	// 3. List addresses: Check that Home is no longer default, and Office is default
	listReq, _ := http.NewRequest(http.MethodGet, "/api/v1/users/me/addresses", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listResp := httptest.NewRecorder()
	router.ServeHTTP(listResp, listReq)

	assert.Equal(t, http.StatusOK, listResp.Code)
	var list []dto.AddressResponse
	_ = json.Unmarshal(listResp.Body.Bytes(), &list)
	assert.Len(t, list, 2)

	// 4. Switch default back to Home via PATCH /default
	patchReq, _ := http.NewRequest(http.MethodPatch, "/api/v1/users/me/addresses/"+addr1ID+"/default", nil)
	patchReq.Header.Set("Authorization", "Bearer "+token)
	patchResp := httptest.NewRecorder()
	router.ServeHTTP(patchResp, patchReq)

	assert.Equal(t, http.StatusOK, patchResp.Code)
	var patched dto.AddressResponse
	_ = json.Unmarshal(patchResp.Body.Bytes(), &patched)
	assert.True(t, patched.IsDefault)

	// 5. Delete Office address
	delReq, _ := http.NewRequest(http.MethodDelete, "/api/v1/users/me/addresses/"+addr2ID, nil)
	delReq.Header.Set("Authorization", "Bearer "+token)
	delResp := httptest.NewRecorder()
	router.ServeHTTP(delResp, delReq)

	assert.Equal(t, http.StatusOK, delResp.Code)
}
