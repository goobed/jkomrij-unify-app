package main

import (
		"encoding/json"
		"fmt"
		"log"
		"net/http"
		"strings"
		"time"

		"github.com/rollout/rox-go/v5/core/context"
)

type App struct {
    config Config
    flags  *Flags
}

func NewApp(config Config, flags *Flags) *App {
    return &App{
        config: config,
        flags:  flags,
    }
}

func (app *App) routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", app.handleHealth)
	mux.HandleFunc("/api/flags", app.handleFlags)
	mux.HandleFunc("/api/events", app.handleEvents)
	mux.HandleFunc("/api/promotions", app.handlePromotions)
	mux.HandleFunc("/api/tickets/purchase", app.handlePurchase)
	mux.HandleFunc("/api/reviews", app.handleReviews)
	return mux
}

// maintenanceMiddleware checks for maintenance mode and blocks requests if active
func (app *App) maintenanceMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Allow health check and flags endpoint even during maintenance
        if r.URL.Path == "/api/health" || r.URL.Path == "/api/flags" {
            next.ServeHTTP(w, r)
            return
        }

        // Check maintenance mode flag
        if app.flags.MaintenanceMode.IsEnabled(nil) {
            writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{
                "status":  "maintenance",
                "message": "System is currently under maintenance. Please check back soon.",
                "retry_after": 300, // Suggest retry after 5 minutes
            })
            return
        }

        next.ServeHTTP(w, r)
    })
}

func (app *App) handleHealth(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        writeError(w, http.StatusMethodNotAllowed, "method not allowed")
        return
    }

    health := map[string]interface{}{
        "status": "ok",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
        "maintenance_mode": app.flags.MaintenanceMode.IsEnabled(nil),  // Add this line
    }

    writeJSON(w, http.StatusOK, health)
}

func (app *App) handleEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	// Get user context for flag evaluation
	email := r.URL.Query().Get("email")
	roxContext := context.NewContext(map[string]interface{}{
		"email": email,  // Must match custom property in CloudBees
	})

	events := []Event{
		{
			ID:          "sunrise-carousel",
			Name:        "Sunrise Carousel",
			Date:        "Daily",
			Description: "Start your morning with a golden ride and live brass band.",
		},
		{
			ID:          "riverboat-spectacle",
			Name:        "Riverboat Spectacle",
			Date:        "Weekends",
			Description: "A floating stage show with acrobats and water cannons.",
		},
		{
			ID:          "skyline-fireworks",
			Name:        "Skyline Fireworks",
			Date:        "Nightly",
			Description: "Fireworks with synchronized drones and lasers.",
		},
	}

	// Add conditional event based on flag with user context
	if app.flags.ShowNewEvent.IsEnabled(roxContext) {
		events = append(events, Event{
			ID:          "after-dark-parade",
			Name:        "After Dark Parade",
			Date:        "Friday nights",
			Description: "Neon floats and midnight DJs under the stars.",
		})
	}

	writeJSON(w, http.StatusOK, events)
}

func (app *App) handlePromotions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	segment := strings.ToLower(r.URL.Query().Get("segment"))
	promotions := []Promotion{
		{
			ID:          "sunset-photo-pass",
			Title:       "Sunset Photo Pass",
			Description: "Capture every ride and parade moment for $15 today.",
			Segment:     "all",
		},
		{
			ID:          "family-dinner-bundle",
			Title:       "Family Dinner Bundle",
			Description: "Book a sky deck table and save 10% on kids meals.",
			Segment:     "all",
		},
	}

	if segment == "vip" {
		promotions = append(promotions, Promotion{
			ID:          "vip-chill-lounge",
			Title:       "VIP Chill Lounge",
			Description: "Unlock the private skyline lounge with a $25 add-on.",
			Segment:     "vip",
		})
	}

	writeJSON(w, http.StatusOK, promotions)
}

