package app

import (
	"github.com/annanodiyo/Eco-waste/server/internal/handlers"
	"github.com/annanodiyo/Eco-waste/server/internal/middleware"
	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"github.com/annanodiyo/Eco-waste/server/internal/services"
	"github.com/gin-gonic/gin"
)

type App struct {
	store          *models.Store
	wasteHandler   *handlers.WasteHandler
	productHandler *handlers.ProductHandler
	router         *gin.Engine
}

func NewApp() *App {
	store := models.NewStore()
	bc := &services.BlockchainService{}

	return &App{
		store:          store,
		wasteHandler:   handlers.NewWasteHandler(store, bc),
		productHandler: handlers.NewProductHandler(store, bc),
		router:         gin.New(),
	}
}

func (a *App) middlewares() {
	a.router.Use(gin.Logger())
	a.router.Use(gin.Recovery())
	middleware.Cors(a.router)
}

func (a *App) routes() {
	v1 := a.router.Group("/api/v1")

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