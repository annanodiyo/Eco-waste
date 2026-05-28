package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/annanodiyo/Eco-waste/server/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// fallback to local development defaults
		dsn = "host=localhost user=postgres password=postgres dbname=ecowaste port=5432 sslmode=disable TimeZone=UTC"
	}

	var db *gorm.DB
	var err error

	// Retry database connection for up to 10 seconds (useful during container startup in local environments)
	for i := 0; i < 5; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err == nil {
			break
		}
		log.Printf("Failed to connect to database (attempt %d/5): %v", i+1, err)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatalf("Fatal error connecting to database: %v", err)
	}

	log.Println("Database connection successfully established.")

	// Automatically run migrations
	err = db.AutoMigrate(
		&models.Product{},
		&models.WasteDeposit{},
		&models.User{},
	)
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	log.Println("Database migrations applied successfully.")

	DB = db
	return db
}

func GetDB() *gorm.DB {
	if DB == nil {
		return InitDB()
	}
	return DB
}
