package services

import (
	"context"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// Contract addresses — override via env if needed (currently match ABI stubs)
const (
	ProductRegistryAddr = "0x2F73D8525b6aD55152865913e846061358F49e0B"
	WasteDepositAddr    = "0xA9B4F3c7d82E1e6035Fa2D4b1C9e08F2bD7A6015"
	EcoTokenAddr        = "0x8c5F04Ae312C9a7B6f4bD2e0B3a5D1C8e9F0023"
)

// Minimal ABIs — just the function signatures we need to call.
// Use full ABI JSON files when you have them from the contract build.
const productRegistryABI = `[
  {
    "name": "registerProduct",
    "type": "function",
    "inputs": [
      {"name": "productId", "type": "string"},
      {"name": "name",      "type": "string"},
      {"name": "material",  "type": "uint8"},
      {"name": "weight",    "type": "uint256"},
      {"name": "manufacturer", "type": "address"}
    ],
    "outputs": []
  },
  {
    "name": "transferOwnership",
    "type": "function",
    "inputs": [
      {"name": "productId", "type": "string"},
      {"name": "newOwner",  "type": "address"}
    ],
    "outputs": []
  }
]`

const wasteDepositABI = `[
  {
    "name": "deposit",
    "type": "function",
    "inputs": [
      {"name": "productId",   "type": "string"},
      {"name": "hasQR",       "type": "bool"},
      {"name": "wasteType",   "type": "uint8"},
      {"name": "weight",      "type": "uint256"}
    ],
    "outputs": [{"name": "depositId", "type": "uint256"}]
  },
  {
    "name": "confirmRecycling",
    "type": "function",
    "inputs": [{"name": "depositId", "type": "uint256"}],
    "outputs": []
  }
]`

// OnChainBlockchainService dispatches real transactions via EthClient.
// Falls back to BlockchainService (mock) if EthClient is nil.
type OnChainBlockchainService struct {
	eth  *EthClient
	mock *BlockchainService
}

// NewOnChainBlockchainService creates the service; if EthClient cannot
// connect (missing env vars, etc.) the mock is used transparently.
func NewOnChainBlockchainService() *OnChainBlockchainService {
	return &OnChainBlockchainService{
		eth:  NewEthClient(),
		mock: &BlockchainService{},
	}
}

// send packs the call data and sends a raw transaction.
func (s *OnChainBlockchainService) send(contractAddr string, parsedABI abi.ABI, method string, args ...interface{}) (string, error) {
	data, err := parsedABI.Pack(method, args...)
	if err != nil {
		return "", fmt.Errorf("pack %s: %w", method, err)
	}

	auth, err := s.eth.NewTransactor()
	if err != nil {
		return "", err
	}

	to := common.HexToAddress(contractAddr)
	nonce, err := s.eth.client.PendingNonceAt(context.Background(), s.eth.from)
	if err != nil {
		return "", fmt.Errorf("fetch nonce: %w", err)
	}

	gasLimit, err := s.eth.client.EstimateGas(context.Background(), ethereum.CallMsg{
		From: s.eth.from,
		To:   &to,
		Data: data,
	})
	if err != nil {
		gasLimit = auth.GasLimit // fallback
	}

	tx := types.NewTransaction(nonce, to, big.NewInt(0), gasLimit, auth.GasPrice, data)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(s.eth.chainID), s.eth.privKey)
	if err != nil {
		return "", fmt.Errorf("sign tx: %w", err)
	}

	if err := s.eth.client.SendTransaction(context.Background(), signedTx); err != nil {
		return "", fmt.Errorf("send tx: %w", err)
	}

	return signedTx.Hash().Hex(), nil
}

func (s *OnChainBlockchainService) RegisterProductOnChain(
	productID, name string,
	material uint8,
	weight interface{},
	manufacturer string,
) (string, error) {
	if s.eth == nil {
		return s.mock.RegisterProductOnChain(productID, name, material, weight, manufacturer)
	}

	parsedABI, err := LoadABI(productRegistryABI)
	if err != nil {
		return "", err
	}

	w, _ := weight.(int)
	return s.send(ProductRegistryAddr, parsedABI, "registerProduct",
		productID,
		name,
		material,
		big.NewInt(int64(w)),
		common.HexToAddress(strings.ToLower(manufacturer)),
	)
}

func (s *OnChainBlockchainService) TransferOwnershipOnChain(productID string, newOwner string) (string, error) {
	if s.eth == nil {
		return s.mock.TransferOwnershipOnChain(productID, newOwner)
	}

	parsedABI, err := LoadABI(productRegistryABI)
	if err != nil {
		return "", err
	}

	return s.send(ProductRegistryAddr, parsedABI, "transferOwnership",
		productID,
		common.HexToAddress(strings.ToLower(newOwner)),
	)
}

func (s *OnChainBlockchainService) RegisterVendorOnChain(wallet string) (string, error) {
	// No dedicated on-chain call for vendor registration — use mock stub
	return s.mock.RegisterVendorOnChain(wallet)
}

func (s *OnChainBlockchainService) DepositWasteOnChain(
	productID string,
	hasQR bool,
	depositorAddr [20]byte,
	wasteType uint8,
	weight interface{},
) (string, error) {
	if s.eth == nil {
		return s.mock.DepositWasteOnChain(productID, hasQR, depositorAddr, wasteType, weight)
	}

	parsedABI, err := LoadABI(wasteDepositABI)
	if err != nil {
		return "", err
	}

	w, _ := weight.(int)
	return s.send(WasteDepositAddr, parsedABI, "deposit",
		productID,
		hasQR,
		wasteType,
		big.NewInt(int64(w)),
	)
}

func (s *OnChainBlockchainService) ConfirmRecyclingOnChain(depositID interface{}) (string, error) {
	if s.eth == nil {
		return s.mock.ConfirmRecyclingOnChain(depositID)
	}

	parsedABI, err := LoadABI(wasteDepositABI)
	if err != nil {
		return "", err
	}

	id, _ := depositID.(uint64)
	return s.send(WasteDepositAddr, parsedABI, "confirmRecycling", new(big.Int).SetUint64(id))
}
