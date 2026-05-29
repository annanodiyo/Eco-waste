package services

import (
	"encoding/base64"
	"encoding/json"
	"fmt"

	qrcode "github.com/skip2/go-qrcode"
)

// QRPayload is encoded inside the QR code.
type QRPayload struct {
	ProductID    string `json:"productId"`
	Name         string `json:"name"`
	Manufacturer string `json:"manufacturer"`
	Material     int    `json:"material"`
	WeightGrams  int    `json:"weightGrams"`
}

// GenerateQR creates a base64-encoded PNG data URI of the QR code for the given product.
func GenerateQR(payload QRPayload) (string, error) {
	if payload.ProductID == "" {
		return "", fmt.Errorf("generate qr: productID is required")
	}
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

// DecodeQR decodes a raw JSON QR string back to a QRPayload.
func DecodeQR(qrData string) (*QRPayload, error) {
	var payload QRPayload
	if err := json.Unmarshal([]byte(qrData), &payload); err != nil {
		return nil, fmt.Errorf("decode qr: %w", err)
	}
	return &payload, nil
}