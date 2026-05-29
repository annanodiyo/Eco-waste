package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"github.com/annanodiyo/Eco-waste/server/internal/services"
	"github.com/gin-gonic/gin"
)

func TestProductHandlerRegisterProduct(t *testing.T) {
	gin.SetMode(gin.TestMode)

	store := models.NewStore("") // empty dbPath means in-memory, no persistence
	blockchain := &services.BlockchainService{}
	handler := NewProductHandler(store, blockchain)

	router := gin.New()
	router.POST("/api/v1/products/register", handler.RegisterProduct)

	// Create a valid payload
	payload := models.RegisterProductRequest{
		Name:         "Eco Water Bottle",
		Manufacturer: "Green Plastics Ltd",
		Material:     models.WastePlastic,
		WeightGrams:  24,
	}

	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/products/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got: %d (body: %s)", w.Code, w.Body.String())
	}

	var resp models.Product
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	if err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if resp.Name != payload.Name {
		t.Errorf("expected product name %q, got %q", payload.Name, resp.Name)
	}
	if resp.WeightGrams != payload.WeightGrams {
		t.Errorf("expected weight grams %d, got %d", payload.WeightGrams, resp.WeightGrams)
	}
	if !strings.HasPrefix(resp.QRCode, "data:image/png;base64,") {
		t.Errorf("expected QR code to be data URI base64 string, got: %s", resp.QRCode)
	}
}
