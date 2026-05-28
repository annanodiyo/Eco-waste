package app

import (
	"github.com/annanodiyo/Eco-waste/server/internal/database"
	"github.com/annanodiyo/Eco-waste/server/internal/handlers"
	"github.com/annanodiyo/Eco-waste/server/internal/middleware"
	"github.com/annanodiyo/Eco-waste/server/internal/repository"
	"github.com/annanodiyo/Eco-waste/server/internal/services"
	"github.com/gin-gonic/gin"
)

type App struct {
	handler        *handlers.Handler
	wasteHandler   *handlers.WasteHandler
	productHandler *handlers.ProductHandler
	router         *gin.Engine
}

func NewApp() *App {
	// Initialize database
	db := database.InitDB()

	// Instantiate repositories
	prodRepo := repository.NewProductRepository(db)
	depRepo := repository.NewWasteDepositRepository(db)
	userRepo := repository.NewUserRepository(db)

	bc := &services.BlockchainService{}

	return &App{
		handler:        handlers.NewHandler(userRepo, depRepo),
		wasteHandler:   handlers.NewWasteHandler(depRepo, prodRepo, bc),
		productHandler: handlers.NewProductHandler(prodRepo, bc),
		router:         gin.New(),
	}
}

func (a *App) middlewares() {
	a.router.Use(gin.Logger())
	a.router.Use(gin.Recovery())
	middleware.Cors(a.router) // fixed: was `m.Cors(a.router)` with undefined `m`
}

func (a *App) routes() {
	v1 := a.router.Group("/api/v1")

	// Authentication & Roles
	v1.GET("/auth/nonce", a.handler.GetNonce)
	v1.POST("/auth/login", a.handler.Login)
	v1.POST("/auth/register", a.handler.RegisterUser)

	// Wallet Balance & History
	v1.GET("/wallet/balance/:address", a.handler.WalletBallance)
	v1.GET("/wallet/history/:address", a.handler.ConsumerHistory)

	// Products
	v1.POST("/products/register", a.productHandler.RegisterProduct)
	v1.GET("/products", a.productHandler.ListProducts)
	v1.GET("/products/:id", a.productHandler.GetProduct)
	v1.POST("/products/decode-qr", a.productHandler.DecodeQR)

	// Waste
	v1.POST("/waste/deposit", a.wasteHandler.CreateDeposit)
	v1.POST("/waste/confirm-recycling", a.wasteHandler.ConfirmRecycling)
	v1.GET("/waste/depositor/:address", a.wasteHandler.GetDepositorHistory)
	v1.GET("/waste/pending", a.wasteHandler.GetPendingDeposits)
	v1.GET("/waste/all", a.wasteHandler.GetAllDeposits)
	v1.GET("/waste/:id", a.wasteHandler.GetDeposit)
}

func (a *App) run() {
	a.middlewares()
	a.routes()
	_ = a.router.Run(":8080")
}

func StartService() {
	NewApp().run()
}