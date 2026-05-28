package handlers

import (
	"net/http"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"github.com/annanodiyo/Eco-waste/server/internal/repository"
	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	depositRepo *repository.WasteDepositRepository
	userRepo    *repository.UserRepository
}

func NewStatsHandler(depositRepo *repository.WasteDepositRepository, userRepo *repository.UserRepository) *StatsHandler {
	return &StatsHandler{depositRepo: depositRepo, userRepo: userRepo}
}

// GET /api/v1/stats
func (h *StatsHandler) GetStats(c *gin.Context) {
	deposits, err := h.depositRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}

	totalDeposits := len(deposits)
	totalRecycledCount := 0
	totalWeightGrams := 0
	totalRecycledWeightGrams := 0
	totalTokensIssued := 0

	collectorsMap := make(map[string]bool)
	materialsMap := make(map[string]int) // material name -> total weight

	for _, d := range deposits {
		totalWeightGrams += d.WeightGrams
		totalTokensIssued += d.TokensEarned

		if d.CollectorAddr != "" {
			collectorsMap[d.CollectorAddr] = true
		}

		if d.Status == models.StatusRecycled {
			totalRecycledCount++
			totalRecycledWeightGrams += d.WeightGrams
		}

		materialsMap[d.WasteTypeName] += d.WeightGrams
	}

	recyclingRate := 0.0
	if totalDeposits > 0 {
		recyclingRate = float64(totalRecycledCount) / float64(totalDeposits) * 100.0
	}

	c.JSON(http.StatusOK, gin.H{
		"totalDeposits":            totalDeposits,
		"totalRecycledCount":       totalRecycledCount,
		"totalWeightGrams":        totalWeightGrams,
		"totalRecycledWeightGrams": totalRecycledWeightGrams,
		"totalTokensIssued":        totalTokensIssued,
		"activeCollectors":         len(collectorsMap),
		"recyclingRate":            recyclingRate,
		"materialsBreakdown":       materialsMap,
	})
}
