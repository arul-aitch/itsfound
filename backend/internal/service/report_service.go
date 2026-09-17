package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/arul-aitch/itsfound/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrReportValidation = errors.New("report validation error")
	ErrReportForbidden  = errors.New("forbidden")
)

type ReportService interface {
	Create(
		ctx context.Context,
		userID string,
		req model.CreateReportRequest,
	) (*model.ReportResponse, error)

	GetByID(
		ctx context.Context,
		id string,
	) (*model.ReportResponse, error)

	List(
		ctx context.Context,
		q model.ListReportsQuery,
	) (*model.PaginatedReports, error)

	Update(
		ctx context.Context,
		userID string,
		role string,
		id string,
		req model.UpdateReportRequest,
	) (*model.ReportResponse, error)

	Delete(
		ctx context.Context,
		userID string,
		role string,
		id string,
	) error
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

	report, user, categoryName, locationName, err := s.repo.FindByIDWithDetail(
		ctx,
		report.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("find created report detail: %w", err)
	}

	response := buildReportResponse(
		report,
		user,
		categoryName,
		locationName,
	)

	return &response, nil
}

func (s *reportService) GetByID(
	ctx context.Context,
	id string,
) (*model.ReportResponse, error) {
	reportID, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrReportValidation
	}

	report, user, categoryName, locationName, err := s.repo.FindByIDWithDetail(
		ctx,
		reportID,
	)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf("find report detail: %w", err)
	}

	if report.Status == "removed" {
		return nil, repository.ErrNotFound
	}

	response := buildReportResponse(
		report,
		user,
		categoryName,
		locationName,
	)

	return &response, nil
}

func (s *reportService) List(
	ctx context.Context,
	q model.ListReportsQuery,
) (*model.PaginatedReports, error) {
	if q.Page < 1 {
		q.Page = 1
	}

	if q.PerPage < 1 {
		q.PerPage = 20
	}

	if q.PerPage > 100 {
		q.PerPage = 100
	}

	q.Type = strings.ToLower(strings.TrimSpace(q.Type))

	if q.Type != "" && q.Type != "lost" && q.Type != "found" {
		q.Type = ""
	}

	q.Search = strings.TrimSpace(q.Search)
	q.Status = strings.TrimSpace(q.Status)

	reports, users, categoryNames, locationNames, total, err := s.repo.List(
		ctx,
		q,
	)
	if err != nil {
		return nil, fmt.Errorf("list reports: %w", err)
	}

	data := make([]model.ReportResponse, 0, len(reports))

	for i, report := range reports {
		response := buildReportResponse(
			report,
			users[i],
			categoryNames[i],
			locationNames[i],
		)

		data = append(data, response)
	}

	totalPages := (total + q.PerPage - 1) / q.PerPage

	return &model.PaginatedReports{
		Data: data,
		Meta: model.PaginationMeta{
			Page:       q.Page,
			PerPage:    q.PerPage,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}

func (s *reportService) Update(
	ctx context.Context,
	userID string,
	role string,
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

	if report.UserID != uid && role != "admin" {
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

	report, user, categoryName, locationName, err := s.repo.FindByIDWithDetail(
		ctx,
		reportID,
	)
	if err != nil {
		return nil, fmt.Errorf("find updated report detail: %w", err)
	}

	response := buildReportResponse(
		report,
		user,
		categoryName,
		locationName,
	)

	return &response, nil
}

func (s *reportService) Delete(
	ctx context.Context,
	userID string,
	role string,
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

	if report.UserID != uid && role != "admin" {
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
	categoryID int,
	locationID int,
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

	return nil
}

func buildReportResponse(
	report *model.Report,
	user *model.ReportUserBrief,
	categoryName string,
	locationName string,
) model.ReportResponse {
	response := report.ToResponse()

	response.CategoryName = categoryName
	response.LocationName = locationName

	if user != nil {
		response.User = *user
	}

	return response
}