func (app *App) handlePurchase(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

    if !app.flags.EnablePayments.IsEnabled(nil) {
        writeError(w, http.StatusServiceUnavailable,
            "Payment processing is temporarily unavailable. Please try again later.")
        return
    }

	var req PurchaseRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	email := req.Email
	roxContext := context.NewContext(map[string]interface{}{
		"id":    email,
		"email": email,
})

	maxQuantity := app.flags.MaxTicketQuantity.GetValue(roxContext)
	if req.Quantity > maxQuantity {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("Maximum %d tickets allowed per order", maxQuantity))
		return
}

	// Validate quantity
	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	// Default values
	if req.TicketType == "" {
		req.TicketType = "day"
	}
	if req.Email == "" {
		req.Email = "guest@themepark.local"
	}

	// Base pricing
	priceTable := map[string]float64{
		"day":         59.0,
		"park-hopper": 89.0,
		"vip":         149.0,
	}
	unitPrice, ok := priceTable[strings.ToLower(req.TicketType)]
	if !ok {
		writeError(w, http.StatusBadRequest, "unknown ticket type")
		return
	}

	paymentProvider := app.flags.PaymentProvider.GetValue(roxContext)
	log.Printf("Processing payment via %s for user %s", paymentProvider, email)

	// Build response
	response := PurchaseResponse{
		OrderID:    "TP-" + time.Now().Format("20060102150405"),
		TicketType: strings.ToLower(req.TicketType),
		Quantity:   req.Quantity,
		Total:      unitPrice * float64(req.Quantity),
		Provider:   paymentProvider,
	}

	writeJSON(w, http.StatusOK, response)
}

func (app *App) handleFlags(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        writeError(w, http.StatusMethodNotAllowed, "method not allowed")
        return
    }

    // Retrieve user email and plan for targeting
    email := r.URL.Query().Get("email")
    plan := r.URL.Query().Get("plan")  // Add this line

    // Create context with user properties
    roxContext := context.NewContext(map[string]interface{}{
        "email": email,  // Must match custom property in CloudBees
        "plan":  plan,   // Add this line - used for targeting rules
    })

    // Evaluate flags with context
    currentFlags := map[string]bool{
        "showNewEvent":        app.flags.ShowNewEvent.IsEnabled(roxContext),
        "enableVipPass":       app.flags.EnableVipPass.IsEnabled(roxContext),
        "enableTicketUpsells": app.flags.TicketUpsells.IsEnabled(roxContext),
        "enablePromos":        app.flags.EnablePromos.IsEnabled(roxContext),
		"maintenanceMode":     app.flags.MaintenanceMode.IsEnabled(roxContext),
		"enableReviews":       app.flags.EnableReviews.IsEnabled(roxContext),
    }

    writeJSON(w, http.StatusOK, currentFlags)
}

// handleReviews returns visitor reviews if the feature is enabled
func (app *App) handleReviews(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        writeError(w, http.StatusMethodNotAllowed, "method not allowed")
        return
    }

    // Get user context for targeted rollout
    email := r.URL.Query().Get("email")
    roxContext := context.NewContext(map[string]interface{}{
        "id":    email,
        "email": email,
    })

    // Check if reviews are enabled for this user
    if !app.flags.EnableReviews.IsEnabled(roxContext) {
        writeError(w, http.StatusNotFound, "Reviews feature not available")
        return
    }

    reviews := []Review{
        {
            ID:     "1",
            User:   "Sarah M.",
            Rating: 5,
            Text:   "Amazing experience! The After Dark Parade was spectacular.",
            Date:   "2026-03-10",
        },
        {
            ID:     "2",
            User:   "Mike T.",
            Rating: 4,
            Text:   "Great park, friendly staff, would definitely return!",
            Date:   "2026-03-09",
        },
        {
            ID:     "3",
            User:   "Jessica L.",
            Rating: 5,
            Text:   "The VIP pass is worth every penny. Skip the lines and enjoy!",
            Date:   "2026-03-08",
        },
    }

    writeJSON(w, http.StatusOK, reviews)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
