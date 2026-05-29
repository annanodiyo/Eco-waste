package services

import (
	"encoding/base64"
	"strings"
	"testing"
)

func TestGenerateAndDecodeQR(t *testing.T) {
	payload := QRPayload{
		ProductID:    "test-product-123",
		Name:         "Eco Bottle",
		Manufacturer: "Green Corp",
		Material:     0,
		WeightGrams:  500,
	}

	// 1. Test Generating QR Code
	qrDataURI, err := GenerateQR(payload)
	if err != nil {
		t.Fatalf("failed to generate QR: %v", err)
	}

	if !strings.HasPrefix(qrDataURI, "data:image/png;base64,") {
		t.Errorf("expected QR code to have data URI prefix, got: %s", qrDataURI)
	}

	// Decode the base64 part to verify it's valid base64
	base64Part := strings.TrimPrefix(qrDataURI, "data:image/png;base64,")
	_, err = base64.StdEncoding.DecodeString(base64Part)
	if err != nil {
		t.Errorf("failed to decode base64 QR content: %v", err)
	}

	// 2. Test DecodeQR with JSON payload
	rawJSON := `{"productId":"test-product-123","name":"Eco Bottle","manufacturer":"Green Corp","material":0,"weightGrams":500}`
	decoded, err := DecodeQR(rawJSON)
	if err != nil {
		t.Fatalf("failed to decode QR payload: %v", err)
	}

	if decoded.ProductID != payload.ProductID {
		t.Errorf("expected ProductID %q, got %q", payload.ProductID, decoded.ProductID)
	}
	if decoded.Name != payload.Name {
		t.Errorf("expected Name %q, got %q", payload.Name, decoded.Name)
	}
	if decoded.WeightGrams != payload.WeightGrams {
		t.Errorf("expected WeightGrams %d, got %d", payload.WeightGrams, decoded.WeightGrams)
	}

	// 3. Test validation error for empty product ID
	emptyPayload := QRPayload{
		ProductID: "",
	}
	_, err = GenerateQR(emptyPayload)
	if err == nil {
		t.Errorf("expected error generating QR with empty product ID, got nil")
	}
}
