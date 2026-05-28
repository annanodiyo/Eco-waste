package models

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

// ─────────────────────────────────────────────────────────────

type WasteType int

const (
	WastePlastic WasteType = iota
	WasteGlass
	WasteMetal
	WastePaper
	WasteOrganic
	WasteElectronic
	WasteOther
)

func (w WasteType) String() string {
	names := []string{"plastic", "glass", "metal", "paper", "organic", "electronic", "other"}
	if int(w) < len(names) {
		return names[w]
	}
	return "unknown"
}

type DepositStatus int

const (
	StatusPending DepositStatus = iota
	StatusRecycled
	StatusRejected
)

func (s DepositStatus) String() string {
	switch s {
	case StatusPending:
		return "pending"
	case StatusRecycled:
		return "recycled"
	case StatusRejected:
		return "rejected"
	}
	return "unknown"
}

// ── Domain models ─────────────────────────────────────────────────────────────

type Product struct {
	ProductID    string    `json:"productId"`
	Name         string    `json:"name"`
	Material     WasteType `json:"material"`
	MaterialName string    `json:"materialName"`
	WeightGrams  int       `json:"weightGrams"`
	Manufacturer string    `json:"manufacturer"`
	WalletAddr   string    `json:"walletAddr"`
	RegisteredAt time.Time `json:"registeredAt"`
	TxHash       string    `json:"txHash"`
	QRCode       string    `json:"qrCode"`
}

type WasteDeposit struct {
	ID            uint64        `json:"id"`
	ProductID     string        `json:"productId"`
	HasQR         bool          `json:"hasQr"`
	DepositorAddr string        `json:"depositorAddr"`
	CollectorAddr string        `json:"collectorAddr"`
	WasteType     WasteType     `json:"wasteType"`
	WasteTypeName string        `json:"wasteTypeName"`
	WeightGrams   int           `json:"weightGrams"`
	TokensEarned  int           `json:"tokensEarned"`
	Status        DepositStatus `json:"status"`
	StatusName    string        `json:"statusName"`
	TxHash        string        `json:"txHash"`
	Timestamp     time.Time     `json:"timestamp"`
	RecycledAt    *time.Time    `json:"recycledAt,omitempty"`
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

type RegisterProductRequest struct {
    Name         string    `json:"name"         binding:"required"`
    Manufacturer string    `json:"manufacturer" binding:"required"`
    Material     WasteType `json:"material"`
    WeightGrams  int       `json:"weightGrams"  binding:"required"`
    WalletAddr   string    `json:"walletAddr"`   // ← NO binding tag
}

type WasteDepositRequest struct {
	ProductID     string    `json:"productId"`
	HasQR         bool      `json:"hasQr"`
	DepositorAddr string    `json:"depositorAddr"`
	CollectorAddr string    `json:"collectorAddr"`
	WasteType     WasteType `json:"wasteType"`
	WeightGrams   int       `json:"weightGrams"  binding:"required"`
}

type ConfirmRecyclingRequest struct {
	DepositID     uint64 `json:"depositId"     binding:"required"`
	CollectorAddr string `json:"collectorAddr"`
}

// ── Token calculation ─────────────────────────────────────────────────────────

// CalculateTokens awards tokens based on waste type and weight.
func CalculateTokens(wasteType WasteType, weightGrams int) int {
	rates := map[WasteType]float64{
		WastePlastic:    0.10,
		WasteGlass:      0.05,
		WasteMetal:      0.15,
		WastePaper:      0.08,
		WasteOrganic:    0.03,
		WasteElectronic: 0.20,
		WasteOther:      0.02,
	}
	rate, ok := rates[wasteType]
	if !ok {
		rate = 0.02
	}
	return int(float64(weightGrams) * rate)
}

// ── In-memory store ───────────────────────────────────────────────────────────

type Store struct {
	mu         sync.RWMutex
	deposits   map[uint64]*WasteDeposit
	products   map[string]*Product
	nextID     uint64
	dbPath     string
}

func NewStore(dbPath string) *Store {
	s := &Store{
		deposits: make(map[uint64]*WasteDeposit),
		products: make(map[string]*Product),
		nextID:   1,
		dbPath:   dbPath,
	}
	s.LoadFromFile()
	return s
}

type storeData struct {
	Deposits []*WasteDeposit `json:"deposits"`
	Products []*Product      `json:"products"`
	NextID   uint64          `json:"nextId"`
}

func (s *Store) SaveToFile() {
	if s.dbPath == "" {
		return
	}
	data := storeData{
		NextID: s.nextID,
	}
	for _, d := range s.deposits {
		data.Deposits = append(data.Deposits, d)
	}
	for _, p := range s.products {
		data.Products = append(data.Products, p)
	}

	b, _ := json.MarshalIndent(data, "", "  ")
	_ = os.WriteFile(s.dbPath, b, 0644)
}

func (s *Store) LoadFromFile() {
	if s.dbPath == "" {
		return
	}
	b, err := os.ReadFile(s.dbPath)
	if err != nil {
		return
	}
	var data storeData
	if err := json.Unmarshal(b, &data); err != nil {
		return
	}
	s.nextID = data.NextID
	if s.nextID == 0 {
		s.nextID = 1
	}
	for _, d := range data.Deposits {
		s.deposits[d.ID] = d
	}
	for _, p := range data.Products {
		s.products[p.ProductID] = p
	}
}

// Deposits

func (s *Store) AddDeposit(d *WasteDeposit) uint64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	id := s.nextID
	s.nextID++
	d.ID = id
	s.deposits[id] = d
	s.SaveToFile()
	return id
}

func (s *Store) GetDeposit(id uint64) (*WasteDeposit, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.deposits[id]
	return d, ok
}

func (s *Store) UpdateDeposit(d *WasteDeposit) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.deposits[d.ID] = d
	s.SaveToFile()
}

func (s *Store) GetAllDeposits() []*WasteDeposit {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*WasteDeposit, 0, len(s.deposits))
	for _, d := range s.deposits {
		out = append(out, d)
	}
	return out
}

func (s *Store) GetPendingDeposits() []*WasteDeposit {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []*WasteDeposit
	for _, d := range s.deposits {
		if d.Status == StatusPending {
			out = append(out, d)
		}
	}
	return out
}

func (s *Store) GetDepositsByDepositor(addr string) []*WasteDeposit {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []*WasteDeposit
	for _, d := range s.deposits {
		if d.DepositorAddr == addr {
			out = append(out, d)
		}
	}
	return out
}

// Products

func (s *Store) AddProduct(p *Product) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.products[p.ProductID] = p
	s.SaveToFile()
}

func (s *Store) GetProduct(id string) (*Product, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.products[id]
	return p, ok
}

func (s *Store) GetAllProducts() []*Product {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*Product, 0, len(s.products))
	for _, p := range s.products {
		out = append(out, p)
	}
	return out
}