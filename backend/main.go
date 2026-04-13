package main

import (
		"log"
		"net/http"
		"os"
		"time"

		"github.com/joho/godotenv"
		"github.com/rollout/rox-go/v5/server"
)

type Flags struct {
    ShowNewEvent   server.RoxFlag
    EnableVipPass  server.RoxFlag
    TicketUpsells  server.RoxFlag
    EnablePromos   server.RoxFlag
    EnablePayments server.RoxFlag
    MaintenanceMode server.RoxFlag
    MaxTicketQuantity server.RoxInt
    PaymentProvider server.RoxString
    EnableReviews server.RoxFlag
}

var flags = &Flags{
    ShowNewEvent:   server.NewRoxFlag(false),
    EnableVipPass:  server.NewRoxFlag(false),
    TicketUpsells:  server.NewRoxFlag(true),
    EnablePromos:   server.NewRoxFlag(true),
    EnablePayments: server.NewRoxFlag(true),
    MaintenanceMode: server.NewRoxFlag(false),
    MaxTicketQuantity: server.NewRoxInt(10, []int{4, 10, 20}),
    PaymentProvider:   server.NewRoxString("stripe", []string{"stripe", "paypal", "square"}),
    EnableReviews:  server.NewRoxFlag(false),
}

func main() {
    // Load .env file for local development
    _ = godotenv.Load()

    config := LoadConfig()

    // Initialize CloudBees SDK
    rox := server.NewRox()

    rox.RegisterWithEmptyNamespace(flags)

    log.Println("Initializing Feature Flags...")
    select {
    case <-rox.Setup(os.Getenv("FM_KEY"), nil):
        log.Println("Feature Flags initialized successfully")
    case <-time.After(5 * time.Second):
        log.Println("Warning: Feature Flags timed out, using defaults")
    }

    app := NewApp(config, flags)

    // Create HTTP server with middleware
    handler := app.maintenanceMiddleware(
        withCORS(config.AllowedOrigin, app.routes()),
    )

    server := &http.Server{
        Addr:    ":" + config.Port,
        Handler: handler,  // Use the wrapped handler
        ReadHeaderTimeout: 5 * time.Second,
    }

    log.Printf("Theme Park API listening on %s", server.Addr)
    log.Printf("API endpoints: /api/health, /api/flags, /api/events, /api/promotions, /api/tickets/purchase")
    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}

func withCORS(allowedOrigin string, handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		handler.ServeHTTP(w, r)
	})
}