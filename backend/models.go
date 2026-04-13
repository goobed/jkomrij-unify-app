package main

type Event struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Date        string `json:"date"`
	Description string `json:"description"`
}

type PurchaseRequest struct {
	TicketType string `json:"ticketType"`
	Quantity   int    `json:"quantity"`
	Email      string `json:"email"`
}

type Promotion struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Segment     string `json:"segment"`
}

type PurchaseResponse struct {
	OrderID    string  `json:"orderId"`
	TicketType string  `json:"ticketType"`
	Quantity   int     `json:"quantity"`
	Total      float64 `json:"total"`
	Provider   string  `json:"provider"`
}

type Review struct {
    ID     string `json:"id"`
    User   string `json:"user"`
    Rating int    `json:"rating"`
    Text   string `json:"text"`
    Date   string `json:"date"`
}