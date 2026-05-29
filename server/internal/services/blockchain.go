package services

import "fmt"

// BlockchainService is a mock — swap for a real on-chain client later.
type BlockchainService struct{}

func (b *BlockchainService) RegisterProductOnChain(
	productID, name string,
	material uint8,
	weightGrams int,
	manufacturer string,
) (string, error) {
	return fmt.Sprintf("mock-tx-register-%s", productID), nil
}

func (b *BlockchainService) DepositWasteOnChain(
	productID string,
	hasQR bool,
	depositorAddr [20]byte,
	wasteType uint8,
	weightGrams int,
) (string, error) {
	return fmt.Sprintf("mock-tx-deposit-%s", productID), nil
}

func (b *BlockchainService) ConfirmRecyclingOnChain(depositID uint64) (string, error) {
	return fmt.Sprintf("mock-tx-confirm-%d", depositID), nil
}