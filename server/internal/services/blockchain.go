package services

import ("os"
"github.com/ethereum/go-ethereum/ethclient"
"fmt"
"log"
// "github.com/annanodiyo/Eco-waste/server/internal/services"
	// "log"
	// "fmt"
	"context"
    "github.com/joho/godotenv")

func NewClient() (*ethclient.Client, error){

	args := os.Getenv("RPC_URL")
	fmt.Println("user")
	fmt.Println(args)
	client, err := ethclient.Dial(args)
return client, err
}

func Retrieve(){
	if err := godotenv.Load(); err != nil {
    log.Fatal("Error loading .env file")
}	
client, err := NewClient()
	if err != nil {
		log.Fatalf("Error occured: %v", err)
	}
header, err := client.HeaderByNumber(context.Background(), nil)
if err != nil {
    log.Fatalf("Could not get block: %v", err)
}
fmt.Println("Latest block:", header.Number)
	// NewClient()
}