package models

import "time"

type ProcessingStatus int

const (
	StatusPending   ProcessingStatus = 0
	StatusCollected ProcessingStatus = 1
	StatusRecycled  ProcessingStatus = 2
)

func (s ProcessingStatus) String() string {
	switch s {
	case StatusPending:
		return "PENDING"
	case StatusCollected:
		return "COLLECTED"
	case StatusRecycled:
		return "RECYCLED"
	default:
		return "UNKNOWN"
	}
}

type WasteDepositRequest struct {
	ProductID     string       `json:"productId"`  // empty = manual drop-off
	HasQR         bool         `json:"hasQR"`
	DepositorAddr string       `json:"depositorAddress" binding:"required"`
	CollectorAddr string       `json:"collectorAddress" binding:"required"`
	WasteType     MaterialType `json:"wasteType"`
	WeightGrams   int          `json:"weightGrams" binding:"required,min=1"`
}

type WasteDeposit struct {
	ID            uint64           `json:"id"`
	ProductID     string           `json:"productId,omitempty"`
	HasQR         bool             `json:"hasQR"`
	DepositorAddr string           `json:"depositorAddress"`
	CollectorAddr string           `json:"collectorAddress"`
	WasteType     MaterialType     `json:"wasteType"`
	WasteTypeName string           `json:"wasteTypeName"`
	WeightGrams   int              `json:"weightGrams"`
	TokensEarned  int              `json:"tokensEarned"`
	Status        ProcessingStatus `json:"status"`
	StatusName    string           `json:"statusName"`
	TxHash        string           `json:"txHash,omitempty"`
	Timestamp     time.Time        `json:"timestamp"`
	RecycledAt    *time.Time       `json:"recycledAt,omitempty"`
}

type ConfirmRecyclingRequest struct {
	DepositID     uint64 `json:"depositId" binding:"required"`
	RecyclerAddr  string `json:"recyclerAddress" binding:"required"`
}

// CalculateTokens mirrors the Solidity logic
func CalculateTokens(material MaterialType, weightGrams int) int {
	rate := material.TokenRate()
	return (weightGrams * rate) / 100
}