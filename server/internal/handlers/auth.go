package handlers

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"github.com/annanodiyo/Eco-waste/server/internal/services"
	"github.com/gin-gonic/gin"
)

var (
	nonces   = make(map[string]time.Time)
	noncesMu sync.Mutex
)

// GET /api/v1/auth/nonce
func (h *Handler) GetNonce(c *gin.Context) {
	nonce := services.GenerateNonce()
	
	noncesMu.Lock()
	nonces[nonce] = time.Now().Add(5 * time.Minute) // valid for 5 min
	noncesMu.Unlock()

	c.JSON(http.StatusOK, gin.H{"nonce": nonce})
}

// POST /api/v1/auth/login
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Wallet    string `json:"wallet" binding:"required"`
		Message   string `json:"message" binding:"required"`
		Signature string `json:"signature" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify SIWE signature
	valid, err := services.VerifySIWESignature(req.Wallet, req.Message, req.Signature)
	if err != nil || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature verification"})
		return
	}

	wallet := strings.ToLower(req.Wallet)
	user, err := h.userRepo.GetByWallet(wallet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}

	// Auto-register as CONSUMER if they don't exist yet
	if user == nil {
		user = &models.User{
			Wallet:    wallet,
			Role:      "CONSUMER",
			CreatedAt: time.Now(),
		}
		if err := h.userRepo.Create(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register user: " + err.Error()})
			return
		}
	}

	// Generate JWT session token
	token, err := services.GenerateJWTToken(user.Wallet, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate session: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"role":  user.Role,
		"user":  user,
	})
}

// POST /api/v1/auth/register
func (h *Handler) RegisterUser(c *gin.Context) {
	var req struct {
		Wallet string `json:"wallet" binding:"required"`
		Role   string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet := strings.ToLower(req.Wallet)
	role := strings.ToUpper(req.Role)

	// Validate role
	validRoles := map[string]bool{
		"MANUFACTURER": true,
		"SELLER":       true,
		"COLLECTOR":    true,
		"RECYCLER":     true,
		"ADMIN":        true,
		"CONSUMER":     true,
	}
	if !validRoles[role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role specified"})
		return
	}

	user, err := h.userRepo.GetByWallet(wallet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}

	if user != nil {
		// Update existing user role
		if err := h.userRepo.UpdateRole(wallet, role); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update role: " + err.Error()})
			return
		}
		user.Role = role
	} else {
		// Create new user
		user = &models.User{
			Wallet:    wallet,
			Role:      role,
			CreatedAt: time.Now(),
		}
		if err := h.userRepo.Create(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user: " + err.Error()})
			return
		}
	}

	// Generate JWT session token
	token, err := services.GenerateJWTToken(user.Wallet, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate session: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"role":  user.Role,
		"user":  user,
	})
}