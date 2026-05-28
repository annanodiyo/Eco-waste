package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	qrcode "github.com/skip2/go-qrcode"
)

const (
	QRVersion   = "1.0"
	QRChain     = "polygon"
	QRContract  = "0x2F73D8525b6aD55152865913e846061358F49e0B" // Deployed ProductRegistry address (mock or real)
	QRSecretKey = "eco-waste-tamper-proof-qr-secret-key-1029"
)

// QRPayload matches the enhanced tamper-proof structure
type QRPayload struct {
	PID      string `json:"pid"`
	Sig      string `json:"sig"`
	Contract string `json:"contract"`
	Chain    string `json:"chain"`
	Version  string `json:"version"`
	Expires  int64  `json:"expires"`
}

// GenerateQR creates a base64-encoded PNG of the QR code for a given product ID.
func GenerateQR(pid string) (string, error) {
	// Set expiry to 10 years for durable consumer goods
	expiresAt := time.Now().Add(10 * 365 * 24 * time.Hour)
	payload := SignPayload(pid, expiresAt)

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

	// Run signature & tamper verification
	valid, err := VerifyQR(payload)
	if err != nil || !valid {
		return nil, fmt.Errorf("tamper verification failed: %v", err)
	}

	return &payload, nil
}

// SignPayload computes a cryptographic signature for the QR payload
func SignPayload(pid string, expiresAt time.Time) QRPayload {
	expiresUnix := expiresAt.Unix()
	msg := fmt.Sprintf("%s|%s|%s|%s|%d", pid, QRContract, QRChain, QRVersion, expiresUnix)

	mac := hmac.New(sha256.New, []byte(QRSecretKey))
	mac.Write([]byte(msg))
	sigHex := hex.EncodeToString(mac.Sum(nil))

	return QRPayload{
		PID:      pid,
		Sig:      sigHex,
		Contract: QRContract,
		Chain:    QRChain,
		Version:  QRVersion,
		Expires:  expiresUnix,
	}
}

// VerifyQR validates the expiration and re-computes HMAC to ensure it is not tampered
func VerifyQR(payload QRPayload) (bool, error) {
	if time.Now().Unix() > payload.Expires {
		return false, errors.New("QR code has expired")
	}

	if payload.Chain != QRChain || payload.Contract != QRContract {
		return false, errors.New("invalid chain or contract address in QR")
	}

	// Recompute and check HMAC
	msg := fmt.Sprintf("%s|%s|%s|%s|%d", payload.PID, payload.Contract, payload.Chain, payload.Version, payload.Expires)
	mac := hmac.New(sha256.New, []byte(QRSecretKey))
	mac.Write([]byte(msg))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(payload.Sig), []byte(expectedSig)) {
		return false, errors.New("cryptographic signature mismatch (tampering detected)")
	}

	return true, nil
}
