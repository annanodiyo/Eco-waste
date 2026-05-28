package middleware

import (
	"net/http"
	"strings"

	"github.com/annanodiyo/Eco-waste/server/internal/services"
	"github.com/gin-gonic/gin"
)

// AuthRequired parses the JWT token from the Authorization header
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer token"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		wallet, role, err := services.VerifyJWTToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token: " + err.Error()})
			c.Abort()
			return
		}

		// Store details in context for handlers to access
		c.Set("wallet", strings.ToLower(wallet))
		c.Set("role", strings.ToUpper(role))
		c.Next()
	}
}

// RequireRole restricts access to users with specific roles
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role context missing — authentication required"})
			c.Abort()
			return
		}

		userRole, ok := roleVal.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role type in context"})
			c.Abort()
			return
		}

		userRole = strings.ToUpper(userRole)
		isAllowed := false
		for _, r := range allowedRoles {
			if userRole == strings.ToUpper(r) {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access forbidden: insufficient role permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
