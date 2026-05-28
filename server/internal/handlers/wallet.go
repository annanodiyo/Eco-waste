package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// GET /api/v1/wallet/balance/:address
func (h *Handler) WalletBallance(c *gin.Context) {
	address := strings.ToLower(c.Param("address"))
	deposits, err := h.depositRepo.GetByDepositor(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}

	totalTokens := 0
	for _, d := range deposits {
		totalTokens += d.TokensEarned
	}

	c.JSON(http.StatusOK, gin.H{
		"address": address,
		"balance": totalTokens,
	})
}

// GET /api/v1/wallet/history/:address
func (h *Handler) ConsumerHistory(c *gin.Context) {
	address := strings.ToLower(c.Param("address"))
	deposits, err := h.depositRepo.GetByDepositor(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deposits": deposits,
		"total":    len(deposits),
	})
}