package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// GET /api/v1/amount/:address/kshs
// Converts a depositor's total earned tokens to KSH (1 token = KSH 0.50)

func (h *WasteHandler) ConsumerTokensToKSH(c *gin.Context) {
	addr := strings.ToLower(c.Param("address"))

	deposits := h.store.GetDepositsByDepositor(addr)
	if len(deposits) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no deposits found for this address"})
		return
	}

	totalTokens := 0
	for _, d := range deposits {
		totalTokens += d.TokensEarned
	}

	const kshPerToken = 0.5
	kshValue := float64(totalTokens) * kshPerToken

	c.JSON(http.StatusOK, gin.H{
		"depositorAddr": addr,
		"totalTokens":   totalTokens,
		"kshPerToken":   kshPerToken,
		"kshValue":      kshValue,
		"currency":      "KES",
	})
}