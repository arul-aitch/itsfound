package model

import (
	"time"

	"github.com/google/uuid"
)

type Report struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	CategoryID  int64     `json:"category_id"`
	LocationID  int64     `json:"location_id"`
	Type        string    `json:"type"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	PhotoURL    *string   `json:"photo_url"`
	Status      string    `json:"status"`
	OccurredAt  time.Time `json:"occurred_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateReportRequest struct {
	CategoryID  int64     `json:"category_id"`
	LocationID  int64     `json:"location_id"`
	Type        string    `json:"type"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	PhotoURL    *string   `json:"photo_url"`
	OccurredAt  time.Time `json:"occurred_at"`
}

type UpdateReportRequest struct {
	CategoryID  int64     `json:"category_id"`
	LocationID  int64     `json:"location_id"`
	Type        string    `json:"type"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	PhotoURL    *string   `json:"photo_url"`
	OccurredAt  time.Time `json:"occurred_at"`
}

type ReportResponse struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	CategoryID  int64     `json:"category_id"`
	LocationID  int64     `json:"location_id"`
	Type        string    `json:"type"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	PhotoURL    *string   `json:"photo_url"`
	Status      string    `json:"status"`
	OccurredAt  time.Time `json:"occurred_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (r *Report) ToResponse() ReportResponse {
	return ReportResponse{
		ID:          r.ID,
		UserID:      r.UserID,
		CategoryID:  r.CategoryID,
		LocationID:  r.LocationID,
		Type:        r.Type,
		Title:       r.Title,
		Description: r.Description,
		PhotoURL:    r.PhotoURL,
		Status:      r.Status,
		OccurredAt:  r.OccurredAt,
		CreatedAt:   r.CreatedAt,
		UpdatedAt:   r.UpdatedAt,
	}
}
