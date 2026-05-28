package handlers

import (
	"github.com/annanodiyo/Eco-waste/server/internal/repository"
)

type Handler struct {
	userRepo    *repository.UserRepository
	depositRepo *repository.WasteDepositRepository
}

func NewHandler(userRepo *repository.UserRepository, depositRepo *repository.WasteDepositRepository) *Handler {
	return &Handler{userRepo: userRepo, depositRepo: depositRepo}
}
