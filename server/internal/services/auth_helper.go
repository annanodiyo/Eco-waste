package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("eco-waste-secret-key-change-in-production")

func GenerateNonce() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func GenerateJWTToken(wallet string, role string) (string, error) {
	claims := jwt.MapClaims{
		"wallet": strings.ToLower(wallet),
		"role":   role,
		"exp":    time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func VerifyJWTToken(tokenString string) (string, string, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return "", "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		wallet, _ := claims["wallet"].(string)
		role, _ := claims["role"].(string)
		return wallet, role, nil
	}
	return "", "", errors.New("invalid claims")
}

func VerifySIWESignature(wallet string, message string, signatureHex string) (bool, error) {
	// Remove hex prefix if present
	if strings.HasPrefix(signatureHex, "0x") {
		signatureHex = signatureHex[2:]
	}

	sig, err := hex.DecodeString(signatureHex)
	if err != nil {
		return false, fmt.Errorf("invalid signature hex: %v", err)
	}

	if len(sig) != 65 {
		return false, fmt.Errorf("invalid signature length: expected 65, got %d", len(sig))
	}

	// Adjust recovery id V (sig[64]) from 27/28 to 0/1
	if sig[64] >= 27 {
		sig[64] -= 27
	}

	// Form the standard Ethereum Signed Message hash
	msg := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256Hash([]byte(msg))

	// Recover the public key
	pubKey, err := crypto.SigToPub(hash.Bytes(), sig)
	if err != nil {
		return false, fmt.Errorf("failed to recover public key: %v", err)
	}

	// Convert public key to address
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)

	// Compare with requested wallet
	return strings.ToLower(recoveredAddr.Hex()) == strings.ToLower(wallet), nil
}
