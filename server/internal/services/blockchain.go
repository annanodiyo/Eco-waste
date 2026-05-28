package services

import "fmt"

// BlockchainService is a mock — swap for a real on-chain client later.
type BlockchainService struct{}

func (b *BlockchainService) RegisterProductOnChain(
	productID, name string,
	material uint8,
	weight interface{},
	manufacturer string,
) (string, error) {
	return fmt.Sprintf("mock-tx-register-%s", productID), nil
}

func (b *BlockchainService) TransferOwnershipOnChain(productID string, newOwner string) (string, error) {
	return fmt.Sprintf("mock-tx-transfer-%s-to-%s", productID, newOwner), nil
}

func (b *BlockchainService) DepositWasteOnChain(
	productID string,
	hasQR bool,
	depositorAddr [20]byte,
	wasteType uint8,
	weight interface{},
) (string, error) {
	return fmt.Sprintf("mock-tx-deposit-%s", productID), nil
}

func (b *BlockchainService) ConfirmRecyclingOnChain(depositID interface{}) (string, error) {
	return "mock-tx-confirm", nil
}