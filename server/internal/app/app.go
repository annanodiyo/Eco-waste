package app

import (
	"context"

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
	statsHandler   *handlers.StatsHandler
	indexer        *services.EventIndexer
	router         *gin.Engine
}

func NewApp() *App {
	// Initialize database
	db := database.InitDB()

	// Instantiate repositories
	prodRepo := repository.NewProductRepository(db)
	depRepo := repository.NewWasteDepositRepository(db)
	userRepo := repository.NewUserRepository(db)

	bc := services.NewOnChainBlockchainService()

	return &App{
		handler:        handlers.NewHandler(userRepo, depRepo),
		wasteHandler:   handlers.NewWasteHandler(depRepo, prodRepo, bc),
		productHandler: handlers.NewProductHandler(prodRepo, bc),
		statsHandler:   handlers.NewStatsHandler(depRepo, userRepo),
		indexer:        services.NewEventIndexer(prodRepo, depRepo),
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
	v1.POST("/vendors/register", a.handler.RegisterVendor)

	// Wallet Balance & History
	v1.GET("/wallet/balance/:address", a.handler.WalletBallance)
	v1.GET("/wallet/history/:address", a.handler.ConsumerHistory)

	// Public Stats
	v1.GET("/stats", a.statsHandler.GetStats)

	// Authenticated routes group
	auth := v1.Group("")
	auth.Use(middleware.AuthRequired())
	{
		// Products
		auth.POST("/products/register", middleware.RequireRole("MANUFACTURER", "ADMIN"), a.productHandler.RegisterProduct)
		auth.POST("/products/transfer", middleware.RequireRole("MANUFACTURER", "SELLER", "VENDOR", "ADMIN"), a.productHandler.TransferOwnership)
		auth.POST("/products/scan", a.productHandler.ScanProduct)
		auth.GET("/products", a.productHandler.ListProducts)
		auth.GET("/products/:id", a.productHandler.GetProduct)
		auth.POST("/products/decode-qr", a.productHandler.DecodeQR)

		// Waste
		auth.POST("/waste/deposit", middleware.RequireRole("COLLECTOR", "VENDOR", "SELLER", "ADMIN"), a.wasteHandler.CreateDeposit)
		auth.POST("/waste/confirm-recycling", middleware.RequireRole("RECYCLER", "ADMIN"), a.wasteHandler.ConfirmRecycling)
		auth.GET("/waste/depositor/:address", a.wasteHandler.GetDepositorHistory)
		auth.GET("/waste/pending", a.wasteHandler.GetPendingDeposits)
		auth.GET("/waste/all", a.wasteHandler.GetAllDeposits)
		auth.GET("/waste/:id", a.wasteHandler.GetDeposit)

		// Recycler Dashboard
		auth.GET("/recycler/pending", middleware.RequireRole("RECYCLER", "ADMIN"), a.wasteHandler.GetPendingDeposits)
		auth.POST("/recycler/process", middleware.RequireRole("RECYCLER", "ADMIN"), a.wasteHandler.ProcessRecyclingBatch)
	}
}

func (a *App) run() {
	a.middlewares()
	a.routes()
	// Start background event indexer (no-op if ETH_RPC_URL is unset)
	a.indexer.Start(context.Background())
	_ = a.router.Run(":8080")
}

func StartService() {
	NewApp().run()
}
