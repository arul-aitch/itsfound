package handler

import (
	"encoding/json"
	"errors"
	"net/http"

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
	return &ReportHandler{
		svc: svc,
	}
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
		writeError(
			w,
			http.StatusBadRequest,
			"VALIDATION_ERROR",
			"invalid request body",
		)
		return
	}

	report, err := h.svc.Create(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(
				w,
				http.StatusBadRequest,
				"VALIDATION_ERROR",
				"invalid report data",
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

	writeJSON(w, http.StatusCreated, report)
}

func (h *ReportHandler) List(w http.ResponseWriter, r *http.Request) {
	reports, err := h.svc.FindAll(r.Context())
	if err != nil {
		writeError(
			w,
			http.StatusInternalServerError,
			"INTERNAL_ERROR",
			"internal server error",
		)
		return
	}

	writeJSON(w, http.StatusOK, reports)
}

func (h *ReportHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	report, err := h.svc.FindByID(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(
				w,
				http.StatusBadRequest,
				"VALIDATION_ERROR",
				"invalid report id",
			)
		case errors.Is(err, repository.ErrNotFound):
			writeError(
				w,
				http.StatusNotFound,
				"NOT_FOUND",
				"report not found",
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

	writeJSON(w, http.StatusOK, report)
}

func (h *ReportHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	id := chi.URLParam(r, "id")

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req model.UpdateReportRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(
			w,
			http.StatusBadRequest,
			"VALIDATION_ERROR",
			"invalid request body",
		)
		return
	}

	report, err := h.svc.Update(r.Context(), userID, id, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(
				w,
				http.StatusBadRequest,
				"VALIDATION_ERROR",
				"invalid report data",
			)
		case errors.Is(err, service.ErrReportForbidden):
			writeError(
				w,
				http.StatusForbidden,
				"FORBIDDEN",
				"you are not allowed to modify this report",
			)
		case errors.Is(err, repository.ErrNotFound):
			writeError(
				w,
				http.StatusNotFound,
				"NOT_FOUND",
				"report not found",
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

	writeJSON(w, http.StatusOK, report)
}

func (h *ReportHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	id := chi.URLParam(r, "id")

	err := h.svc.Delete(r.Context(), userID, id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReportValidation):
			writeError(
				w,
				http.StatusBadRequest,
				"VALIDATION_ERROR",
				"invalid report id",
			)
		case errors.Is(err, service.ErrReportForbidden):
			writeError(
				w,
				http.StatusForbidden,
				"FORBIDDEN",
				"you are not allowed to delete this report",
			)
		case errors.Is(err, repository.ErrNotFound):
			writeError(
				w,
				http.StatusNotFound,
				"NOT_FOUND",
				"report not found",
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

	w.WriteHeader(http.StatusNoContent)
}
