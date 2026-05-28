package services

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// EthClient wraps a live go-ethereum RPC connection to Polygon/Ethereum.
type EthClient struct {
	client   *ethclient.Client
	chainID  *big.Int
	privKey  *ecdsa.PrivateKey
	from     common.Address
}

// NewEthClient dials the configured RPC endpoint and loads the signing key.
// Required env vars:
//   ETH_RPC_URL     – e.g. "https://polygon-rpc.com" or Alchemy/Infura URL
//   ETH_PRIVATE_KEY – hex-encoded private key for the relayer/backend wallet
//
// If either is missing the function logs a warning and returns nil, allowing
// the app to fall back to the mock BlockchainService.
func NewEthClient() *EthClient {
	rpcURL := os.Getenv("ETH_RPC_URL")
	privKeyHex := os.Getenv("ETH_PRIVATE_KEY")

	if rpcURL == "" || privKeyHex == "" {
		log.Println("[blockchain] ETH_RPC_URL or ETH_PRIVATE_KEY not set — using mock BlockchainService")
		return nil
	}

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		log.Printf("[blockchain] failed to dial RPC %s: %v — using mock\n", rpcURL, err)
		return nil
	}

	chainID, err := client.ChainID(context.Background())
	if err != nil {
		log.Printf("[blockchain] failed to get chain ID: %v — using mock\n", err)
		return nil
	}

	privKeyHex = strings.TrimPrefix(privKeyHex, "0x")
	privKey, err := crypto.HexToECDSA(privKeyHex)
	if err != nil {
		log.Printf("[blockchain] invalid private key: %v — using mock\n", err)
		return nil
	}

	from := crypto.PubkeyToAddress(privKey.PublicKey)
	log.Printf("[blockchain] connected to chain %s as %s\n", chainID, from.Hex())

	return &EthClient{
		client:  client,
		chainID: chainID,
		privKey: privKey,
		from:    from,
	}
}

// NewTransactor builds a bind.TransactOpts for submitting a transaction.
func (e *EthClient) NewTransactor() (*bind.TransactOpts, error) {
	auth, err := bind.NewKeyedTransactorWithChainID(e.privKey, e.chainID)
	if err != nil {
		return nil, fmt.Errorf("create transactor: %w", err)
	}

	// Suggest current gas price from node
	gasPrice, err := e.client.SuggestGasPrice(context.Background())
	if err != nil {
		// Fall back to a sensible default for Polygon (~30 gwei)
		gasPrice = big.NewInt(30_000_000_000)
	}
	auth.GasPrice = gasPrice
	auth.GasLimit = uint64(300_000) // adequate for typical ERC-20 / registry calls

	return auth, nil
}

// LoadABI parses a JSON ABI string.
func LoadABI(abiJSON string) (abi.ABI, error) {
	parsed, err := abi.JSON(strings.NewReader(abiJSON))
	if err != nil {
		return abi.ABI{}, fmt.Errorf("parse ABI: %w", err)
	}
	return parsed, nil
}

// GasPrice returns the current suggested gas price from the node.
func (e *EthClient) GasPrice(ctx context.Context) (*big.Int, error) {
	return e.client.SuggestGasPrice(ctx)
}

// Client exposes the raw *ethclient.Client for use with generated bindings.
func (e *EthClient) Client() *ethclient.Client {
	return e.client
}
