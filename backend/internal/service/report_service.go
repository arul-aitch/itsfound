package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/arul-aitch/itsfound/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrReportValidation = errors.New("report validation error")
	ErrReportForbidden  = errors.New("forbidden")
)

type ReportService interface {
	Create(ctx context.Context, userID string, req model.CreateReportRequest) (*model.ReportResponse, error)
	FindAll(ctx context.Context) ([]model.ReportResponse, error)
	FindByID(ctx context.Context, id string) (*model.ReportResponse, error)
	Update(ctx context.Context, userID string, id string, req model.UpdateReportRequest) (*model.ReportResponse, error)
	Delete(ctx context.Context, userID string, id string) error
}

type reportService struct {
	repo repository.ReportRepository
}

func NewReportService(repo repository.ReportRepository) ReportService {
	return &reportService{
		repo: repo,
	}
}

func (s *reportService) Create(
	ctx context.Context,
	userID string,
	req model.CreateReportRequest,
) (*model.ReportResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	if err := validateReport(
		req.Type,
		req.Title,
		req.Description,
		req.CategoryID,
		req.LocationID,
		req.OccurredAt,
	); err != nil {
		return nil, err
	}

	report := &model.Report{
		UserID:      uid,
		CategoryID:  req.CategoryID,
		LocationID:  req.LocationID,
		Type:        strings.ToLower(strings.TrimSpace(req.Type)),
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		PhotoURL:    req.PhotoURL,
		OccurredAt:  req.OccurredAt,
	}

	if err := s.repo.Create(ctx, report); err != nil {
		return nil, fmt.Errorf("create report: %w", err)
	}

	response := report.ToResponse()

	return &response, nil
}

func (s *reportService) FindAll(
	ctx context.Context,
) ([]model.ReportResponse, error) {
	reports, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("find all reports: %w", err)
	}

	responses := make([]model.ReportResponse, 0, len(reports))

	for _, report := range reports {
		responses = append(responses, report.ToResponse())
	}

	return responses, nil
}

func (s *reportService) FindByID(
	ctx context.Context,
	id string,
) (*model.ReportResponse, error) {
	reportID, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrReportValidation
	}

	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf("find report by id: %w", err)
	}

	response := report.ToResponse()

	return &response, nil
}

func (s *reportService) Update(
	ctx context.Context,
	userID string,
	id string,
	req model.UpdateReportRequest,
) (*model.ReportResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	reportID, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrReportValidation
	}

	if err := validateReport(
		req.Type,
		req.Title,
		req.Description,
		req.CategoryID,
		req.LocationID,
		req.OccurredAt,
	); err != nil {
		return nil, err
	}

	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf("find report before update: %w", err)
	}

	if report.UserID != uid {
		return nil, ErrReportForbidden
	}

	report.CategoryID = req.CategoryID
	report.LocationID = req.LocationID
	report.Type = strings.ToLower(strings.TrimSpace(req.Type))
	report.Title = strings.TrimSpace(req.Title)
	report.Description = strings.TrimSpace(req.Description)
	report.PhotoURL = req.PhotoURL
	report.OccurredAt = req.OccurredAt

	if err := s.repo.Update(ctx, report); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf("update report: %w", err)
	}

	response := report.ToResponse()

	return &response, nil
}

func (s *reportService) Delete(
	ctx context.Context,
	userID string,
	id string,
) error {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("parse user id: %w", err)
	}

	reportID, err := uuid.Parse(id)
	if err != nil {
		return ErrReportValidation
	}

	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return repository.ErrNotFound
		}

		return fmt.Errorf("find report before delete: %w", err)
	}

	if report.UserID != uid {
		return ErrReportForbidden
	}

	if err := s.repo.Delete(ctx, reportID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return repository.ErrNotFound
		}

		return fmt.Errorf("delete report: %w", err)
	}

	return nil
}

func validateReport(
	reportType string,
	title string,
	description string,
	categoryID int64,
	locationID int64,
	occurredAt time.Time,
) error {
	reportType = strings.ToLower(strings.TrimSpace(reportType))

	if reportType != "lost" && reportType != "found" {
		return ErrReportValidation
	}
	if strings.TrimSpace(title) == "" {
		return ErrReportValidation
	}
	if strings.TrimSpace(description) == "" {
		return ErrReportValidation
	}
	if categoryID <= 0 {
		return ErrReportValidation
	}
	if locationID <= 0 {
		return ErrReportValidation
	}
	if occurredAt.IsZero() {
		return ErrReportValidation
	}

	return nil
}
