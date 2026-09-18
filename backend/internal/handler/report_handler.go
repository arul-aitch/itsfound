package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/arul-aitch/itsfound/backend/internal/middleware"
	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/arul-aitch/itsfound/backend/internal/repository"
	"github.com/arul-aitch/itsfound/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type ReportHandler struct {
	svc service.ReportService
}

func NewReportHandler(svc service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

func (h *ReportHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req model.CreateReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	report, err := h.svc.Create(r.Context(), userID, req)
	if err != nil {
		if errors.Is(err, service.ErrReportValidation) {
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid report data")
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
		return
	}

	writeJSON(w, http.StatusCreated, report)
}

func (h *ReportHandler) List(w http.ResponseWriter, r *http.Request) {
	listQuery := parseReportsQuery(r)

	reports, err := h.svc.List(r.Context(), listQuery)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, reports)
}

func (h *ReportHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	listQuery := parseReportsQuery(r)

	reports, err := h.svc.ListMine(r.Context(), userID, listQuery)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, reports)
}

func (h *ReportHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	report, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid report id")
		case errors.Is(err, repository.ErrNotFound):
			writeError(w, http.StatusNotFound, "NOT_FOUND", "report not found")
		default:
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
		}
		return
	}

	writeJSON(w, http.StatusOK, report)
}

func (h *ReportHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	role, _ := middleware.RoleFromContext(r.Context())
	id := chi.URLParam(r, "id")

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req model.UpdateReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	report, err := h.svc.Update(r.Context(), userID, role, id, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid report data")
		case errors.Is(err, service.ErrReportForbidden):
			writeError(w, http.StatusForbidden, "FORBIDDEN", "you are not allowed to modify this report")
		case errors.Is(err, repository.ErrNotFound):
			writeError(w, http.StatusNotFound, "NOT_FOUND", "report not found")
		default:
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
		}
		return
	}

	writeJSON(w, http.StatusOK, report)
}

// UpdateStatus — admin only. Body: { "status": "removed" | "open" | ... }
type updateReportStatusRequest struct {
	Status string `json:"status"`
}

func (h *ReportHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	role, ok := middleware.RoleFromContext(r.Context())
	if !ok || role != "admin" {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "admin access required")
		return
	}

	id := chi.URLParam(r, "id")

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req updateReportStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}

	report, err := h.svc.UpdateStatus(r.Context(), role, id, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid status")
		case errors.Is(err, service.ErrReportForbidden):
			writeError(w, http.StatusForbidden, "FORBIDDEN", "forbidden")
		case errors.Is(err, repository.ErrNotFound):
			writeError(w, http.StatusNotFound, "NOT_FOUND", "report not found")
		default:
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
		}
		return
	}

	writeJSON(w, http.StatusOK, report)
}

func (h *ReportHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	role, _ := middleware.RoleFromContext(r.Context())
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, role, id); err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid report id")
		case errors.Is(err, service.ErrReportForbidden):
			writeError(w, http.StatusForbidden, "FORBIDDEN", "you are not allowed to delete this report")
		case errors.Is(err, repository.ErrNotFound):
			writeError(w, http.StatusNotFound, "NOT_FOUND", "report not found")
		default:
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func parseReportsQuery(r *http.Request) model.ListReportsQuery {
	query := r.URL.Query()

	listQuery := model.ListReportsQuery{
		Page:    0,
		PerPage: 0,
		Type:    query.Get("type"),
		Status:  query.Get("status"),
		Search:  query.Get("search"),
	}

	if value := query.Get("page"); value != "" {
		if page, err := strconv.Atoi(value); err == nil {
			listQuery.Page = page
		}
	}

	if value := query.Get("per_page"); value != "" {
		if perPage, err := strconv.Atoi(value); err == nil {
			listQuery.PerPage = perPage
		}
	}

	if value := query.Get("category_id"); value != "" {
		if categoryID, err := strconv.Atoi(value); err == nil {
			listQuery.CategoryID = &categoryID
		}
	}

	if value := query.Get("location_id"); value != "" {
		if locationID, err := strconv.Atoi(value); err == nil {
			listQuery.LocationID = &locationID
		}
	}

	return listQuery
}
