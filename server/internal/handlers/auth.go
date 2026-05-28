package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
)


func (h *Handler) RegisterUser(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"msg": "it works"})
}