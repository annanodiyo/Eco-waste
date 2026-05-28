package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"github.com/annanodiyo/Eco-waste/server/internal/repository"
	"github.com/annanodiyo/Eco-waste/server/internal/services"
	"github.com/gin-gonic/gin"
)

type WasteHandler struct {
	depositRepo *repository.WasteDepositRepository
	productRepo *repository.ProductRepository
	blockchain  *services.BlockchainService
}

func NewWasteHandler(depositRepo *repository.WasteDepositRepository, productRepo *repository.ProductRepository, bc *services.BlockchainService) *WasteHandler {
	return &WasteHandler{depositRepo: depositRepo, productRepo: productRepo, blockchain: bc}
}

// POST /api/v1/waste/deposit
func (h *WasteHandler) CreateDeposit(c *gin.Context) {
	var req models.WasteDepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wasteType := req.WasteType

	// If QR scan, look up product to get correct waste type.
	if req.HasQR && req.ProductID != "" {
		product, err := h.productRepo.Get(req.ProductID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
			return
		}
		if product == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "product not found — is it registered?"})
			return
		}
		wasteType = product.Material
	}

	tokens := models.CalculateTokens(wasteType, req.WeightGrams)

	txHash, err := h.blockchain.DepositWasteOnChain(
		req.ProductID, req.HasQR,
		[20]byte{}, // real version: common.HexToAddress(req.DepositorAddr)
		uint8(wasteType), nil,
	)
	if err != nil {
		fmt.Printf("blockchain deposit error (non-fatal): %v\n", err)
		txHash = "pending"
	}

	deposit := &models.WasteDeposit{
		ProductID:     req.ProductID,
		HasQR:         req.HasQR,
		DepositorAddr: req.DepositorAddr,
		CollectorAddr: req.CollectorAddr,
		WasteType:     wasteType,
		WasteTypeName: wasteType.String(),
		WeightGrams:   req.WeightGrams,
		TokensEarned:  tokens,
		Status:        models.StatusPending,
		StatusName:    models.StatusPending.String(),
		TxHash:        txHash,
		Timestamp:     time.Now(),
	}

	if err := h.depositRepo.Create(deposit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store deposit: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, deposit)
}

// POST /api/v1/waste/confirm-recycling
func (h *WasteHandler) ConfirmRecycling(c *gin.Context) {
	var req models.ConfirmRecyclingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deposit, err := h.depositRepo.Get(req.DepositID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	if deposit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deposit not found"})
		return
	}
	if deposit.Status == models.StatusRecycled {
		c.JSON(http.StatusConflict, gin.H{"error": "already recycled"})
		return
	}

	txHash, err := h.blockchain.ConfirmRecyclingOnChain(nil)
	if err != nil {
		fmt.Printf("blockchain confirm error (non-fatal): %v\n", err)
		txHash = "pending"
	}

	now := time.Now()
	deposit.Status = models.StatusRecycled
	deposit.StatusName = models.StatusRecycled.String()
	deposit.RecycledAt = &now
	deposit.TxHash = txHash
	if err := h.depositRepo.Update(deposit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update deposit: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, deposit)
}

// GET /api/v1/waste/depositor/:address
func (h *WasteHandler) GetDepositorHistory(c *gin.Context) {
	addr := c.Param("address")
	deposits, err := h.depositRepo.GetByDepositor(addr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	totalTokens := 0
	for _, d := range deposits {
		totalTokens += d.TokensEarned
	}
	c.JSON(http.StatusOK, gin.H{
		"deposits":    deposits,
		"total":       len(deposits),
		"totalTokens": totalTokens,
	})
}

// GET /api/v1/waste/pending
func (h *WasteHandler) GetPendingDeposits(c *gin.Context) {
	deposits, err := h.depositRepo.GetPending()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deposits": deposits, "total": len(deposits)})
}

// GET /api/v1/waste/all
func (h *WasteHandler) GetAllDeposits(c *gin.Context) {
	deposits, err := h.depositRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deposits": deposits, "total": len(deposits)})
}

// GET /api/v1/waste/:id
func (h *WasteHandler) GetDeposit(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deposit id"})
		return
	}
	deposit, err := h.depositRepo.Get(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	if deposit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deposit not found"})
		return
	}
	c.JSON(http.StatusOK, deposit)
}