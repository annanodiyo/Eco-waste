package models

import "time"

type MaterialType int

const (
	MaterialPlastic  MaterialType = 0
	MaterialPaper    MaterialType = 1
	MaterialGlass    MaterialType = 2
	MaterialMetal    MaterialType = 3
	MaterialEWaste   MaterialType = 4
	MaterialOrganic  MaterialType = 5
)

func (m MaterialType) String() string {
	switch m {
	case MaterialPlastic:
		return "PLASTIC"
	case MaterialPaper:
		return "PAPER"
	case MaterialGlass:
		return "GLASS"
	case MaterialMetal:
		return "METAL"
	case MaterialEWaste:
		return "E-WASTE"
	case MaterialOrganic:
		return "ORGANIC"
	default:
		return "UNKNOWN"
	}
}

func (m MaterialType) TokenRate() int {
	switch m {
	case MaterialEWaste:
		return 15
	case MaterialMetal:
		return 10
	case MaterialPlastic:
		return 5
	case MaterialGlass:
		return 5
	case MaterialPaper:
		return 2
	default:
		return 1
	}
}

// RegisterProductRequest is the payload from the frontend to register a product
type RegisterProductRequest struct {
	Name         string       `json:"name" binding:"required"`
	Material     MaterialType `json:"material"`
	WeightGrams  int          `json:"weightGrams" binding:"required,min=1"`
	Manufacturer string       `json:"manufacturer" binding:"required"`
	WalletAddr   string       `json:"walletAddress" binding:"required"`
}

// Product is stored in-memory / returned to the frontend
type Product struct {
	ProductID    string       `json:"productId"`
	Name         string       `json:"name"`
	Material     MaterialType `json:"material"`
	MaterialName string       `json:"materialName"`
	WeightGrams  int          `json:"weightGrams"`
	Manufacturer string       `json:"manufacturer"`
	WalletAddr   string       `json:"walletAddress"`
	RegisteredAt time.Time    `json:"registeredAt"`
	TxHash       string       `json:"txHash,omitempty"`
	QRCode       string       `json:"qrCode,omitempty"` // base64 PNG
}