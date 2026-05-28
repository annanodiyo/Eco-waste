package services

// BlockchainServiceI is the interface that both BlockchainService (mock)
// and OnChainBlockchainService (real) satisfy.  Handlers should accept
// this interface, not the concrete types.
type BlockchainServiceI interface {
	RegisterProductOnChain(productID, name string, material uint8, weight interface{}, manufacturer string) (string, error)
	TransferOwnershipOnChain(productID string, newOwner string) (string, error)
	RegisterVendorOnChain(wallet string) (string, error)
	DepositWasteOnChain(productID string, hasQR bool, depositorAddr [20]byte, wasteType uint8, weight interface{}) (string, error)
	ConfirmRecyclingOnChain(depositID interface{}) (string, error)
}
