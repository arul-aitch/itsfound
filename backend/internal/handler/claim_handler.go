package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/arul-aitch/itsfound/backend/internal/middleware"
	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/arul-aitch/itsfound/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ClaimHandler struct {
	svc service.ClaimService
}

func NewClaimHandler(svc service.ClaimService) *ClaimHandler {
	return &ClaimHandler{
		svc: svc,
	}
}

func (h *ClaimHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(
			w,
			http.StatusUnauthorized,
			"UNAUTHORIZED",
			"unauthorized",
		)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req model.CreateClaimRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(
			w,
			http.StatusBadRequest,
			"VALIDATION_ERROR",
			"invalid request body",
		)
		return
	}

	response, err := h.svc.Create(
		r.Context(),
		userID,
		req,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrClaimValidation):
			writeError(
				w,
				http.StatusBadRequest,
				"VALIDATION_ERROR",
				"invalid claim data",
			)
		case errors.Is(err, service.ErrClaimDuplicate):
			writeError(
				w,
				http.StatusConflict,
				"CLAIM_DUPLICATE",
				"claim already exists",
			)
		case errors.Is(err, service.ErrReportNotClaimable):
			writeError(
				w,
				http.StatusBadRequest,
				"NOT_CLAIMABLE",
				err.Error(),
			)
		default:
			writeError(
				w,
				http.StatusInternalServerError,
				"INTERNAL_ERROR",
				"internal server error",
			)
		}

		return
	}

	writeJSON(w, http.StatusCreated, response)
}

func (h *ClaimHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(
			w,
			http.StatusUnauthorized,
			"UNAUTHORIZED",
			"unauthorized",
		)
		return
	}

	query := r.URL.Query()

	listQuery := model.ListClaimsQuery{
		Status: query.Get("status"),
	}

	if value := query.Get("report_id"); value != "" {
		if reportID, err := uuid.Parse(value); err == nil {
			listQuery.ReportID = &reportID
		}
	}

	claims, err := h.svc.ListMine(
		r.Context(),
		userID,
		listQuery,
	)
	if err != nil {
		writeError(
			w,
			http.StatusInternalServerError,
			"INTERNAL_ERROR",
			"internal server error",
		)
		return
	}

	writeJSON(w, http.StatusOK, claims)
}

func (h *ClaimHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	role, ok := middleware.RoleFromContext(r.Context())
	if !ok || role != "admin" {
		writeError(
			w,
			http.StatusForbidden,
			"FORBIDDEN",
			"admin access required",
		)
		return
	}

	query := r.URL.Query()

	listQuery := model.ListClaimsQuery{
		Status: query.Get("status"),
	}

	if value := query.Get("report_id"); value != "" {
		if reportID, err := uuid.Parse(value); err == nil {
			listQuery.ReportID = &reportID
		}
	}

	claims, err := h.svc.ListAll(
		r.Context(),
		listQuery,
	)
	if err != nil {
		writeError(
			w,
			http.StatusInternalServerError,
			"INTERNAL_ERROR",
			"internal server error",
		)
		return
	}

	writeJSON(w, http.StatusOK, claims)
}

func (h *ClaimHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	role, ok := middleware.RoleFromContext(r.Context())
	if !ok || role != "admin" {
		writeError(
			w,
			http.StatusForbidden,
			"FORBIDDEN",
			"admin access required",
		)
		return
	}

	adminID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || adminID == "" {
		writeError(
			w,
			http.StatusUnauthorized,
			"UNAUTHORIZED",
			"unauthorized",
		)
		return
	}

	claimID := chi.URLParam(r, "id")

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req model.UpdateClaimStatusRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(
			w,
			http.StatusBadRequest,
			"VALIDATION_ERROR",
			"invalid request body",
		)
		return
	}

	response, err := h.svc.UpdateStatus(
		r.Context(),
		adminID,
		claimID,
		req,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrClaimNotFound):
			writeError(
				w,
				http.StatusNotFound,
				"NOT_FOUND",
				"claim not found",
			)
		case errors.Is(err, service.ErrInvalidClaimStatus):
			writeError(
				w,
				http.StatusBadRequest,
				"INVALID_CLAIM_STATUS",
				err.Error(),
			)
		default:
			writeError(
				w,
				http.StatusInternalServerError,
				"INTERNAL_ERROR",
				"internal server error",
			)
		}

		return
	}

	writeJSON(w, http.StatusOK, response)
}
