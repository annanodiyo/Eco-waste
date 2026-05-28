package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"github.com/annanodiyo/Eco-waste/server/internal/repository"
	"github.com/annanodiyo/Eco-waste/server/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductHandler struct {
	repo       *repository.ProductRepository
	blockchain *services.BlockchainService
}

func NewProductHandler(repo *repository.ProductRepository, bc *services.BlockchainService) *ProductHandler {
	return &ProductHandler{repo: repo, blockchain: bc}
}

// POST /api/v1/products/register
func (h *ProductHandler) RegisterProduct(c *gin.Context) {
	var req models.RegisterProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID := uuid.New().String()

	qrBase64, err := services.GenerateQR(productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR: " + err.Error()})
		return
	}

	txHash, err := h.blockchain.RegisterProductOnChain(
		productID, req.Name, uint8(req.Material),
		nil,
		req.Manufacturer,
	)
	if err != nil {
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

	if err := h.repo.Create(product); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store product: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, product)
}

// GET /api/v1/products/:id
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id := c.Param("id")
	product, err := h.repo.Get(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	if product == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}

// GET /api/v1/products
func (h *ProductHandler) ListProducts(c *gin.Context) {
	products, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"products": products, "total": len(products)})
}

// POST /api/v1/products/decode-qr
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

	product, err := h.repo.Get(payload.PID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}

	if product != nil {
		c.JSON(http.StatusOK, gin.H{"payload": payload, "product": product, "found": true})
	} else {
		c.JSON(http.StatusOK, gin.H{"payload": payload, "found": false})
	}
}

// POST /api/v1/products/transfer
func (h *ProductHandler) TransferOwnership(c *gin.Context) {
	var req struct {
		ProductID string `json:"productId" binding:"required"`
		NewOwner  string `json:"newOwner" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current wallet from auth context
	currentWalletVal, exists := c.Get("wallet")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}
	currentWallet := currentWalletVal.(string)

	product, err := h.repo.Get(req.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	if product == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// Verify that current user is the current owner
	if strings.ToLower(product.WalletAddr) != strings.ToLower(currentWallet) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only the current product owner can transfer ownership"})
		return
	}

	// Call blockchain mock/real transfer function
	txHash, err := h.blockchain.TransferOwnershipOnChain(req.ProductID, req.NewOwner)
	if err != nil {
		fmt.Printf("blockchain transfer error (non-fatal): %v\n", err)
		txHash = "pending-transfer"
	}

	// Update ownership in DB
	product.WalletAddr = strings.ToLower(req.NewOwner)
	product.TxHash = txHash

	if err := h.repo.Update(product); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ownership: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ownership transferred successfully", "product": product})
}

// POST /api/v1/products/scan
func (h *ProductHandler) ScanProduct(c *gin.Context) {
	var body struct {
		QRData string `json:"qrData" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Decode and verify signed QR payload
	payload, err := services.DecodeQR(body.QRData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "QR verification failed: " + err.Error()})
		return
	}

	product, err := h.repo.Get(payload.PID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}

	if product == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product verified but not found in database registry"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "product verified successfully",
		"productId":    product.ProductID,
		"name":         product.Name,
		"material":     product.MaterialName,
		"weightGrams":  product.WeightGrams,
		"manufacturer": product.Manufacturer,
		"currentOwner": product.WalletAddr,
		"registeredAt": product.RegisteredAt,
		"txHash":       product.TxHash,
	})
}