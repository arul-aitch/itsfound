package model

import (
	"time"

	"github.com/google/uuid"
)

type Claim struct {
	ID         uuid.UUID `json:"id"`
	ReportID   uuid.UUID `json:"report_id"`
	ClaimantID uuid.UUID `json:"claimant_id"`
	Evidence   string    `json:"evidence"`
	Status     string    `json:"status"`
	AdminNote  *string   `json:"admin_note"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type ClaimantBrief struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	WANumber *string   `json:"wa_number"`
}

type ClaimReportBrief struct {
	ID     uuid.UUID `json:"id"`
	Title  string    `json:"title"`
	Type   string    `json:"type"`
	Status string    `json:"status"`
}

type ClaimResponse struct {
	ID         uuid.UUID        `json:"id"`
	ReportID   uuid.UUID        `json:"report_id"`
	ClaimantID uuid.UUID        `json:"claimant_id"`
	Evidence   string           `json:"evidence"`
	Status     string           `json:"status"`
	AdminNote  *string          `json:"admin_note"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
	Claimant   ClaimantBrief    `json:"claimant"`
	Report     ClaimReportBrief `json:"report"`
}

type CreateClaimRequest struct {
	ReportID uuid.UUID `json:"report_id"`
	Evidence string    `json:"evidence"`
}

type UpdateClaimStatusRequest struct {
	Status    string  `json:"status"`
	AdminNote *string `json:"admin_note"`
}

type ListClaimsQuery struct {
	ReportID   *uuid.UUID
	ClaimantID *uuid.UUID
	Status     string
}
