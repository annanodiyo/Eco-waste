
package services

import (
	"encoding/base64"
	"encoding/json"
	"fmt"

	qrcode "github.com/skip2/go-qrcode"
)

// QRPayload is encoded inside the QR code
type QRPayload struct {
	ProductID    string `json:"productId"`
	Name         string `json:"name"`
	Manufacturer string `json:"manufacturer"`
	Material     int    `json:"material"`
	WeightGrams  int    `json:"weightGrams"`
}

// GenerateQR creates a base64 PNG of the QR code for the given product
func GenerateQR(payload QRPayload) (string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal qr payload: %w", err)
	}

	png, err := qrcode.Encode(string(data), qrcode.Medium, 256)
	if err != nil {
		return "", fmt.Errorf("generate qr: %w", err)
	}

	return base64.StdEncoding.EncodeToString(png), nil
}

// DecodeQR decodes a QR string back to a payload (for frontend helpers)
func DecodeQR(qrData string) (*QRPayload, error) {
	var payload QRPayload
	if err := json.Unmarshal([]byte(qrData), &payload); err != nil {
		return nil, fmt.Errorf("decode qr: %w", err)
	}
	return &payload, nil
}