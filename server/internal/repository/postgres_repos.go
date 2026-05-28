package repository

import (
	"errors"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"gorm.io/gorm"
)

type ProductRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(p *models.Product) error {
	return r.db.Create(p).Error
}

func (r *ProductRepository) Get(id string) (*models.Product, error) {
	var p models.Product
	err := r.db.Where("product_id = ?", id).First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *ProductRepository) Update(p *models.Product) error {
	return r.db.Save(p).Error
}

func (r *ProductRepository) GetAll() ([]*models.Product, error) {
	var list []*models.Product
	err := r.db.Order("registered_at desc").Find(&list).Error
	return list, err
}

type WasteDepositRepository struct {
	db *gorm.DB
}

func NewWasteDepositRepository(db *gorm.DB) *WasteDepositRepository {
	return &WasteDepositRepository{db: db}
}

func (r *WasteDepositRepository) Create(d *models.WasteDeposit) error {
	return r.db.Create(d).Error
}

func (r *WasteDepositRepository) Get(id uint64) (*models.WasteDeposit, error) {
	var d models.WasteDeposit
	err := r.db.First(&d, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

func (r *WasteDepositRepository) Update(d *models.WasteDeposit) error {
	return r.db.Save(d).Error
}

func (r *WasteDepositRepository) GetAll() ([]*models.WasteDeposit, error) {
	var list []*models.WasteDeposit
	err := r.db.Order("timestamp desc").Find(&list).Error
	return list, err
}

func (r *WasteDepositRepository) GetPending() ([]*models.WasteDeposit, error) {
	var list []*models.WasteDeposit
	err := r.db.Where("status = ?", models.StatusPending).Order("timestamp desc").Find(&list).Error
	return list, err
}

func (r *WasteDepositRepository) GetByDepositor(addr string) ([]*models.WasteDeposit, error) {
	var list []*models.WasteDeposit
	err := r.db.Where("depositor_addr = ?", addr).Order("timestamp desc").Find(&list).Error
	return list, err
}

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(u *models.User) error {
	return r.db.Create(u).Error
}

func (r *UserRepository) GetByWallet(wallet string) (*models.User, error) {
	var u models.User
	err := r.db.Where("wallet = ?", wallet).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) UpdateRole(wallet string, role string) error {
	return r.db.Model(&models.User{}).Where("wallet = ?", wallet).Update("role", role).Error
}
