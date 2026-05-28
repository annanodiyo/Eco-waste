package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/ecotoken/backend/internal/models"
	"github.com/ecotoken/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductHandler struct {
	store      *models.Store
	blockchain *services.BlockchainService
}

func NewProductHandler(store *models.Store, bc *services.BlockchainService) *ProductHandler {
	return &ProductHandler{store: store, blockchain: bc}
}

// POST /api/products/register
func (h *ProductHandler) RegisterProduct(c *gin.Context) {
	var req models.RegisterProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID := uuid.New().String()

	// Generate QR code
	qrPayload := services.QRPayload{
		ProductID:    productID,
		Name:         req.Name,
		Manufacturer: req.Manufacturer,
		Material:     int(req.Material),
		WeightGrams:  req.WeightGrams,
	}
	qrBase64, err := services.GenerateQR(qrPayload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR: " + err.Error()})
		return
	}

	// Send to blockchain (mock or real)
	txHash, err := h.blockchain.RegisterProductOnChain(
		productID, req.Name, uint8(req.Material),
		nil, // big.Int weight — simplified here
		req.Manufacturer,
	)
	if err != nil {
		// Log but don't fail — store locally still
		fmt.Printf("blockchain register error (non-fatal): %v\n", err)
		txHash = "pending"
	}

	product := &models.Product{
		ProductID:    productID,
		Name:         req.Name,
		Material:     req.Material,
		MaterialName: req.Material.String(),
		WeightGrams:  req.WeightGrams,
		Manufacturer: req.Manufacturer,
		WalletAddr:   req.WalletAddr,
		RegisteredAt: time.Now(),
		TxHash:       txHash,
		QRCode:       qrBase64,
	}

	h.store.AddProduct(product)

	c.JSON(http.StatusCreated, product)
}

// GET /api/products/:id
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id := c.Param("id")
	product, ok := h.store.GetProduct(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}

// GET /api/products
func (h *ProductHandler) ListProducts(c *gin.Context) {
	products := h.store.GetAllProducts()
	c.JSON(http.StatusOK, gin.H{"products": products, "total": len(products)})
}

// POST /api/products/decode-qr — decodes a QR payload string from the scanner
func (h *ProductHandler) DecodeQR(c *gin.Context) {
	var body struct {
		QRData string `json:"qrData" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payload, err := services.DecodeQR(body.QRData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid QR data"})
		return
	}

	// Also look up in store for full details
	product, ok := h.store.GetProduct(payload.ProductID)
	if ok {
		c.JSON(http.StatusOK, gin.H{"payload": payload, "product": product, "found": true})
	} else {
		c.JSON(http.StatusOK, gin.H{"payload": payload, "found": false})
	}
}