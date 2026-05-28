package app

import (
	"github.com/gin-gonic/gin"
	"github.com/annanodiyo/Eco-waste/server/internal/handlers"
	m "github.com/annanodiyo/Eco-waste/server/internal/middleware"
)

type App struct {
	handlers *handlers.Handler
	router *gin.Engine
}

func NewApp() *App {
	return &App{
		handlers: handlers.NewHandler(),
		router: gin.New(),
	}
}

func (a *App) middlewares() {
	a.router.Use(gin.Logger())
	m.Cors(a.router)
}

func (a *App) routes() {
	v1 := a.router.Group("/api/v1")
	v1.POST("/products", a.handlers.PostProduct)
	v1.GET("/products/:id", a.handlers.GetProduct)
	v1.GET("/product/:id/journey", a.handlers.ProductJourney)
	v1.GET("products?manufacturer=:wallet", a.handlers.ProdManufWallet)

	v1.POST("/dropoffs/scans", a.handlers.DropoffScan)
	v1.POST("/dropoffs/manual", a.handlers.Manual)
	v1.GET("/dropoffs?vendor=:wallet", a.handlers.DropoffLogs)
	v1.GET("/dropoffs/tokens/calculate", a.handlers.PreviewTokens)

	v1.GET("/consumer/:wallet/balance", a.handlers.WalletBallance)
	v1.GET("/consumer/:wallet/history", a.handlers.ConsumerHistory)

	v1.POST("/recycler/confirm", a.handlers.ConfirmDelivered)
	v1.GET("/recycler/pending", a.handlers.PendingWastes)

	v1.GET("/stats", a.handlers.Statistics)
	v1.GET("/admin/assign/role", a.handlers.Assign)

	auth := v1.Group("/auth")
	v1.GET("/", a.handlers.RegisterUser)
	auth.POST("/register", a.handlers.RegisterUser)
}


func (a *App) run() {
	a.middlewares()
	a.routes()
	a.router.Run(":8080")
}

func StartService() {
	app := NewApp()
	app.run()
}