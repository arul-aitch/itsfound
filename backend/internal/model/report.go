package model

import (
	"time"

	"github.com/google/uuid"
)

type Report struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	CategoryID  int       `json:"category_id"`
	LocationID  int       `json:"location_id"`
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
	CategoryID  int       `json:"category_id" validate:"required"`
	LocationID  int       `json:"location_id" validate:"required"`
	Type        string    `json:"type" validate:"required"`
	Title       string    `json:"title" validate:"required"`
	Description string    `json:"description" validate:"required"`
	PhotoURL    *string   `json:"photo_url"`
	OccurredAt  time.Time `json:"occurred_at" validate:"required"`
}

type UpdateReportRequest struct {
	CategoryID  int       `json:"category_id" validate:"required"`
	LocationID  int       `json:"location_id" validate:"required"`
	Type        string    `json:"type" validate:"required"`
	Title       string    `json:"title" validate:"required"`
	Description string    `json:"description" validate:"required"`
	PhotoURL    *string   `json:"photo_url"`
	OccurredAt  time.Time `json:"occurred_at" validate:"required"`
}

type ReportUserBrief struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	WANumber *string   `json:"wa_number"`
}

type ReportResponse struct {
	ID           uuid.UUID       `json:"id"`
	UserID       uuid.UUID       `json:"user_id"`
	CategoryID   int             `json:"category_id"`
	LocationID   int             `json:"location_id"`
	Type         string          `json:"type"`
	Title        string          `json:"title"`
	Description  string          `json:"description"`
	PhotoURL     *string         `json:"photo_url"`
	Status       string          `json:"status"`
	OccurredAt   time.Time       `json:"occurred_at"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	CategoryName string          `json:"category_name"`
	LocationName string          `json:"location_name"`
	User         ReportUserBrief `json:"user"`
}

type ListReportsQuery struct {
	Page       int
	PerPage    int
	Type       string
	CategoryID *int
	LocationID *int
	Status     string
	Search     string
}

type PaginationMeta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type PaginatedReports struct {
	Data []ReportResponse `json:"data"`
	Meta PaginationMeta   `json:"meta"`
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
