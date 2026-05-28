package app

import (
	"github.com/gin-gonic/gin"
	"github.com/annanodiyo/Eco-waste/server/internal/handlers"
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
}

func (a *App) routes() {
	v1 := a.router.Group("/api/v1")
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