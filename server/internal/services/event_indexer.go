package services

import (
	"context"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"github.com/annanodiyo/Eco-waste/server/internal/repository"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// Minimal event ABIs — extend with full JSON when you have the compiled artifacts.
const eventIndexerProductABI = `[
  {
    "name": "ProductRegistered",
    "type": "event",
    "inputs": [
      {"name": "productId", "type": "string",  "indexed": false},
      {"name": "manufacturer", "type": "address", "indexed": true}
    ]
  },
  {
    "name": "OwnershipTransferred",
    "type": "event",
    "inputs": [
      {"name": "productId", "type": "string",  "indexed": false},
      {"name": "newOwner",  "type": "address",  "indexed": true}
    ]
  }
]`

const eventIndexerDepositABI = `[
  {
    "name": "WasteDeposited",
    "type": "event",
    "inputs": [
      {"name": "depositId", "type": "uint256", "indexed": true},
      {"name": "productId", "type": "string",  "indexed": false},
      {"name": "depositor", "type": "address",  "indexed": true}
    ]
  },
  {
    "name": "RecyclingConfirmed",
    "type": "event",
    "inputs": [
      {"name": "depositId", "type": "uint256", "indexed": true},
      {"name": "recycler",  "type": "address",  "indexed": true}
    ]
  }
]`

// EventIndexer listens to on-chain events and reconciles the local DB.
type EventIndexer struct {
	eth         *EthClient
	productRepo *repository.ProductRepository
	depositRepo *repository.WasteDepositRepository
	pollInterval time.Duration
	lastBlock   uint64
}

// NewEventIndexer creates the daemon; returns nil if no EthClient is available.
func NewEventIndexer(productRepo *repository.ProductRepository, depositRepo *repository.WasteDepositRepository) *EventIndexer {
	eth := NewEthClient()
	if eth == nil {
		log.Println("[indexer] ETH_RPC_URL not set — event indexer disabled")
		return nil
	}
	return &EventIndexer{
		eth:          eth,
		productRepo:  productRepo,
		depositRepo:  depositRepo,
		pollInterval: 15 * time.Second,
	}
}

// Start launches the indexer loop in a background goroutine.
func (idx *EventIndexer) Start(ctx context.Context) {
	if idx == nil {
		return
	}
	log.Println("[indexer] starting on-chain event indexer")
	go idx.loop(ctx)
}

func (idx *EventIndexer) loop(ctx context.Context) {
	ticker := time.NewTicker(idx.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("[indexer] shutting down")
			return
		case <-ticker.C:
			idx.poll(ctx)
		}
	}
}

func (idx *EventIndexer) poll(ctx context.Context) {
	latest, err := idx.eth.client.BlockNumber(ctx)
	if err != nil {
		log.Printf("[indexer] error fetching block number: %v\n", err)
		return
	}
	if idx.lastBlock == 0 {
		// First run: only look at the last 1000 blocks to avoid scanning the entire chain.
		if latest > 1000 {
			idx.lastBlock = latest - 1000
		}
	}
	if latest <= idx.lastBlock {
		return
	}

	from := new(big.Int).SetUint64(idx.lastBlock + 1)
	to := new(big.Int).SetUint64(latest)

	idx.fetchProductEvents(ctx, from, to)
	idx.fetchDepositEvents(ctx, from, to)

	idx.lastBlock = latest
}

func (idx *EventIndexer) fetchProductEvents(ctx context.Context, from, to *big.Int) {
	parsed, err := abi.JSON(strings.NewReader(eventIndexerProductABI))
	if err != nil {
		return
	}

	addr := common.HexToAddress(ProductRegistryAddr)
	query := ethereum.FilterQuery{
		Addresses: []common.Address{addr},
		FromBlock: from,
		ToBlock:   to,
	}
	logs, err := idx.eth.client.FilterLogs(ctx, query)
	if err != nil {
		log.Printf("[indexer] product filter error: %v\n", err)
		return
	}

	for _, vlog := range logs {
		idx.handleProductLog(parsed, vlog)
	}
}

func (idx *EventIndexer) handleProductLog(parsed abi.ABI, vlog types.Log) {
	ownershipEvent, hasOwnership := parsed.Events["OwnershipTransferred"]
	if hasOwnership && len(vlog.Topics) > 0 && vlog.Topics[0] == ownershipEvent.ID {
		var result struct {
			ProductId string
		}
		if err := parsed.UnpackIntoInterface(&result, "OwnershipTransferred", vlog.Data); err != nil {
			return
		}
		newOwner := common.HexToAddress(vlog.Topics[1].Hex()).Hex()
		product, err := idx.productRepo.Get(result.ProductId)
		if err != nil || product == nil {
			return
		}
		product.WalletAddr = strings.ToLower(newOwner)
		product.TxHash = vlog.TxHash.Hex()
		_ = idx.productRepo.Update(product)
		log.Printf("[indexer] ownership synced: %s -> %s\n", result.ProductId, newOwner)
	}
}

func (idx *EventIndexer) fetchDepositEvents(ctx context.Context, from, to *big.Int) {
	parsed, err := abi.JSON(strings.NewReader(eventIndexerDepositABI))
	if err != nil {
		return
	}

	addr := common.HexToAddress(WasteDepositAddr)
	query := ethereum.FilterQuery{
		Addresses: []common.Address{addr},
		FromBlock: from,
		ToBlock:   to,
	}
	logs, err := idx.eth.client.FilterLogs(ctx, query)
	if err != nil {
		log.Printf("[indexer] deposit filter error: %v\n", err)
		return
	}

	for _, vlog := range logs {
		idx.handleDepositLog(parsed, vlog)
	}
}

func (idx *EventIndexer) handleDepositLog(parsed abi.ABI, vlog types.Log) {
	recycledEvent, hasRecycled := parsed.Events["RecyclingConfirmed"]
	if hasRecycled && len(vlog.Topics) > 0 && vlog.Topics[0] == recycledEvent.ID {
		depositID := vlog.Topics[1].Big().Uint64()
		deposit, err := idx.depositRepo.Get(depositID)
		if err != nil || deposit == nil {
			return
		}
		now := time.Now()
		deposit.Status = models.StatusRecycled
		deposit.StatusName = models.StatusRecycled.String()
		deposit.RecycledAt = &now
		deposit.TxHash = vlog.TxHash.Hex()
		_ = idx.depositRepo.Update(deposit)
		log.Printf("[indexer] recycling confirmed on-chain for deposit %d\n", depositID)
	}
}
